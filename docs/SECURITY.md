# RakshAI — Security & Privacy Architecture

This document outlines the security controls, cryptographic safeguards, access policies, and data privacy mechanisms implemented in RakshAI.

---

## 1. Authentication & Authorization

### Session Authentication & JWT
RakshAI utilizes server-side verified JSON Web Tokens (JWT) managed through NextAuth.js. Client sessions are stored in HTTP-only, Secure, SameSite cookies.
- **Algorithm**: HMAC-SHA256 with minimum 32-byte secret keys.
- **Token Expiry**: Default 24-hour expiration with strict server-side validation.
- **Fail-Closed Policy**: If `NEXTAUTH_SECRET` is unset or malformed, server routes fail closed with HTTP 401/500 rather than bypassing authorization.

### Role-Based Access Control (RBAC)
Routes enforce fine-grained role checks:
- **`coordinator`**: Full access to create, match, review, approve, dispatch, and escalate blood requests; full access to ML prediction and RAG endpoints.
- **`patient`**: Can submit blood requests and view status of their own requests. Forbidden from triggering outreach, approving candidates, or accessing coordinator APIs.
- **`donor`**: Restricted to reading donor portal status and submitting availability; forbidden from clinical coordination routes.

Server-side API routes never trust client-supplied roles in request bodies. The role is extracted exclusively from the cryptographically verified JWT payload:

```typescript
// app/api/ml/predict-donor/route.ts
const session = await getServerSession(authOptions);
if (!session || !session.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
if (session.user.role !== "coordinator") {
  return NextResponse.json({ error: "Forbidden: Coordinator access required" }, { status: 403 });
}
```

### Internal Service Authentication
Communication between Next.js and the FastAPI ML host is authenticated via pre-shared API keys (`x-api-key: ML_SERVICE_API_KEY`). Missing or mismatched API keys result in immediate 403 Forbidden responses.

---

## 2. Inbound Webhook Security

Inbound donor SMS and WhatsApp messages represent an untrusted external ingress point. RakshAI implements a multi-layer defense:

### Cryptographic Signature Verification
- **Twilio SMS**: Validates the `X-Twilio-Signature` header using HMAC-SHA1 of the canonical webhook URL and sorted POST parameters.
- **Meta WhatsApp**: Validates the `X-Hub-Signature-256` header using HMAC-SHA256 of the raw body bytes.
- **Constant-Time Comparison**: All signature evaluations employ `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
- **Production Hardening**: In `NODE_ENV === "production"`, test bypass tokens (`valid-mock-signature`) are strictly forbidden and return HTTP 403.

### Replay Attack & Timestamp Protection
- Every webhook payload is checked for freshness against a **300-second (5-minute)** sliding window.
- Timestamps older than 300 seconds are rejected (`HTTP 401: Expired timestamp`).
- Timestamps skewed more than 60 seconds into the future are rejected (`HTTP 401: Future timestamp`).

### Persistent Message Deduplication
- Provider message IDs (`MessageSid`, `wamid`, etc.) are recorded persistently in `data/webhook_dedup.json` and MongoDB.
- Re-delivered webhooks are identified and acknowledged with `HTTP 200 { duplicate: true }` without triggering redundant business logic or state transitions.

### Sliding-Window Rate Limiting
- Webhook endpoints enforce an in-memory sliding window rate limit of **60 requests per minute** per sender telephone number / IP address.
- Exceeded thresholds return `HTTP 429 Too Many Requests` with a `Retry-After` header.

---

## 3. PII Masking & Clinical Privacy

Protecting patient and donor Personally Identifiable Information (PII) is a core system design requirement:

### Telephone Number Masking
- All telephone numbers displayed in logs, UI views, audit events, or notifications are sanitized using standard masking:
  - Raw: `+919876543210`
  - Masked: `+91 98*** **210`
- Helper function `maskPhoneNumber` is applied across both frontend and backend logging pipelines.

### Zero-PII Audit Trail
- The audit trail records clinical state transitions, timestamps, actor IDs, and clinical metadata.
- Raw donor and patient phone numbers, personal home addresses, and unredacted names are strictly excluded from audit event metadata.

### Donor Opt-Out & Telecom Compliance (STOP)
- Inbound messages containing `STOP`, `UNSUBSCRIBE`, `CANCEL`, `QUIT`, or `OPTOUT` are recognized deterministically.
- When an opt-out is received:
  1. The donor's phone number is added to the persistent `donor_opt_outs` registry.
  2. The donor is immediately de-scheduled from any active pending requests.
  3. The matching engine automatically excludes the donor from future candidate queries.
  4. The dispatch engine prevents any coordinator from manually targeting an opted-out donor.
  5. An automatic unsubscription confirmation is returned.

---

## 4. Clinical Decision Safeguards

- **No Autonomous Outreach**: No outreach notification can be dispatched by algorithms alone. Human coordinator approval is a hardcoded requirement.
- **ABO Compatibility Enforcement**: The coordination engine verifies ABO compatibility before candidates are presented, and re-validates compatibility at approval time.
- **Alloimmunization Risk Scoring**: Antigen cross-matching (e.g., Kell antibody detection) flags moderate and high risks before blood is transfused.
