# RakshAI — AI-Powered Blood Intelligence & Care Coordination

RakshAI is an AI-powered donor intelligence, clinical decision support, and transfusion care-coordination platform designed specifically for patients with chronic hematological disorders, with a primary focus on pediatric **Beta-Thalassemia Major**.

The platform bridges real-time clinical matching, predictive machine learning for donor response likelihood, guideline-grounded retrieval-augmented generation (RAG), and a human-in-the-loop care coordination workflow with omni-channel messaging adapters.

---

## 🏛 System Architecture

```
                       ┌───────────────────────────────────────────────┐
                       │           Next.js 16 Web Dashboard           │
                       │    (Coordinator, Patient, Donor Views)       │
                       └───────────────────────┬───────────────────────┘
                                               │
                   ┌───────────────────────────┴───────────────────────────┐
                   ▼                                                       ▼
      ┌─────────────────────────┐                             ┌─────────────────────────┐
      │   Client-Side Actions   │                             │  Next.js Server API     │
      │   (React Server/Client) │                             │  JWT & RBAC Middleware  │
      └─────────────────────────┘                             └────────────┬────────────┘
                                                                           │
                     ┌─────────────────────────────────────────────────────┼──────────────────────────────────┐
                     ▼                                                     ▼                                  ▼
        ┌─────────────────────────┐                           ┌─────────────────────────┐        ┌─────────────────────────┐
        │  FastAPI Inference Host │                           │   Coordination Engine   │        │ Inbound Webhook System  │
        │  • XGBoost Pipeline     │                           │   • 11-Stage Machine    │        │ • SMS (Twilio adapter)  │
        │  • Clinical RAG (BM25)  │                           │   • ABO & Phenotyping   │        │ • WhatsApp (Meta Cloud) │
        │  • API Key Auth Guard   │                           │   • Human Approval Gate │        │ • Replay / Deduplication│
        └─────────────────────────┘                           └────────────┬────────────┘        └────────────┬────────────┘
                                                                           │                                  │
                                                              ┌────────────┴──────────────────────────────────┴────────────┐
                                                              ▼                                                            ▼
                                                 ┌─────────────────────────┐                                  ┌─────────────────────────┐
                                                 │   Coordination Store    │                                  │ Notification Dispatcher │
                                                 │   • MongoDB Primary     │                                  │ • AWS SNS / Mock Adapter│
                                                 │   • Zero-Dep In-Memory  │                                  │ • Idempotency Engine    │
                                                 │   • File JSON Fallback  │                                  │ • Exponential Backoff   │
                                                 └─────────────────────────┘                                  └─────────────────────────┘
```

---

## 🚀 Key Platform Capabilities

1. **Deterministic ABO & Minor Antigen Matching**:
   - Implements immunohematological compatibility tables (O-, O+, A-, A+, B-, B+, AB-, AB+).
   - Minor antigen conflict detection (Kell, Rh phenotyping: C, c, E, e) to prevent alloimmunization in transfusion-dependent patients.
   - Proximity-based haversine distance filtering and 90-day minimum donation recency intervals.

2. **Donor Response Classification (Machine Learning)**:
   - Tuned XGBoost classifier evaluated via 5-Fold Nested GroupKFold cross-validation on 7,033 real donor records.
   - Prevents data leakage through donor ID grouping and pre-split feature engineering.
   - Fast sub-10ms inference deployed via FastAPI with dedicated API-key authentication.

3. **Clinical Guidelines RAG Engine**:
   - Ingests authoritative clinical corpora (e.g., Thalassemia International Federation Guidelines, DGHS/MoHFW India Standards).
   - High-precision BM25 token-level retrieval with 100% retrieval success rate and strict abstention on out-of-domain queries.
   - Seamless local execution with zero AWS cloud dependencies.

4. **11-Stage Blood Request Coordination Workflow**:
   - Enforces human-coordinator review: **automated donor outreach without human approval is strictly blocked by code**.
   - Pluggable notification dispatcher with cryptographic idempotency keys and retry policies.
   - Automatic SLA monitoring and escalation when donor response deadlines expire.

5. **Provider-Agnostic Inbound Webhook Ingestion**:
   - Deterministic message normalization across multilingual and informal inputs (`YES`, `NO`, `STOP`, `HELP`).
   - Cryptographic signature validation (Twilio HMAC-SHA1, Meta WhatsApp HMAC-SHA256).
   - Persistent deduplication and 5-minute sliding-window timestamp replay protection.
   - Telecom-compliant `STOP` opt-out management that persistently un-schedules donors and blocks future outreach.

6. **Auditing & Privacy Protection**:
   - Cryptographically linked audit trail recording every state transition, actor ID, and clinical decision.
   - Strict zero-PII policy: all telephone numbers, names, and contact details are masked across logs, webhooks, and UI views.

---

## 🛠 Local Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ or v24+ recommended with native ESM support)
- **Python**: v3.10 or later (v3.12 verified)
- **Git**

### 1. Repository Clone & Node Dependencies
```bash
git clone https://github.com/aishakhan1814/v0-raksha-ai-homepage.git
cd v0-raksha-ai-homepage
npm install
```

### 2. Python Environment Setup
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r backend/requirements.txt
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the project root:

```ini
# Application Authentication & NextAuth
NEXTAUTH_SECRET=your_nextauth_jwt_secret_min_32_chars
NEXTAUTH_URL=http://localhost:3000

# Backend FastAPI & ML Server
NEXT_PUBLIC_API_URL=http://localhost:8000
INTERNAL_ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_API_KEY=rakshaai_local_dev_key_2024

# Database (Optional: falls back to resilient in-memory/JSON store if omitted)
MONGODB_URI=mongodb://localhost:27017/rakshaai
MONGODB_DB=rakshaai

# Inbound Webhook Credentials (Optional: mock adapters active in development)
TWILIO_AUTH_TOKEN=mock_twilio_auth_token
WHATSAPP_APP_SECRET=mock_whatsapp_app_secret
WHATSAPP_VERIFY_TOKEN=rakshaai_webhook_verify_token

# Node Environment
NODE_ENV=development
```

---

## 🧪 Running Tests

The repository maintains **96 automated regression tests** across Node.js and Python.

### Run All Node.js Tests (70 Tests)
```bash
node --test tests/test_*.mjs
```
*Executes all test suites: Inbound Webhooks, Coordinator UI Helpers, API Routes, Coordination Workflow State Machine, RAG Client, Server Authorization, and End-to-End Integration.*

### Run All Python Tests (26 Tests)
```bash
# Windows PowerShell:
$env:PYTHONPATH=".;backend/app"
python -m unittest discover -s backend/app -p "test_*.py"

# Linux / macOS:
PYTHONPATH=".:backend/app" python -m unittest discover -s backend/app -p "test_*.py"
```
*Executes ML Inference Pipeline Tests (12 tests) and Clinical Guidelines RAG Evaluation (14 tests, 24 queries).*

---

## 🎬 Running the Local Coordination Demo

Execute the self-contained 9-stage coordination lifecycle demo:

```bash
node scripts/demo_local_coordination.mjs
```

This demonstrates:
1. Blood request creation for a thalassemia patient.
2. Proximity matching and minor antigen screening.
3. Coordinator approval gate (demonstrating blocked automated outreach).
4. Idempotent notification dispatch.
5. Inbound SMS webhook processing.
6. Fulfillment state transition.
7. SLA timeout escalation check.
8. Transfusion completion.
9. Audit trail verification with zero-PII masking.

---

## 📡 API Reference

### Coordination & Blood Requests
- `POST /api/coordination/requests` — Create blood request (Requires Auth)
- `GET /api/coordination/requests` — List blood requests with state filters
- `GET /api/coordination/requests/[id]` — Retrieve request details and candidates
- `POST /api/coordination/requests/[id]/match` — Run matching engine
- `POST /api/coordination/requests/[id]/review` — Human coordinator approval/rejection
- `POST /api/coordination/requests/[id]/dispatch` — Dispatch outreach notifications
- `POST /api/coordination/requests/[id]/escalate` — Trigger SLA escalation

### Inbound Webhooks
- `POST /api/coordination/webhooks/sms` — Inbound Twilio/SMS gateway responses
- `GET /api/coordination/webhooks/sms` — SMS webhook health check
- `POST /api/coordination/webhooks/whatsapp` — Inbound WhatsApp Business messages
- `GET /api/coordination/webhooks/whatsapp` — Meta Webhook challenge verification

### Machine Learning & Clinical RAG
- `POST /api/ml/predict-donor` — Predict donor response probability (Coordinator only)
- `POST /api/rag/query` — Query clinical transfusion guidelines (Coordinator only)

---

## 📄 License & Ethical Usage
Developed for non-profit blood intelligence research and care coordination. Built with privacy-first standards, zero-PII exposure, and strict human oversight for critical medical decisions.
