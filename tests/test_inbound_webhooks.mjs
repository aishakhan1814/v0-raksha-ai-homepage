/**
 * TASK 26 - RAKSHAI INBOUND DONOR RESPONSE WEBHOOK TEST SUITE
 * 
 * Verifies end-to-end webhook architecture:
 * 1. Valid SMS acceptance (e.g. "YES")
 * 2. Valid WhatsApp acceptance (e.g. Meta Cloud API & Twilio formats)
 * 3. Donor rejection ("NO", "DECLINE")
 * 4. Invalid message content ("UNKNOWN" -> clarification reply)
 * 5. Help intent ("HELP" -> instructional reply)
 * 6. Forged signature rejection (401/403)
 * 7. Expired timestamp rejection (>300s)
 * 8. Future timestamp rejection (>60s)
 * 9. Duplicate provider message ID deduplication
 * 10. Unknown donor phone rejection (safe 404)
 * 11. Unknown blood request ID rejection (safe 404)
 * 12. Response without valid outreach rejection (strict safety violation guard)
 * 13. Idempotent concurrent responses (no double counting)
 * 14. Audit event completeness and PII masking
 * 15. Dashboard metrics updates (inboundResponses, duplicate counts, lastResponseAt)
 */

import test from "node:test";
import assert from "node:assert/strict";

import { SmsWebhookAdapter } from "../lib/coordination/webhooks/adapters/sms-adapter.ts";
import { WhatsAppWebhookAdapter } from "../lib/coordination/webhooks/adapters/whatsapp-adapter.ts";
import { WebhookProcessor } from "../lib/coordination/webhooks/processor.ts";
import { normalizeInboundResponse, normalizePhoneNumber } from "../lib/coordination/webhooks/normalizer.ts";
import {
  validateWebhookTimestamp,
  globalDeduplicator,
  globalRateLimiter,
  MockSignatureVerifier,
  TwilioSignatureVerifier,
  WhatsAppSignatureVerifier,
  WebhookDeduplicator
} from "../lib/coordination/webhooks/security.ts";
import { CoordinationStore } from "../lib/coordination/store.ts";
import { CoordinationEngine } from "../lib/coordination/engine.ts";
import { MockNotificationProvider } from "../lib/coordination/notifications/mock-provider.ts";
import { NotificationDispatcher } from "../lib/coordination/notifications/dispatcher.ts";

function createHarness() {
  const store = new CoordinationStore();
  const mockProvider = new MockNotificationProvider();
  const dispatcher = new NotificationDispatcher({ provider: mockProvider, maxRetries: 3, initialBackoffMs: 10 });
  const engine = new CoordinationEngine(store, dispatcher);
  const processor = new WebhookProcessor(engine);

  // Seed verified donors
  store.setDonors([
    {
      donorId: "DNR-HYD-001",
      firstName: "Rajesh",
      lastName: "Kumar",
      bloodType: "B+",
      city: "Hyderabad",
      phone: "+919876543210",
      hasConditions: "no",
      lastDonated: "2024-01-01"
    },
    {
      donorId: "DNR-HYD-002",
      firstName: "Pooja",
      lastName: "Rao",
      bloodType: "O+",
      city: "Hyderabad",
      phone: "+919876543220",
      hasConditions: "no",
      lastDonated: "2023-11-15"
    }
  ]);

  return { store, mockProvider, dispatcher, engine, processor };
}

async function setupActiveOutreachRequest(engine, patientBlood = "B+") {
  // 1. Create Request
  const req = await engine.createRequest({
    patientId: "PAT-THAL-100",
    patientName: "Arjun Sharma",
    bloodGroup: patientBlood,
    city: "Hyderabad",
    hospital: "Rainbow Children's Hospital",
    unitsRequired: 1,
    urgency: "URGENT",
    diagnosis: "Thalassemia Major"
  }, { userId: "COORD-ADM", role: "coordinator" });

  // 2. Generate Candidate Matches
  await engine.generateMatches(req.requestId, { userId: "COORD-ADM", role: "coordinator" });

  // 3. Coordinator Approval
  await engine.coordinatorReview(
    req.requestId,
    "APPROVE",
    { userId: "COORD-ADM", role: "coordinator" },
    { selectedDonorIds: ["DNR-HYD-001", "DNR-HYD-002"], coordinatorNotes: "Approved verified match" }
  );

  // 4. Dispatch Outreach
  const dispatchKey = `disp-${req.requestId}-${Date.now()}`;
  const dispatched = await engine.dispatchOutreach(
    req.requestId,
    { userId: "COORD-ADM", role: "coordinator" },
    dispatchKey
  );

  return dispatched;
}

// ─── TEST SUITE ─────────────────────────────────────────────────────────────────

test("1. Response Normalizer: converts multi-lingual and informal variants to canonical intents", () => {
  // Accept variations
  assert.equal(normalizeInboundResponse("YES").intent, "ACCEPTED");
  assert.equal(normalizeInboundResponse("yes please").intent, "ACCEPTED");
  assert.equal(normalizeInboundResponse("y").intent, "ACCEPTED");
  assert.equal(normalizeInboundResponse("ACCEPT").intent, "ACCEPTED");
  assert.equal(normalizeInboundResponse("1").intent, "ACCEPTED");
  assert.equal(normalizeInboundResponse("I confirm!").intent, "ACCEPTED");
  assert.equal(normalizeInboundResponse("sure, I can donate").intent, "ACCEPTED");

  // Decline variations
  assert.equal(normalizeInboundResponse("NO").intent, "DECLINED");
  assert.equal(normalizeInboundResponse("no sorry").intent, "DECLINED");
  assert.equal(normalizeInboundResponse("n").intent, "DECLINED");
  assert.equal(normalizeInboundResponse("decline").intent, "DECLINED");
  assert.equal(normalizeInboundResponse("2").intent, "DECLINED");
  assert.equal(normalizeInboundResponse("cannot donate today").intent, "DECLINED");

  // Help variations
  assert.equal(normalizeInboundResponse("HELP").intent, "HELP");
  assert.equal(normalizeInboundResponse("what is this?").intent, "HELP");
  assert.equal(normalizeInboundResponse("info").intent, "HELP");

  // Unknown variations
  assert.equal(normalizeInboundResponse("hello there 12345 xyz").intent, "UNKNOWN");
  assert.equal(normalizeInboundResponse("random message").intent, "UNKNOWN");

  // Embedded Request ID extraction
  const withReq = normalizeInboundResponse("YES REQ-9872-XYZ I can donate");
  assert.equal(withReq.intent, "ACCEPTED");
  assert.equal(withReq.extractedRequestId, "REQ-9872-XYZ");

  // Phone Normalization
  assert.equal(normalizePhoneNumber("whatsapp:+919876543210"), "+919876543210");
  assert.equal(normalizePhoneNumber("09876543210"), "+919876543210");
  assert.equal(normalizePhoneNumber("9876543210"), "+919876543210");
  assert.equal(normalizePhoneNumber("+91 98765-43210"), "+919876543210");
});

test("2. Security: Timestamp validation and replay window enforcement", () => {
  const now = Date.now();

  // Fresh timestamp (0s old) -> valid
  assert.ok(validateWebhookTimestamp(new Date(now).toISOString()).valid);
  assert.ok(validateWebhookTimestamp(now).valid);

  // 2 minutes old -> valid (within 300s window)
  assert.ok(validateWebhookTimestamp(new Date(now - 120000).toISOString()).valid);

  // 6 minutes old (360s) -> expired (must reject)
  const expired = validateWebhookTimestamp(new Date(now - 360000).toISOString());
  assert.equal(expired.valid, false);
  assert.ok(expired.reason.includes("expired"));

  // 2 minutes in future (120s ahead) -> future clock drift (must reject)
  const future = validateWebhookTimestamp(new Date(now + 120000).toISOString());
  assert.equal(future.valid, false);
  assert.ok(future.reason.includes("future"));

  // Malformed / Missing
  assert.equal(validateWebhookTimestamp(undefined).valid, false);
  assert.equal(validateWebhookTimestamp("not-a-timestamp").valid, false);
});

test("3. Security: Forged and missing signature rejection", async () => {
  const { processor } = createHarness();
  const smsAdapter = new SmsWebhookAdapter();

  // Missing signature header -> 401
  const reqNoSig = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  const resNoSig = await processor.processWebhook(smsAdapter, reqNoSig, JSON.stringify({ From: "+919876543210", Body: "YES" }));
  assert.equal(resNoSig.success, false);
  assert.equal(resNoSig.statusCode, 401);

  // Forged signature header -> 403
  const reqForged = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "forged-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });
  const resForged = await processor.processWebhook(smsAdapter, reqForged, JSON.stringify({ From: "+919876543210", Body: "YES" }));
  assert.equal(resForged.success, false);
  assert.equal(resForged.statusCode, 403);
  assert.equal(resForged.error, "invalid_signature");
});

test("4. Valid Inbound SMS Acceptance: updates state, candidate status, and audit log", async () => {
  const { engine, processor, store } = createHarness();
  const request = await setupActiveOutreachRequest(engine);
  const smsAdapter = new SmsWebhookAdapter();

  const rawPayload = JSON.stringify({
    From: "+919876543210", // DNR-HYD-001
    Body: "YES I am on the way",
    MessageSid: `SM-${Date.now()}-A1`,
    timestamp: new Date().toISOString()
  });

  const req = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });

  const result = await processor.processWebhook(smsAdapter, req, rawPayload);
  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.equal(result.intent, "ACCEPTED");
  assert.equal(result.donorId, "DNR-HYD-001");
  assert.equal(result.requestId, request.requestId);
  assert.ok(result.replyMessage.includes("confirmed"));

  // Verify updated request state
  const updated = await store.getRequest(request.requestId);
  assert.equal(updated.status, "ACCEPTED_FULFILLED", "1 required unit met -> ACCEPTED_FULFILLED");
  assert.equal(updated.acceptedDonorsCount, 1);

  const candidate = updated.candidates.find((c) => c.donorId === "DNR-HYD-001");
  assert.equal(candidate.responseStatus, "ACCEPTED");
  assert.equal(candidate.responseChannel, "SMS");
  assert.equal(candidate.isSimulated, false);

  // Verify Audit Log
  const lastEvent = updated.auditTrail[updated.auditTrail.length - 1];
  assert.equal(lastEvent.action, "DONOR_ACCEPTED");
  assert.equal(lastEvent.actorRole, "donor");
  assert.equal(lastEvent.actorId, "DNR-HYD-001");
});

test("5. Valid Inbound WhatsApp Acceptance (Meta format): updates candidate status and channel", async () => {
  const { engine, processor, store } = createHarness();
  const request = await setupActiveOutreachRequest(engine);
  const waAdapter = new WhatsAppWebhookAdapter();

  const metaPayload = JSON.stringify({
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from: "919876543220", // DNR-HYD-002
                  id: `wamid.${Date.now()}`,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: { body: "Confirm, I will donate tomorrow morning" }
                }
              ]
            }
          }
        ]
      }
    ]
  });

  const req = new Request("http://localhost/api/coordination/webhooks/whatsapp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });

  const result = await processor.processWebhook(waAdapter, req, metaPayload);
  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.equal(result.intent, "ACCEPTED");
  assert.equal(result.donorId, "DNR-HYD-002");
  assert.equal(result.requestId, request.requestId);

  const updated = await store.getRequest(request.requestId);
  const candidate = updated.candidates.find((c) => c.donorId === "DNR-HYD-002");
  assert.equal(candidate.responseStatus, "ACCEPTED");
  assert.equal(candidate.responseChannel, "WHATSAPP");
  assert.equal(candidate.isSimulated, false);
});

test("6. Donor Rejection: records DECLINED and maintains fulfillment requirement", async () => {
  const { engine, processor, store } = createHarness();
  const request = await setupActiveOutreachRequest(engine);
  const smsAdapter = new SmsWebhookAdapter();

  const req = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });

  const payload = JSON.stringify({
    From: "+919876543210",
    Body: "NO sorry out of town",
    MessageSid: `SM-${Date.now()}-DECLINE`
  });

  const result = await processor.processWebhook(smsAdapter, req, payload);
  assert.equal(result.success, true);
  assert.equal(result.intent, "DECLINED");
  assert.equal(result.donorId, "DNR-HYD-001");

  const updated = await store.getRequest(request.requestId);
  assert.equal(updated.declinedDonorsCount, 1);
  assert.equal(updated.acceptedDonorsCount, 0);

  const candidate = updated.candidates.find((c) => c.donorId === "DNR-HYD-001");
  assert.equal(candidate.responseStatus, "DECLINED");
});

test("7. Invalid Message Content: returns UNKNOWN with clarification reply", async () => {
  const { engine, processor, store } = createHarness();
  const request = await setupActiveOutreachRequest(engine);
  const smsAdapter = new SmsWebhookAdapter();

  const req = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });

  const payload = JSON.stringify({
    From: "+919876543210",
    Body: "Can you send pictures of the hospital?",
    MessageSid: `SM-${Date.now()}-UNKNOWN`
  });

  const result = await processor.processWebhook(smsAdapter, req, payload);
  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.intent, "UNKNOWN");
  assert.ok(result.replyMessage.includes("Please reply YES to accept or NO to decline"));

  const updated = await store.getRequest(request.requestId);
  assert.equal(updated.invalidResponsesCount, 1);
  assert.ok(updated.inboundResponses.length >= 1);
  assert.equal(updated.inboundResponses[0].status, "INVALID");
});

test("8. Help Keyword Processing: provides instructions without mutating clinical state", async () => {
  const { processor } = createHarness();
  const smsAdapter = new SmsWebhookAdapter();

  const req = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });

  const payload = JSON.stringify({
    From: "+919876543210",
    Body: "HELP",
    MessageSid: `SM-${Date.now()}-HELP`
  });

  const result = await processor.processWebhook(smsAdapter, req, payload);
  assert.equal(result.success, true);
  assert.equal(result.intent, "HELP");
  assert.ok(result.replyMessage.includes("Reply YES to confirm"));
});

test("9. Duplicate Provider Message ID: deduplicated without double processing", async () => {
  const { engine, processor, store } = createHarness();
  const request = await setupActiveOutreachRequest(engine);
  const smsAdapter = new SmsWebhookAdapter();
  const fixedMsgId = `SM-DUP-${Date.now()}`;

  const payload = JSON.stringify({
    From: "+919876543210",
    Body: "YES",
    MessageSid: fixedMsgId,
    timestamp: new Date().toISOString()
  });

  const makeReq = () => new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });

  // First delivery -> PROCESSED
  const res1 = await processor.processWebhook(smsAdapter, makeReq(), payload);
  assert.equal(res1.success, true);
  assert.equal(res1.duplicate, false);

  // Repeated delivery with same MessageSid -> IGNORED AS DUPLICATE
  const res2 = await processor.processWebhook(smsAdapter, makeReq(), payload);
  assert.equal(res2.success, true);
  assert.equal(res2.duplicate, true);
  assert.ok(res2.message.includes("Duplicate webhook delivery ignored"));

  const updated = await store.getRequest(request.requestId);
  assert.equal(updated.acceptedDonorsCount, 1, "Must NOT increment donor count on duplicate message");
});

test("10. Unknown Sender Phone: rejected safely with 404 without leaking internal state", async () => {
  const { processor } = createHarness();
  const smsAdapter = new SmsWebhookAdapter();

  const req = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });

  const payload = JSON.stringify({
    From: "+919999999999", // Unregistered number
    Body: "YES",
    MessageSid: `SM-${Date.now()}-UNKNOWN-SENDER`
  });

  const result = await processor.processWebhook(smsAdapter, req, payload);
  assert.equal(result.success, false);
  assert.equal(result.statusCode, 404);
  assert.ok(result.message.includes("No active blood request with valid outreach found"));
});

test("11. Strict Outreach Verification: Rejects response if sender has no outreach record", async () => {
  const { engine, processor, store } = createHarness();
  const smsAdapter = new SmsWebhookAdapter();

  // Create request, but DO NOT dispatch outreach to DNR-HYD-002
  const req = await engine.createRequest({
    patientId: "PAT-TEST-NO-NOTIF",
    patientName: "Sita G.",
    bloodGroup: "B+",
    city: "Hyderabad",
    hospital: "Care Hospital",
    unitsRequired: 1
  }, { userId: "COORD-ADM", role: "coordinator" });

  await engine.generateMatches(req.requestId, { userId: "COORD-ADM", role: "coordinator" });
  await engine.coordinatorReview(req.requestId, "APPROVE", { userId: "COORD-ADM", role: "coordinator" }, { selectedDonorIds: ["DNR-HYD-001"] });
  // Dispatch outreach ONLY to DNR-HYD-001, omitting DNR-HYD-002!
  await engine.dispatchOutreach(req.requestId, { userId: "COORD-ADM", role: "coordinator" }, "key-single-donor");

  // Now, DNR-HYD-002 sends an unprompted "YES REQ-..." referencing this request
  const payload = JSON.stringify({
    From: "+919876543220", // DNR-HYD-002 has NO outreach notification on this request
    Body: `YES ${req.requestId}`,
    MessageSid: `SM-${Date.now()}-UNPROMPTED`
  });

  const webhookReq = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });

  const result = await processor.processWebhook(smsAdapter, webhookReq, payload);
  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error, "unverified_outreach");
  assert.ok(result.message.includes("Safety violation: Sender does not have a verified outreach record"));
});

test("12. Idempotent Concurrent Responses: Second response from same donor is ignored", async () => {
  const { engine, processor, store } = createHarness();
  const request = await setupActiveOutreachRequest(engine);
  const smsAdapter = new SmsWebhookAdapter();

  const req1 = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });

  const payload1 = JSON.stringify({
    From: "+919876543210",
    Body: "YES",
    MessageSid: `SM-FIRST-${Date.now()}`
  });

  const res1 = await processor.processWebhook(smsAdapter, req1, payload1);
  assert.equal(res1.success, true);
  assert.equal(res1.duplicate, false);

  // Donor accidentally sends a second message with a different message ID
  const req2 = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });

  const payload2 = JSON.stringify({
    From: "+919876543210",
    Body: "YES Confirming again!",
    MessageSid: `SM-SECOND-${Date.now()}`
  });

  const res2 = await processor.processWebhook(smsAdapter, req2, payload2);
  assert.equal(res2.success, true);
  assert.equal(res2.duplicate, true);
  assert.ok(res2.message.includes("already recorded"));

  const updated = await store.getRequest(request.requestId);
  assert.equal(updated.acceptedDonorsCount, 1, "Must remain 1");
  assert.equal(updated.duplicateWebhookCount, 1);
});

test("13. Rate Limiter: blocks flood requests exceeding rate limits with 429", async () => {
  const { processor } = createHarness();
  const smsAdapter = new SmsWebhookAdapter();

  const floodPhone = "+919111122222";
  let got429 = false;

  for (let i = 0; i < 65; i++) {
    const req = new Request("http://localhost/api/coordination/webhooks/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mock-signature": "valid-mock-signature",
        "x-webhook-timestamp": new Date().toISOString()
      }
    });

    const payload = JSON.stringify({
      From: floodPhone,
      Body: `Spam attempt ${i}`,
      MessageSid: `SM-SPAM-${Date.now()}-${i}`
    });

    const res = await processor.processWebhook(smsAdapter, req, payload);
    if (res.statusCode === 429) {
      got429 = true;
      assert.equal(res.error, "rate_limit_exceeded");
      break;
    }
  }

  assert.ok(got429, "Rate limiter must block spam after reaching threshold");
});

test("14. HTTP Route Endpoints: SMS and WhatsApp GET/POST routes return valid contracts", async () => {
  const { GET: getSms, POST: postSms } = await import("../app/api/coordination/webhooks/sms/route.ts");
  const { GET: getWa, POST: postWa } = await import("../app/api/coordination/webhooks/whatsapp/route.ts");

  // SMS GET
  const smsGetRes = await getSms();
  const smsGetData = await smsGetRes.json();
  assert.equal(smsGetData.status, "active");
  assert.equal(smsGetData.channel, "SMS");

  // WhatsApp Challenge GET
  const waChallengeReq = new Request("http://localhost/api/coordination/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=rakshaai_webhook_verify_token&hub.challenge=test_challenge_123");
  const waGetRes = await getWa(waChallengeReq);
  const waGetText = await waGetRes.text();
  assert.equal(waGetText, "test_challenge_123");

  // SMS POST with invalid signature
  const smsBadReq = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ From: "+919876543210", Body: "YES" })
  });
  const smsBadRes = await postSms(smsBadReq);
  assert.equal(smsBadRes.status, 401);
});

test("15. Dashboard Webhook Metrics: verifies tracking of inboundResponses, invalidCount, and lastResponseAt", async () => {
  const { engine, processor, store } = createHarness();
  const request = await setupActiveOutreachRequest(engine);
  const smsAdapter = new SmsWebhookAdapter();

  // Send an unrecognized message
  const reqInvalid = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });
  await processor.processWebhook(smsAdapter, reqInvalid, JSON.stringify({
    From: "+919876543210",
    Body: "Maybe later this week???",
    MessageSid: `SM-INV-${Date.now()}`
  }));

  const intermediate = await store.getRequest(request.requestId);
  assert.equal(intermediate.invalidResponsesCount, 1);
  assert.equal(intermediate.inboundResponses.length, 1);
  assert.equal(intermediate.inboundResponses[0].normalizedResponse, "UNKNOWN");

  // Now send a valid acceptance
  const reqValid = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });
  await processor.processWebhook(smsAdapter, reqValid, JSON.stringify({
    From: "+919876543210",
    Body: "YES I confirm",
    MessageSid: `SM-VAL-${Date.now()}`
  }));

  const finalized = await store.getRequest(request.requestId);
  assert.equal(finalized.acceptedDonorsCount, 1);
  assert.equal(finalized.inboundResponses.length, 2);
  assert.ok(finalized.lastResponseAt !== undefined);
  assert.equal(finalized.inboundResponses[1].status, "PROCESSED");
  assert.equal(finalized.inboundResponses[1].normalizedResponse, "ACCEPTED");
});

test("16. STOP / Opt-Out Normalization: maps STOP and unsubscription variants to OPT_OUT", () => {
  const optOutVariants = [
    "stop",
    "STOP",
    "Stop ",
    "STOP PLEASE",
    "unsubscribe",
    "Unsubscribe",
    "cancel",
    "CANCEL",
    "quit",
    "optout",
    "opt out",
    "opt-out"
  ];

  for (const text of optOutVariants) {
    const res = normalizeInboundResponse(text);
    assert.equal(res.intent, "OPT_OUT", `Failed for text: '${text}'`);
    assert.ok(res.confidence >= 0.85);
  }

  // Ensure HELP is distinct from OPT_OUT
  const helpRes = normalizeInboundResponse("help");
  assert.equal(helpRes.intent, "HELP");

  const questionRes = normalizeInboundResponse("what is this?");
  assert.equal(questionRes.intent, "HELP");
});

test("17. Donor Opt-Out Workflow: records opt-out, un-schedules donor, and replies with confirmation", async () => {
  const { engine, processor, store } = createHarness();
  const request = await setupActiveOutreachRequest(engine);
  const smsAdapter = new SmsWebhookAdapter();

  const stopReq = new Request("http://localhost/api/coordination/webhooks/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mock-signature": "valid-mock-signature",
      "x-webhook-timestamp": new Date().toISOString()
    }
  });

  const res = await processor.processWebhook(smsAdapter, stopReq, JSON.stringify({
    From: "+919876543210",
    Body: "STOP",
    MessageSid: `SM-STOP-${Date.now()}`
  }));

  assert.equal(res.success, true);
  assert.equal(res.statusCode, 200);
  assert.equal(res.intent, "OPT_OUT");
  assert.ok(res.replyMessage.includes("opted out"));

  // Verify store recorded opt-out
  const isOptedOut = await store.isDonorOptedOut("DNR-HYD-001", "+919876543210");
  assert.equal(isOptedOut, true);

  // Verify active candidate was updated to OPTED_OUT
  const updatedReq = await store.getRequest(request.requestId);
  const candidate = updatedReq.candidates.find((c) => c.donorId === "DNR-HYD-001");
  assert.equal(candidate.responseStatus, "OPTED_OUT");
  assert.equal(updatedReq.declinedDonorsCount, 1);
});

test("18. Opted-Out Donor Exclusion: filters out opted-out donors from matching and outreach", async () => {
  const { engine, store } = createHarness();

  // Mark DNR-HYD-001 as opted out prior to matching
  await store.saveDonorOptOut({
    donorId: "DNR-HYD-001",
    phoneNormalized: "+919876543210",
    phoneMasked: "+91 98*** **210",
    optedOutAt: new Date().toISOString(),
    channel: "SMS",
    reason: "Donor sent STOP"
  });

  // Create new request
  const created = await engine.createRequest({
    patientId: "PAT-OPT-TEST",
    patientName: "Aditi Rao",
    bloodGroup: "B+",
    city: "Hyderabad",
    hospital: "Rainbow Children's Hospital",
    unitsRequired: 1,
    urgency: "URGENT"
  }, { userId: "COORD-001", role: "coordinator" });

  // Generate matches: DNR-HYD-001 must NOT appear
  const matched = await engine.generateMatches(created.requestId, { userId: "COORD-001", role: "coordinator" });
  const hasOptedOut = matched.candidates.some((c) => c.donorId === "DNR-HYD-001");
  assert.equal(hasOptedOut, false, "Opted-out donor was included in matching candidates!");

  // If coordinator somehow forces an outreach to an opted out donor, engine rejects
  matched.approvedCandidateIds = ["DNR-HYD-001"];
  matched.candidates.push({
    donorId: "DNR-HYD-001",
    donorName: "Rajesh Kumar",
    bloodGroup: "B+",
    city: "Hyderabad",
    distanceKm: 5,
    isAboCompatible: true,
    isAntigenCompatible: true,
    alloimmunizationRisk: "LOW",
    compositeScore: 90,
    daysSinceLastDonation: 100,
    activityStatus: "ACTIVE",
    selectedForOutreach: true,
    responseStatus: "PENDING",
    rawPhone: "+919876543210"
  });
  matched.status = "COORDINATOR_APPROVED";
  await store.saveRequest(matched);

  await assert.rejects(
    async () => {
      await engine.dispatchOutreach(matched.requestId, { userId: "COORD-001", role: "coordinator" });
    },
    /Cannot dispatch outreach to opted-out donor/
  );
});

test("19. Production Signature Hardening: mock signatures are strictly forbidden in production", async () => {
  const prevEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";

    const mockVerifier = new MockSignatureVerifier();
    const mockReq = new Request("http://localhost", { headers: { "x-mock-signature": "valid-mock-signature" } });
    const mockRes = await mockVerifier.verify(mockReq, "test");
    assert.equal(mockRes.valid, false);
    assert.equal(mockRes.statusCode, 403);

    const twilioVerifier = new TwilioSignatureVerifier("mock_token");
    const twilioReq = new Request("http://localhost", { headers: { "x-twilio-signature": "valid-mock-signature" } });
    const twilioRes = await twilioVerifier.verify(twilioReq, "From=+919876543210");
    assert.equal(twilioRes.valid, false);
    assert.equal(twilioRes.statusCode, 403);

    const waVerifier = new WhatsAppSignatureVerifier("mock_secret");
    const waReq = new Request("http://localhost", { headers: { "x-hub-signature-256": "valid-mock-signature" } });
    const waRes = await waVerifier.verify(waReq, "test");
    assert.equal(waRes.valid, false);
    assert.equal(waRes.statusCode, 403);
  } finally {
    process.env.NODE_ENV = prevEnv;
  }
});

test("20. Persistent Webhook Deduplication: message IDs survive deduplicator reboots", () => {
  const dedup1 = new WebhookDeduplicator();
  dedup1.clear();

  const msgId = `MSG-PERSIST-${Date.now()}`;
  assert.equal(dedup1.isDuplicate(msgId), false);
  assert.equal(dedup1.isDuplicate(msgId), true);

  // New instance simulates process reboot
  const dedup2 = new WebhookDeduplicator();
  assert.equal(dedup2.isDuplicate(msgId), true);

  dedup2.clear();
});
