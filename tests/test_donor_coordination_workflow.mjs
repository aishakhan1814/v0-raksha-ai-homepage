import test from "node:test";
import assert from "node:assert/strict";
import { CoordinationEngine } from "../lib/coordination/engine.ts";
import { CoordinationStore } from "../lib/coordination/store.ts";
import { MockNotificationProvider } from "../lib/coordination/notifications/mock-provider.ts";
import { SnsCompatibleNotificationProvider } from "../lib/coordination/notifications/sns-provider.ts";
import { NotificationDispatcher } from "../lib/coordination/notifications/dispatcher.ts";
import { maskPhoneNumber } from "../lib/coordination/notifications/interface.ts";
import { signJWT, JWT_SECRET } from "../lib/auth.ts";

// Synthetic test donor pool
const SYNTHETIC_DONORS = [
  {
    donorId: "DNR-B-001",
    firstName: "Synthetic",
    lastName: "DonorOne",
    bloodType: "B+",
    city: "Hyderabad",
    phone: "+919876543210",
    hasConditions: "no",
    lastDonated: "2024-01-01", // > 90 days ago -> ACTIVE
    extendedAntigens: ["K-", "C+", "c+", "E-", "e+"]
  },
  {
    donorId: "DNR-O-002",
    firstName: "Synthetic",
    lastName: "DonorTwo",
    bloodType: "O+",
    city: "Hyderabad",
    phone: "+919876543211",
    hasConditions: "no",
    lastDonated: "2023-11-15", // > 90 days ago -> ACTIVE
    extendedAntigens: ["K-", "C-", "c+", "E-", "e+"]
  },
  {
    donorId: "DNR-A-003",
    firstName: "Synthetic",
    lastName: "DonorThree",
    bloodType: "A+", // Incompatible with B+
    city: "Hyderabad",
    phone: "+919876543212",
    hasConditions: "no",
    lastDonated: "2024-01-01",
    extendedAntigens: []
  },
  {
    donorId: "DNR-B-004-INELIGIBLE",
    firstName: "Synthetic",
    lastName: "DonorFour",
    bloodType: "B+",
    city: "Hyderabad",
    phone: "+919876543213",
    hasConditions: "yes", // Hard filter: Medical condition
    lastDonated: "2024-01-01",
    extendedAntigens: []
  },
  {
    donorId: "DNR-B-005-RECENT",
    firstName: "Synthetic",
    lastName: "DonorFive",
    bloodType: "B+",
    city: "Hyderabad",
    phone: "+919876543214",
    hasConditions: "no",
    lastDonated: new Date().toISOString(), // 0 days ago -> INACTIVE (<90 days)
    extendedAntigens: []
  }
];

function createTestHarness() {
  const store = new CoordinationStore();
  store.setDonors(SYNTHETIC_DONORS);
  const mockProvider = new MockNotificationProvider();
  const dispatcher = new NotificationDispatcher({
    provider: mockProvider,
    maxRetries: 3,
    initialBackoffMs: 10
  });
  const engine = new CoordinationEngine(store, dispatcher);
  return { store, mockProvider, dispatcher, engine };
}

const coordinatorActor = { userId: "coord-01", role: "coordinator", email: "coord@raksha.ai" };
const patientActor = { userId: "pat-01", role: "patient", email: "patient@raksha.ai" };
const donorActor = { userId: "donor-01", role: "donor", email: "donor@raksha.ai" };

test("1. Invalid blood request creation fails input validation safely", async () => {
  const { engine } = createTestHarness();

  // Missing required blood group
  await assert.rejects(
    async () => {
      await engine.createRequest(
        { patientId: "P-101", patientName: "Aarav", city: "Hyderabad", hospital: "Apollo" },
        patientActor
      );
    },
    /Missing required field: bloodGroup/
  );

  // Invalid blood group syntax
  await assert.rejects(
    async () => {
      await engine.createRequest(
        { patientId: "P-101", patientName: "Aarav", bloodGroup: "X-INVALID", city: "Hyderabad", hospital: "Apollo" },
        patientActor
      );
    },
    /Invalid blood group/
  );

  // Missing hospital
  await assert.rejects(
    async () => {
      await engine.createRequest(
        { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "" },
        patientActor
      );
    },
    /Missing required field: hospital/
  );
});

test("2. Valid blood request creation initializes lifecycle state and audit event", async () => {
  const { engine } = createTestHarness();

  const req = await engine.createRequest(
    {
      patientId: "P-101",
      patientName: "Aarav Sharma",
      bloodGroup: "B+",
      city: "Hyderabad",
      hospital: "Rainbow Children's Hospital",
      unitsRequired: 2,
      urgency: "URGENT",
      diagnosis: "Beta-Thalassemia Major"
    },
    patientActor
  );

  assert.ok(req.requestId.startsWith("REQ-"));
  assert.equal(req.status, "CREATED");
  assert.equal(req.requiredDonors, 2);
  assert.equal(req.acceptedDonorsCount, 0);
  assert.equal(req.auditTrail.length, 1);
  assert.equal(req.auditTrail[0].action, "REQUEST_CREATED");
  assert.equal(req.auditTrail[0].actorRole, "patient");
});

test("3. Deterministic matching generates compatible candidates and filters ineligible donors", async () => {
  const { engine } = createTestHarness();

  const req = await engine.createRequest(
    {
      patientId: "P-101",
      patientName: "Aarav Sharma",
      bloodGroup: "B+",
      city: "Hyderabad",
      hospital: "Rainbow Hospital",
      unitsRequired: 1
    },
    patientActor
  );

  const matched = await engine.generateMatches(req.requestId, coordinatorActor);
  assert.equal(matched.status, "PENDING_COORDINATOR_REVIEW");
  assert.ok(matched.candidates.length > 0);

  // B+ patient can accept B+ and O+ donors
  const candidateIds = matched.candidates.map((c) => c.donorId);
  assert.ok(candidateIds.includes("DNR-B-001"), "Expected B+ donor DNR-B-001");
  assert.ok(candidateIds.includes("DNR-O-002"), "Expected O+ donor DNR-O-002");

  // Incompatible A+ donor must be excluded
  assert.ok(!candidateIds.includes("DNR-A-003"), "Incompatible A+ donor must be excluded");
  // Medical condition donor must be excluded
  assert.ok(!candidateIds.includes("DNR-B-004-INELIGIBLE"), "Ineligible donor must be excluded");
  // Recent donor (<90 days) must be excluded
  assert.ok(!candidateIds.includes("DNR-B-005-RECENT"), "Recent donor must be excluded (<90 days)");
});

test("4. Non-coordinator actor cannot approve candidates (coordinator-in-the-loop guard)", async () => {
  const { engine } = createTestHarness();

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital" },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);

  // Attempt review by patient actor -> MUST FAIL
  await assert.rejects(
    async () => {
      await engine.coordinatorReview(req.requestId, "APPROVE", patientActor);
    },
    /Human coordinator authorization is strictly required/
  );

  // Attempt review by donor actor -> MUST FAIL
  await assert.rejects(
    async () => {
      await engine.coordinatorReview(req.requestId, "APPROVE", donorActor);
    },
    /Human coordinator authorization is strictly required/
  );
});

test("5. Coordinator rejection workflow transitions state and records reason", async () => {
  const { engine } = createTestHarness();

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital" },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);

  const rejected = await engine.coordinatorReview(req.requestId, "REJECT", coordinatorActor, {
    rejectionReason: "Antibody history requires expanded Kell-negative search pool",
    coordinatorNotes: "Requested secondary search with extended antigen panel"
  });

  assert.equal(rejected.status, "COORDINATOR_REJECTED");
  const lastAudit = rejected.auditTrail[rejected.auditTrail.length - 1];
  assert.equal(lastAudit.action, "COORDINATOR_REJECTED");
  assert.equal(lastAudit.actorRole, "coordinator");
  assert.equal(lastAudit.reason, "Antibody history requires expanded Kell-negative search pool");
});

test("6. Coordinator approval workflow validates compatible selections", async () => {
  const { engine } = createTestHarness();

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital" },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);

  const approved = await engine.coordinatorReview(req.requestId, "APPROVE", coordinatorActor, {
    selectedDonorIds: ["DNR-B-001", "DNR-O-002"],
    coordinatorNotes: "Verified clinical compatibility; approved 2 primary candidates"
  });

  assert.equal(approved.status, "COORDINATOR_APPROVED");
  assert.deepEqual(approved.approvedCandidateIds, ["DNR-B-001", "DNR-O-002"]);
});

test("7. Automated outreach is strictly blocked without coordinator approval", async () => {
  const { engine } = createTestHarness();

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital" },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);

  // State is still PENDING_COORDINATOR_REVIEW - Attempt dispatch without approval -> MUST FAIL
  await assert.rejects(
    async () => {
      await engine.dispatchOutreach(req.requestId, coordinatorActor);
    },
    /Automated outreach is forbidden without explicit coordinator approval/
  );
});

test("8. Notification delivery dispatches via adapter and tracks delivery status", async () => {
  const { engine, mockProvider } = createTestHarness();

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital", urgency: "URGENT" },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);
  await engine.coordinatorReview(req.requestId, "APPROVE", coordinatorActor, { selectedDonorIds: ["DNR-B-001"] });

  const dispatched = await engine.dispatchOutreach(req.requestId, coordinatorActor);
  assert.equal(dispatched.status, "AWAITING_RESPONSES");
  assert.equal(dispatched.notifications.length, 1);
  assert.equal(dispatched.notifications[0].deliveryStatus, "DELIVERED");
  assert.ok(dispatched.notifications[0].notificationId.startsWith("NOTIF-"));
  assert.equal(mockProvider.dispatches.length, 1);
  assert.ok(dispatched.responseDeadline, "Response deadline should be calculated");
});

test("9. Duplicate notification prevention and idempotency enforcement", async () => {
  const { engine, mockProvider } = createTestHarness();

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital" },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);
  await engine.coordinatorReview(req.requestId, "APPROVE", coordinatorActor, { selectedDonorIds: ["DNR-B-001"] });

  const idempKey = "IDEMP-TEST-KEY-001";
  await engine.dispatchOutreach(req.requestId, coordinatorActor, idempKey);
  assert.equal(mockProvider.dispatches.length, 1);

  // Repeat dispatch with identical idempotency key
  await engine.dispatchOutreach(req.requestId, coordinatorActor, idempKey);
  // Provider count MUST NOT increase (duplicate send prevented)
  assert.equal(mockProvider.dispatches.length, 1);
});

test("10. Notification retry policy executes on transient gateway failure and succeeds", async () => {
  const store = new CoordinationStore();
  store.setDonors(SYNTHETIC_DONORS);
  const mockProvider = new MockNotificationProvider();
  mockProvider.failNextN = 2; // Fail first 2 attempts, succeed on 3rd
  const dispatcher = new NotificationDispatcher({
    provider: mockProvider,
    maxRetries: 3,
    initialBackoffMs: 5
  });
  const engine = new CoordinationEngine(store, dispatcher);

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital" },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);
  await engine.coordinatorReview(req.requestId, "APPROVE", coordinatorActor, { selectedDonorIds: ["DNR-B-001"] });

  const dispatched = await engine.dispatchOutreach(req.requestId, coordinatorActor);
  const notif = dispatched.notifications[0];
  assert.equal(notif.deliveryStatus, "DELIVERED");
  assert.equal(notif.retryCount, 2, "Expected 2 retries before success");
});

test("11. Donor acceptance records status and transitions to ACCEPTED_FULFILLED", async () => {
  const { engine } = createTestHarness();

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital", unitsRequired: 1 },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);
  await engine.coordinatorReview(req.requestId, "APPROVE", coordinatorActor, { selectedDonorIds: ["DNR-B-001"] });
  await engine.dispatchOutreach(req.requestId, coordinatorActor);

  const updated = await engine.recordDonorResponse(req.requestId, "DNR-B-001", "ACCEPTED", donorActor, "Donor confirmed availability");
  assert.equal(updated.status, "ACCEPTED_FULFILLED");
  assert.equal(updated.acceptedDonorsCount, 1);

  const candidate = updated.candidates.find((c) => c.donorId === "DNR-B-001");
  assert.equal(candidate.responseStatus, "ACCEPTED");
  assert.ok(candidate.respondedAt);
});

test("12. Donor decline records status and maintains pending fulfillment", async () => {
  const { engine } = createTestHarness();

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital", unitsRequired: 1 },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);
  await engine.coordinatorReview(req.requestId, "APPROVE", coordinatorActor, { selectedDonorIds: ["DNR-B-001", "DNR-O-002"] });
  await engine.dispatchOutreach(req.requestId, coordinatorActor);

  const updated = await engine.recordDonorResponse(req.requestId, "DNR-B-001", "DECLINED", donorActor, "Donor is traveling");
  assert.equal(updated.status, "AWAITING_RESPONSES");
  assert.equal(updated.declinedDonorsCount, 1);
  assert.equal(updated.acceptedDonorsCount, 0);
});

test("13. Timeout handling and automatic escalation when donors do not respond in time", async () => {
  const { engine } = createTestHarness();

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital", unitsRequired: 1 },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);
  await engine.coordinatorReview(req.requestId, "APPROVE", coordinatorActor, { selectedDonorIds: ["DNR-B-001"] });
  await engine.dispatchOutreach(req.requestId, coordinatorActor);

  // Force escalation simulation
  const escalated = await engine.checkTimeoutAndEscalate(req.requestId, coordinatorActor, {
    forceEscalate: true,
    customReason: "2-hour critical response window expired with 0 confirmed donors"
  });

  assert.equal(escalated.status, "ESCALATED");
  assert.equal(escalated.isEscalated, true);
  assert.ok(escalated.escalatedAt);
  assert.equal(escalated.escalationReason, "2-hour critical response window expired with 0 confirmed donors");

  const lastAudit = escalated.auditTrail[escalated.auditTrail.length - 1];
  assert.equal(lastAudit.action, "REQUEST_ESCALATED");
});

test("14. Request completion and cancellation enforce valid state machine transitions", async () => {
  const { engine } = createTestHarness();

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital", unitsRequired: 1 },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);
  await engine.coordinatorReview(req.requestId, "APPROVE", coordinatorActor, { selectedDonorIds: ["DNR-B-001"] });
  await engine.dispatchOutreach(req.requestId, coordinatorActor);
  await engine.recordDonorResponse(req.requestId, "DNR-B-001", "ACCEPTED", donorActor);

  // Complete fulfilled request
  const completed = await engine.completeRequest(req.requestId, coordinatorActor, "Transfusion completed successfully at Rainbow Hospital");
  assert.equal(completed.status, "COMPLETED");

  // Attempting to cancel an already completed request must throw
  await assert.rejects(
    async () => {
      await engine.cancelRequest(req.requestId, coordinatorActor);
    },
    /Cannot cancel a request that is already 'COMPLETED'/
  );

  // Create another request and cancel it mid-flow
  const req2 = await engine.createRequest(
    { patientId: "P-102", patientName: "Diya", bloodGroup: "O+", city: "Hyderabad", hospital: "Apollo" },
    patientActor
  );
  const cancelled = await engine.cancelRequest(req2.requestId, patientActor, "Patient discharged; transfusion deferred");
  assert.equal(cancelled.status, "CANCELLED");
});

test("15. Audit trail completeness and donor PII masking in notification logs", async () => {
  const { engine } = createTestHarness();

  const req = await engine.createRequest(
    { patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital" },
    patientActor
  );
  await engine.generateMatches(req.requestId, coordinatorActor);
  await engine.coordinatorReview(req.requestId, "APPROVE", coordinatorActor, { selectedDonorIds: ["DNR-B-001"] });
  const dispatched = await engine.dispatchOutreach(req.requestId, coordinatorActor);

  // Verify masked destination in notification record (never raw phone number)
  const notif = dispatched.notifications[0];
  assert.equal(notif.destinationMasked, maskPhoneNumber("+919876543210"));
  assert.notEqual(notif.destinationMasked, "+919876543210");
  assert.ok(notif.destinationMasked.includes("***"));

  // Verify every transition has a full audit event
  assert.ok(dispatched.auditTrail.length >= 4);
  for (const event of dispatched.auditTrail) {
    assert.ok(event.eventId);
    assert.ok(event.timestamp);
    assert.ok(event.fromStatus);
    assert.ok(event.toStatus);
    assert.ok(event.actorRole);
    assert.ok(event.actorId);
  }
});

test("16. AWS SNS-compatible notification provider validates E.164 and builds compliant payload", async () => {
  const snsProvider = new SnsCompatibleNotificationProvider({ dryRun: true });

  const payload = {
    notificationId: "NOTIF-SNS-01",
    idempotencyKey: "IDEMP-SNS-01",
    requestId: "REQ-01",
    donorId: "DNR-01",
    donorPhone: "9876543210", // 10-digit Indian phone
    channel: "SMS",
    message: "Urgent B+ blood required. Reply YES to confirm."
  };

  const res = await snsProvider.send(payload);
  assert.equal(res.success, true);
  assert.equal(res.provider, "aws_sns");
  assert.ok(res.providerMessageId.startsWith("sns-"));

  // Check captured SNS publish payload
  const captured = snsProvider.capturedInputs[0];
  assert.equal(captured.PhoneNumber, "+919876543210", "Phone must be converted to E.164 standard");
  assert.equal(captured.MessageAttributes["AWS.SNS.SMS.SMSType"].StringValue, "Transactional");
  assert.equal(captured.Message, payload.message);

  // Invalid phone number rejection
  const invalidPayload = { ...payload, donorPhone: "invalid123" };
  const failRes = await snsProvider.send(invalidPayload);
  assert.equal(failRes.success, false);
  assert.ok(failRes.error.includes("Invalid E.164 phone"));
});
