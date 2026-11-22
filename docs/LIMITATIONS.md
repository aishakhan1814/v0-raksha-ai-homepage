# RakshAI — Limitations & Operational Constraints

In accordance with engineering rigor and scientific integrity, this document provides an explicit, transparent accounting of current system limitations, simulated boundaries, and operational assumptions.

---

## 1. Cloud vs. Local Implementations

### AWS Infrastructure (Simulated / Local Mode)
- **Current State**: The repository is engineered to run locally with zero cloud spending ($0.00).
- **Bedrock Knowledge Bases / OpenSearch Serverless**: While infrastructure code (`serverless.yml`, Lambda templates) exists, active retrieval in the application is currently powered by a **local BM25 retrieval engine** (`backend/app/guidelines_engine.py`). No AWS Bedrock API calls or vector databases are billed.
- **Amazon SNS**: Outbound SMS messaging uses a pluggable adapter. In development and automated tests, `MockNotificationProvider` is the active provider. `AwsSnsNotificationProvider` is implemented and verified for E.164 payload structure, but live AWS SMS sending is deactivated.

### Twilio & Meta WhatsApp Messaging (Mock Adapters)
- **Current State**: Inbound webhook processing, signature verification, and intent normalization are fully implemented and cryptographically tested.
- **Paid Subscriptions**: No active paid Twilio phone numbers or Meta WhatsApp Business Cloud API numbers are bound. Tests and local demonstrations use simulated cryptographic payloads. Real-world activation requires providing live API credentials in `.env.local`.

### Database & Persistence (Resilient Dual-Tier)
- **Current State**: `CoordinationStore` supports both MongoDB Atlas and an in-memory/JSON store (`data/`). If a live MongoDB instance is unreachable, the system gracefully falls back to local persistence without downtime. In production deployment, a dedicated MongoDB cluster is required for high-availability multi-instance clustering.

---

## 2. Machine Learning Model Boundaries

- **Dataset Specificity**: The XGBoost classifier was trained exclusively on the **Blood Warriors dataset** (7,033 records), which reflects donor demographics, donation intervals, and contact patterns primarily in Hyderabad and Telangana, India.
- **Geographic Generalization**: Performance in other geographic regions (with different blood donation cultures, public transit dynamics, or telecommunications habits) has not been clinically evaluated and would require localized re-calibration.
- **Decision Support Role**: The model provides a predictive probability (0.0 to 1.0) of donor response likelihood to assist coordinators in ranking candidates. **It does not make clinical decisions, does not determine donor health, and never replaces donor blood screening.**

---

## 3. Clinical & Medical Disclaimer

- **Decision Support Only**: RakshAI is a care-coordination and clinical decision-support tool. It is **not** a diagnostic device, laboratory information management system (LIMS), or autonomous transfusion device.
- **Immunohematology Verification**: Automated minor antigen screening (e.g., Kell, C, c, E, e) is intended to highlight potential alloimmunization risks. Hospital blood bank cross-matching and Coombs tests remain mandatory clinical prerequisites prior to any blood transfusion.
- **Human Oversight**: The software strictly prevents autonomous donor outreach. A licensed care coordinator or physician must approve any outreach or transfusion arrangement.
