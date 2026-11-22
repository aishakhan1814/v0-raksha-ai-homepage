# RakshAI — Testing Strategy & Test Suite Guide

RakshAI maintains a rigorous automated testing framework covering all tiers of the application: security boundaries, machine learning inference, RAG retrieval accuracy, and the complete 11-stage coordination state machine.

---

## 1. Test Suite Summary

| Suite / Component | Language / Runner | Files | Test Count | Pass Rate |
| :--- | :--- | :--- | :--- | :--- |
| **Coordination API Routes** | Node.js Test Runner | `tests/test_coordination_api_routes.mjs` | 3 | 100% |
| **Coordinator Console UI Helpers** | Node.js Test Runner | `tests/test_coordination_dashboard_ui.mjs` | 11 | 100% |
| **Coordination State Machine & Workflow** | Node.js Test Runner | `tests/test_donor_coordination_workflow.mjs` | 16 | 100% |
| **Inbound Webhook Security & Ingestion** | Node.js Test Runner | `tests/test_inbound_webhooks.mjs` | 20 | 100% |
| **Next.js to FastAPI ML Integration** | Node.js Test Runner | `tests/test_end_to_end_integration.mjs` | 7 | 100% |
| **RAG Query Client Route** | Node.js Test Runner | `tests/test_rag_endpoint.mjs` | 6 | 100% |
| **JWT & Server-Side Authorization** | Node.js Test Runner | `tests/test_server_authorization.mjs` | 7 | 100% |
| **FastAPI ML Inference Pipeline** | Python `unittest` | `backend/app/test_predict_endpoint.py` | 12 | 100% |
| **Clinical Guidelines RAG Engine** | Python `unittest` | `backend/app/test_rag_pipeline.py` | 14 | 100% |
| **TOTAL** | | **9 Test Files** | **96 Tests** | **100%** |

---

## 2. Running Automated Tests

### Node.js Regression Suite (70 Tests)
Runs all unit, integration, and security tests without requiring a running web server:

```bash
node --test tests/test_*.mjs
```

### Python ML & RAG Suite (26 Tests)
Runs ML model verification and the 24 clinical query RAG evaluation:

```bash
# Windows PowerShell:
$env:PYTHONPATH=".;backend/app"
python -m unittest discover -s backend/app -p "test_*.py"

# Linux / macOS:
PYTHONPATH=".:backend/app" python -m unittest discover -s backend/app -p "test_*.py"
```

---

## 3. Test Categories & Verification Scope

### A. Webhook Security & Resiliency (`test_inbound_webhooks.mjs`)
- Valid SMS and WhatsApp response parsing.
- HMAC-SHA1 and HMAC-SHA256 signature verification.
- Rejection of forged and missing signatures.
- Sliding-window timestamp freshness (300-second limit).
- Persistent deduplication surviving process restarts.
- Rate limiter blocking burst floods (>60 req/min).
- STOP / Opt-out normalization and donor exclusion.
- Strict outreach verification (rejecting responses from senders without valid outreach records).

### B. Coordination State Machine (`test_donor_coordination_workflow.mjs`)
- Strict lifecycle state transitions (`CREATED` through `COMPLETED`).
- Illegal transition rejection.
- Proximity-based haversine distance matching.
- Hard filter: Major ABO compatibility.
- Hard filter: 90-day minimum donation recency.
- Alloimmunization risk calculation (Kell, Rh phenotyping).
- Human coordinator approval guardrail.
- Idempotent notification delivery and retry policies.
- Automatic SLA timeout escalation.

### C. Server-Side Authorization (`test_server_authorization.mjs`)
- Missing, malformed, or expired JWT tokens return HTTP 401.
- Tampered token signatures fail verification.
- Non-coordinator tokens (donor/patient) on coordinator routes return HTTP 403.
- Client-supplied role spoofing in request bodies is ignored.

### D. ML Inference Pipeline (`backend/app/test_predict_endpoint.py`)
- Standardized feature contract validation (`days_since_last_donation`, `donation_frequency`, `distance_km`, `prev_response_rate`, etc.).
- Missing required features trigger Pydantic HTTP 422 errors.
- Sub-10ms inference latency verification.
- Model artifact loading integrity from `rakshai_xgboost_pipeline.joblib`.

### E. Clinical Guidelines RAG Evaluation (`backend/app/test_rag_pipeline.py`)
- 24 standardized clinical transfusion evaluation cases:
  - 22 in-domain questions (e.g., pre-transfusion Hb targets, iron chelation ferritin thresholds, washed RBC indications).
  - 2 out-of-domain unanswerable queries (testing model abstention).
- Validates 100% retrieval success rate.
- Validates 100% citation correctness.
- Validates 100% abstention correctness on out-of-scope clinical queries.
