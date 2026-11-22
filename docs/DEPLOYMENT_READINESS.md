# RakshAI — Cloud Deployment Readiness & Migration Runbook

This runbook outlines the required infrastructure, IAM policies, configuration checklists, and estimated operating costs for migrating RakshAI from local resilient mode to a production cloud environment.

---

## 1. Pre-Deployment Readiness Checklist

- [x] **Zero Hardcoded Secrets**: All keys, passwords, and tokens are read exclusively from environment variables or AWS Secrets Manager.
- [x] **Zero-PII Compliance**: Phone numbers, patient identities, and donor records are masked in all logs, UI helpers, and audit stores.
- [x] **Automated Regression**: 96 / 96 automated tests passing (70 Node.js + 26 Python).
- [x] **Human Safeguards Enforced**: Automated outreach blocked without coordinator approval.
- [x] **STOP / Opt-Out Support**: Deterministic unsubscription mechanism implemented and compliant with telecom regulations.
- [x] **Idempotency & Replay Protection**: Webhook and notification dispatches protected against duplicate deliveries.
- [ ] **Production Domain & TLS**: Bound to custom domain with SSL/TLS certificates.
- [ ] **Live Provider Credentials**: Twilio Auth Token, WhatsApp App Secret, and AWS IAM profile configured.
- [ ] **Dedicated MongoDB Atlas Cluster**: M10+ tier provisioned with VPC peering or IP whitelist.

---

## 2. Target Cloud Architecture

```
                          [ Internet / Donors & Coordinators ]
                                          │
                                          ▼
                             [ AWS CloudFront / Vercel ]
                                 (TLS Termination)
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
       [ Next.js Production App ]                      [ FastAPI ML & RAG ]
          (AWS ECS / Vercel)                            (AWS ECS / Lambda)
                  │                                               │
      ┌───────────┴───────────┐                       ┌───────────┴───────────┐
      ▼                       ▼                       ▼                       ▼
[ MongoDB Atlas ]     [ AWS SNS SMS ]          [ S3 Corpus ]     [ Amazon Bedrock ]
(Transfusion State)   (Transactional)          (Guidelines)       (Titan / Claude)
```

---

## 3. Required AWS IAM Policies

To deploy with the `rakshai-dev` profile in `ap-south-1`, the deployment IAM role requires:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:Retrieve",
        "bedrock:RetrieveAndGenerate"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SnsOutreachAccess",
      "Effect": "Allow",
      "Action": [
        "sns:Publish",
        "sns:SetSMSAttributes",
        "sns:GetSMSAttributes"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3CorpusAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::rakshai-guidelines-corpus-*",
        "arn:aws:s3:::rakshai-guidelines-corpus-*/*"
      ]
    },
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:ap-south-1:*:secret:RakshaSecrets-*"
    }
  ]
}
```

---

## 4. Estimated Monthly Operating Costs (Production Cloud)

| Cloud Resource | Specification / Tier | Estimated Monthly Cost (USD) |
| :--- | :--- | :--- |
| **Next.js Web Hosting** | Vercel Pro or AWS ECS Fargate (2 tasks, 0.5 vCPU) | \$20.00 – \$40.00 |
| **FastAPI ML & Inference** | AWS ECS Fargate or Lambda Container | \$15.00 – \$25.00 |
| **Amazon Bedrock (RAG)** | Claude 3.5 Sonnet / Titan Embeddings (~500 queries/day) | \$15.00 – \$35.00 |
| **Amazon SNS (SMS Outreach)** | Transactional SMS (~1,000 messages/mo in India) | \$5.00 – \$10.00 |
| **WhatsApp Business API** | Meta Cloud API (~500 conversations/mo) | \$10.00 – \$25.00 |
| **MongoDB Atlas** | M10 Cluster (General purpose, multi-AZ) | \$60.00 |
| **AWS CloudWatch & Secrets** | Logs, alarms, and Secrets Manager | \$5.00 |
| **TOTAL ESTIMATED COST** | | **\$130.00 – \$200.00 / month** |

---

## 5. Rollback Procedures & Incident Response

1. **Immediate Health Check Failure**:
   - If FastAPI container fails preflight or health check (`GET /health`), the Next.js API routes gracefully degrade with HTTP 503 instead of crashing.
2. **Database Connectivity Outage**:
   - `CoordinationStore` detects connection loss to MongoDB and switches seamlessly to local in-memory/JSON store caching, preventing data loss during transient network partitions.
3. **SMS / Webhook Gateway Failure**:
   - `NotificationDispatcher` retries failed deliveries with exponential backoff up to 3 attempts.
   - If all retries fail, delivery status is marked `FAILED` and recorded in the audit trail without interrupting the coordination state machine.
4. **Instant Cloud Rollback**:
   - Use Git tag rollbacks with standard continuous delivery:
     ```bash
     git revert <commit-hash>
     git push origin main
     ```
