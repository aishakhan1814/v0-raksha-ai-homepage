# RakshAI — Architecture & System Design

This document details the architectural principles, component topology, state machine definitions, and extensibility patterns implemented in RakshAI.

---

## 1. Architectural Topology

RakshAI follows a modular, decoupled architecture where clinical safety, data integrity, and deterministic guarantees take precedence over autonomous execution.

```
+-----------------------------------------------------------------------------------+
|                                PRESENTATION TIER                                  |
|   Next.js 16 App Router | Tailwind CSS | Radix UI | Coordinator Console           |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / JSON
                                           v
+-----------------------------------------------------------------------------------+
|                             APPLICATION & API TIER                                |
|   • NextAuth Session & JWT Validation (Role-based access: coordinator, patient)   |
|   • Server-Side Authorization Guards (Fail-closed on missing credentials)         |
|   • Next.js Route Handlers (/api/coordination/*, /api/ml/*, /api/rag/*)           |
+-------------------+----------------------+-------------------+--------------------+
                    |                      |                   |
                    v                      v                   v
+-----------------------+ +-----------------------+ +-------------------------------+
| COORDINATION ENGINE   | | INBOUND WEBHOOK HUB   | | FASTAPI ML & RAG HOST         |
| • 11-Stage Lifecycle  | | • Signature Verifier  | | • XGBoost Pipeline Inference  |
| • Matching Rules (ABO)| | • Replay Guard (<300s)| | • BM25 Clinical RAG Engine    |
| • Human Approval Gate | | • Deduplicator        | | • API-Key Authentication      |
| • SLA Escalation Clock| | • Intent Normalizer   | | • Pydantic Schema Validation  |
+-----------+-----------+ +-----------+-----------+ +-------------------------------+
            |                         |
            +------------+------------+
                         |
                         v
+-----------------------------------------------------------------------------------+
|                            INTEGRATION & PERSISTENCE                              |
|   • CoordinationStore (MongoDB Atlas Primary -> Resilient Local JSON Fallback)    |
|   • NotificationDispatcher (AWS SNS Provider / Local Mock Provider)               |
|   • Opt-Out & Idempotency Storage (Survives server restarts)                      |
+-----------------------------------------------------------------------------------+
```

---

## 2. The 11-Stage Blood Request State Machine

A blood request transitions through deterministic, strictly enforced lifecycle states. Any illegal state transition throws an immediate runtime error.

```
       [ CREATED ]
            |
            v
       [ MATCHING ]
            |
            v
[ PENDING_COORDINATOR_REVIEW ]
      /                    \
     /                      \
    v                        v
[ COORDINATOR_REJECTED ]   [ COORDINATOR_APPROVED ]
    |                                |
    +--------> (Rematch)             v
                           [ OUTREACH_IN_PROGRESS ]
                                     |
                                     v
                          [ AWAITING_RESPONSES ] <--------------------+
                                /         \                           |
                               /           \                          |
                              v             v                         |
                    [ PARTIALLY_ACCEPTED ]  [ ESCALATED ] ------------+
                              |                    |
                              v                    v
                    [ ACCEPTED_FULFILLED ]    [ COMPLETED ]
                              |
                              v
                        [ COMPLETED ]
```

### Valid Transition Matrix

| Current State | Permitted Next States | Trigger Action | Guardrail Enforced |
| :--- | :--- | :--- | :--- |
| `CREATED` | `MATCHING`, `CANCELLED` | `MATCHING_STARTED` | Input validation passed |
| `MATCHING` | `PENDING_COORDINATOR_REVIEW`, `CANCELLED` | `MATCHES_GENERATED` | Proximity & ABO checks |
| `PENDING_COORDINATOR_REVIEW`| `COORDINATOR_APPROVED`, `COORDINATOR_REJECTED`, `MATCHING`, `CANCELLED` | `COORDINATOR_APPROVED` / `COORDINATOR_REJECTED` | **Human coordinator role strictly required** |
| `COORDINATOR_APPROVED` | `OUTREACH_PENDING`, `OUTREACH_IN_PROGRESS`, `CANCELLED` | `OUTREACH_STARTED` | Approved donor IDs exist |
| `OUTREACH_IN_PROGRESS` | `AWAITING_RESPONSES`, `CANCELLED` | `OUTREACH_DISPATCHED` | Notifications sent; SLA deadline set |
| `AWAITING_RESPONSES` | `PARTIALLY_ACCEPTED`, `ACCEPTED_FULFILLED`, `ESCALATED`, `CANCELLED` | `DONOR_ACCEPTED` / `DONOR_DECLINED` / `TIMEOUT` | Inbound webhook or timeout tick |
| `PARTIALLY_ACCEPTED` | `ACCEPTED_FULFILLED`, `ESCALATED`, `CANCELLED` | `DONOR_ACCEPTED` / `TIMEOUT` | Units tally verified |
| `ACCEPTED_FULFILLED` | `COMPLETED`, `CANCELLED` | `REQUEST_COMPLETED` | Target transfusion fulfilled |
| `ESCALATED` | `ACCEPTED_FULFILLED`, `COMPLETED`, `MATCHING`, `CANCELLED` | `REMATCH` / `EXTERNAL_ACQUISITION` | Coordinator re-intervention |
| `COMPLETED` | *(Terminal State)* | None | Record sealed |
| `CANCELLED` | *(Terminal State)* | None | Reason recorded in audit trail |

---

## 3. Human-in-the-Loop Safeguard

Automated outreach without coordinator approval is strictly prohibited at the code level:

```typescript
// lib/coordination/engine.ts
if (request.status !== "COORDINATOR_APPROVED") {
  throw new Error(
    `Safety Violation: Automated outreach is forbidden without explicit coordinator approval (current status: '${request.status}')`
  );
}
```

This ensures an immunohematologist or qualified care coordinator verifies:
1. Patient antibody history against donor extended phenotyping (Kell, Rh).
2. Transfusion urgency and clinical volume requirements.
3. Appropriate candidate selection before real-world outreach.

---

## 4. Inbound Webhook Architecture

Inbound SMS and WhatsApp messages from donors pass through four security layers before reaching the coordination state machine:

```
Inbound HTTP Request
       │
       ▼
[ Layer 1: Signature Verification ] ──> Twilio HMAC-SHA1 / Meta HMAC-SHA256
       │                                (Mock signatures forbidden in production)
       ▼
[ Layer 2: Freshness & Replay Guard ] ─> Timestamp within 300s window; future timestamps rejected
       │
       ▼
[ Layer 3: Persistent Deduplication ] ─> ProviderMessageId checked against disk/database cache
       │
       ▼
[ Layer 4: Semantic Normalization ] ───> Multi-lingual token parser: ACCEPTED, DECLINED, HELP, OPT_OUT, UNKNOWN
       │
       ▼
[ Coordination Engine Dispatch ] ─────> Verifies sender has active outreach record; records response
```

---

## 5. Extensibility via the Adapter Pattern

RakshAI isolates external infrastructure behind stable interfaces:

1. **`InboundWebhookAdapter`**:
   - `SmsWebhookAdapter`: Parses Twilio / generic SMS JSON or form-urlencoded POSTs.
   - `WhatsAppWebhookAdapter`: Unpacks Meta WhatsApp Cloud API webhooks.
   - Enables dropping in any future aggregator (e.g., Gupshup, Exotel) without modifying core business logic.

2. **`NotificationProvider`**:
   - `AwsSnsNotificationProvider`: Dispatches transactional SMS via AWS SNS.
   - `MockNotificationProvider`: In-memory provider for deterministic local testing and demo runs.

3. **`CoordinationStore`**:
   - Primary: MongoDB Atlas database.
   - Fallback: Local file-backed JSON store (`data/`) and in-memory cache, ensuring the application functions flawlessly offline or in sandbox environments.
