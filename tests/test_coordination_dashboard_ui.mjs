import test from "node:test";
import assert from "node:assert/strict";

// Import types, engine and helper logic
import {
  maskPhoneNumber,
  formatDateTime,
  getStatusBadge,
  getUrgencyBadge
} from "../lib/coordination/ui-helpers.ts";
import { CoordinationEngine } from "../lib/coordination/engine.ts";
import { MockNotificationProvider } from "../lib/coordination/notifications/mock-provider.ts";
import { NotificationDispatcher } from "../lib/coordination/notifications/dispatcher.ts";
import { CoordinationStore } from "../lib/coordination/store.ts";
import { VALID_TRANSITIONS, ABO_COMPATIBILITY_TABLE } from "../lib/coordination/types.ts";

/**
 * Helper to compute dashboard metrics matching coordination-dashboard.tsx implementation
 */
function computeDashboardMetrics(requests) {
  const total = requests.length;
  const created = requests.filter((r) => r.status === "CREATED").length;
  const awaitingReview = requests.filter(
    (r) => r.status === "PENDING_COORDINATOR_REVIEW" || r.status === "MATCHING"
  ).length;
  const approvedAwaitingOutreach = requests.filter(
    (r) => r.status === "COORDINATOR_APPROVED" || r.status === "OUTREACH_PENDING"
  ).length;
  const activeOutreach = requests.filter((r) => r.status === "OUTREACH_IN_PROGRESS").length;
  const awaitingResponses = requests.filter(
    (r) => r.status === "AWAITING_RESPONSES" || r.status === "PARTIALLY_ACCEPTED"
  ).length;
  const escalated = requests.filter((r) => r.status === "ESCALATED" || r.isEscalated).length;
  const fulfilled = requests.filter(
    (r) => r.status === "ACCEPTED_FULFILLED" || r.status === "COMPLETED"
  ).length;
  const cancelled = requests.filter(
    (r) => r.status === "CANCELLED" || r.status === "COORDINATOR_REJECTED"
  ).length;

  return {
    total,
    created,
    awaitingReview,
    approvedAwaitingOutreach,
    activeOutreach,
    awaitingResponses,
    escalated,
    fulfilled,
    cancelled,
  };
}

/**
 * Helper to filter requests matching coordination-dashboard.tsx implementation
 */
function filterRequests(requests, { searchQuery = "", statusFilter = "ALL", urgencyFilter = "ALL", bloodGroupFilter = "ALL" } = {}) {
  return requests.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesId = r.requestId.toLowerCase().includes(q);
      const matchesPatient = r.input.patientName.toLowerCase().includes(q);
      const matchesHospital = r.input.hospital.toLowerCase().includes(q);
      const matchesCity = r.input.city.toLowerCase().includes(q);
      if (!matchesId && !matchesPatient && !matchesHospital && !matchesCity) return false;
    }
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (urgencyFilter !== "ALL" && r.input.urgency !== urgencyFilter) return false;
    if (bloodGroupFilter !== "ALL" && r.input.bloodGroup !== bloodGroupFilter) return false;
    return true;
  });
}

// ─── TEST SUITE ─────────────────────────────────────────────────────────────────

test("1. Dashboard PII Masking: guarantees raw phone numbers are strictly redacted", () => {
  assert.equal(maskPhoneNumber("+919876543210"), "+9198 *** 210");
  assert.equal(maskPhoneNumber("+91 9876543210"), "+91 9 *** 210");
  assert.equal(maskPhoneNumber("9876543210"), "98765 *** 210");
  assert.equal(maskPhoneNumber(""), "—");
  assert.equal(maskPhoneNumber(undefined), "—");
  assert.equal(maskPhoneNumber("+91 98*** **321"), "+91 98*** **321", "Already masked string preserved");
  
  // Verify no raw string leaks in masked output
  const masked = maskPhoneNumber("+919876543210");
  assert.ok(!masked.includes("7654"), "Middle digits must be redacted");
});

test("2. Date/Time and Status Badge helpers: format consistently without crashing", () => {
  const formatted = formatDateTime("2026-11-22T12:00:00.000Z");
  assert.ok(typeof formatted === "string" && formatted.length > 0);
  assert.equal(formatDateTime(""), "—");

  const badgeCreated = getStatusBadge("CREATED");
  assert.equal(badgeCreated.label, "Created");
  assert.ok(badgeCreated.text.includes("blue"));

  const badgeReview = getStatusBadge("PENDING_COORDINATOR_REVIEW");
  assert.equal(badgeReview.label, "Review Required");
  assert.ok(badgeReview.text.includes("amber"));

  const badgeEscalated = getStatusBadge("ESCALATED");
  assert.equal(badgeEscalated.label, "Escalated");
  assert.ok(badgeEscalated.text.includes("red"));

  const urgencyCritical = getUrgencyBadge("CRITICAL");
  assert.equal(urgencyCritical.label, "CRITICAL");
  assert.ok(urgencyCritical.text.includes("red"));

  const urgencyRoutine = getUrgencyBadge("ROUTINE");
  assert.equal(urgencyRoutine.label, "ROUTINE");
});

test("3. Overview Metrics Calculation: computes exact counts across all 9 request states", () => {
  const mockRequests = [
    { requestId: "REQ-1", status: "CREATED", isEscalated: false, input: { patientName: "P1", hospital: "H1", city: "C1", bloodGroup: "A+", urgency: "ROUTINE" } },
    { requestId: "REQ-2", status: "MATCHING", isEscalated: false, input: { patientName: "P2", hospital: "H1", city: "C1", bloodGroup: "B+", urgency: "URGENT" } },
    { requestId: "REQ-3", status: "PENDING_COORDINATOR_REVIEW", isEscalated: false, input: { patientName: "P3", hospital: "H2", city: "C2", bloodGroup: "O+", urgency: "CRITICAL" } },
    { requestId: "REQ-4", status: "COORDINATOR_APPROVED", isEscalated: false, input: { patientName: "P4", hospital: "H2", city: "C2", bloodGroup: "AB+", urgency: "ROUTINE" } },
    { requestId: "REQ-5", status: "OUTREACH_PENDING", isEscalated: false, input: { patientName: "P5", hospital: "H3", city: "C1", bloodGroup: "O-", urgency: "URGENT" } },
    { requestId: "REQ-6", status: "OUTREACH_IN_PROGRESS", isEscalated: false, input: { patientName: "P6", hospital: "H3", city: "C1", bloodGroup: "A-", urgency: "CRITICAL" } },
    { requestId: "REQ-7", status: "AWAITING_RESPONSES", isEscalated: false, input: { patientName: "P7", hospital: "H1", city: "C2", bloodGroup: "B-", urgency: "URGENT" } },
    { requestId: "REQ-8", status: "PARTIALLY_ACCEPTED", isEscalated: false, input: { patientName: "P8", hospital: "H2", city: "C1", bloodGroup: "AB-", urgency: "ROUTINE" } },
    { requestId: "REQ-9", status: "ESCALATED", isEscalated: true, input: { patientName: "P9", hospital: "H1", city: "C1", bloodGroup: "B+", urgency: "CRITICAL" } },
    { requestId: "REQ-10", status: "ACCEPTED_FULFILLED", isEscalated: false, input: { patientName: "P10", hospital: "H3", city: "C2", bloodGroup: "O+", urgency: "URGENT" } },
    { requestId: "REQ-11", status: "COMPLETED", isEscalated: false, input: { patientName: "P11", hospital: "H1", city: "C1", bloodGroup: "A+", urgency: "ROUTINE" } },
    { requestId: "REQ-12", status: "CANCELLED", isEscalated: false, input: { patientName: "P12", hospital: "H2", city: "C2", bloodGroup: "O+", urgency: "ROUTINE" } },
    { requestId: "REQ-13", status: "COORDINATOR_REJECTED", isEscalated: false, input: { patientName: "P13", hospital: "H1", city: "C1", bloodGroup: "B+", urgency: "URGENT" } }
  ];

  const metrics = computeDashboardMetrics(mockRequests);

  assert.equal(metrics.total, 13);
  assert.equal(metrics.created, 1);
  assert.equal(metrics.awaitingReview, 2, "MATCHING + PENDING_COORDINATOR_REVIEW");
  assert.equal(metrics.approvedAwaitingOutreach, 2, "COORDINATOR_APPROVED + OUTREACH_PENDING");
  assert.equal(metrics.activeOutreach, 1, "OUTREACH_IN_PROGRESS");
  assert.equal(metrics.awaitingResponses, 2, "AWAITING_RESPONSES + PARTIALLY_ACCEPTED");
  assert.equal(metrics.escalated, 1, "ESCALATED");
  assert.equal(metrics.fulfilled, 2, "ACCEPTED_FULFILLED + COMPLETED");
  assert.equal(metrics.cancelled, 2, "CANCELLED + COORDINATOR_REJECTED");
});

test("4. Filtering & Search: correctly filters by query, status, urgency, and blood group", () => {
  const mockRequests = [
    { requestId: "REQ-101", status: "CREATED", input: { patientName: "Aarav Sharma", hospital: "Apollo Bangalore", city: "Bengaluru", bloodGroup: "O-", urgency: "CRITICAL" } },
    { requestId: "REQ-102", status: "COORDINATOR_APPROVED", input: { patientName: "Diya Patel", hospital: "KEM Mumbai", city: "Mumbai", bloodGroup: "B+", urgency: "URGENT" } },
    { requestId: "REQ-103", status: "AWAITING_RESPONSES", input: { patientName: "Rohan V.", hospital: "Manipal Bangalore", city: "Bengaluru", bloodGroup: "B+", urgency: "ROUTINE" } }
  ];

  // Search by Request ID
  const searchById = filterRequests(mockRequests, { searchQuery: "101" });
  assert.equal(searchById.length, 1);
  assert.equal(searchById[0].requestId, "REQ-101");

  // Search by Patient Name
  const searchByName = filterRequests(mockRequests, { searchQuery: "diya" });
  assert.equal(searchByName.length, 1);
  assert.equal(searchByName[0].input.patientName, "Diya Patel");

  // Search by Hospital
  const searchByHospital = filterRequests(mockRequests, { searchQuery: "manipal" });
  assert.equal(searchByHospital.length, 1);
  assert.equal(searchByHospital[0].input.hospital, "Manipal Bangalore");

  // Filter by Blood Group
  const filterByBlood = filterRequests(mockRequests, { bloodGroupFilter: "B+" });
  assert.equal(filterByBlood.length, 2);

  // Filter by Urgency
  const filterByUrgency = filterRequests(mockRequests, { urgencyFilter: "CRITICAL" });
  assert.equal(filterByUrgency.length, 1);
  assert.equal(filterByUrgency[0].requestId, "REQ-101");

  // Filter by Status
  const filterByStatus = filterRequests(mockRequests, { statusFilter: "COORDINATOR_APPROVED" });
  assert.equal(filterByStatus.length, 1);
  assert.equal(filterByStatus[0].requestId, "REQ-102");

  // Combined Filters
  const combined = filterRequests(mockRequests, {
    bloodGroupFilter: "B+",
    urgencyFilter: "URGENT",
    searchQuery: "Mumbai"
  });
  assert.equal(combined.length, 1);
  assert.equal(combined[0].requestId, "REQ-102");
});

function createHarness() {
  const store = new CoordinationStore();
  store.setDonors([
    {
      donorId: "D-1",
      firstName: "Anil",
      lastName: "K.",
      bloodType: "B+",
      city: "Bengaluru",
      phone: "+919811122233",
      hasConditions: "no",
      lastDonated: "2024-01-01"
    },
    {
      donorId: "D-2",
      firstName: "Sunita",
      lastName: "M.",
      bloodType: "O+",
      city: "Bengaluru",
      phone: "+919844455566",
      hasConditions: "no",
      lastDonated: "2023-11-15"
    },
    {
      donorId: "D-3",
      firstName: "Ineligible",
      lastName: "Donor",
      bloodType: "AB+",
      city: "Bengaluru",
      phone: "+919877788899",
      hasConditions: "no",
      lastDonated: "2024-01-01"
    }
  ]);
  const mockProvider = new MockNotificationProvider();
  const dispatcher = new NotificationDispatcher({ provider: mockProvider, maxRetries: 3, initialBackoffMs: 10 });
  const engine = new CoordinationEngine(store, dispatcher);
  return { store, mockProvider, dispatcher, engine };
}

test("5. End-to-End Coordination Flow via CoordinationEngine: from creation to fulfillment", async () => {
  const { store, engine } = createHarness();

  // 1. Create Blood Request
  const request = await engine.createRequest({
    patientId: "PAT-TEST-1",
    patientName: "Kavita R.",
    bloodGroup: "B+",
    hospital: "Narayana Health",
    city: "Bengaluru",
    unitsRequired: 1,
    urgency: "URGENT",
    diagnosis: "Thalassemia Major"
  }, { userId: "COORD-1", role: "coordinator" });

  assert.equal(request.status, "CREATED");
  assert.equal(request.input.bloodGroup, "B+");
  assert.ok(request.requestId.startsWith("REQ-"));

  // 2. Candidate Matching
  const matches = await engine.generateMatches(request.requestId, { userId: "COORD-1", role: "coordinator" });
  assert.equal(matches.status, "PENDING_COORDINATOR_REVIEW");
  assert.equal(matches.candidates.length, 2, "Only compatible donors B+ and O+ included");
  assert.ok(matches.candidates.every(c => c.isAboCompatible));

  // 3. Coordinator Approval (Strict Human-in-the-Loop)
  const approved = await engine.coordinatorReview(
    request.requestId,
    "APPROVE",
    { userId: "COORD-1", role: "coordinator" },
    {
      selectedDonorIds: ["D-1", "D-2"],
      coordinatorNotes: "Approved top 2 compatible donors with >90d recency"
    }
  );
  assert.equal(approved.status, "COORDINATOR_APPROVED");
  assert.equal(approved.approvedCandidateIds.length, 2);

  // 4. Outreach Dispatch (Idempotent)
  const dispatchKey = `dispatch-${request.requestId}-test`;
  const outreach = await engine.dispatchOutreach(
    request.requestId,
    { userId: "COORD-1", role: "coordinator" },
    dispatchKey
  );
  assert.equal(outreach.status, "AWAITING_RESPONSES");
  assert.equal(outreach.notifications.length, 2);
  assert.ok(outreach.notifications.every(n => n.destinationMasked.includes("***")));

  // 5. Donor Acceptance
  const responded = await engine.recordDonorResponse(
    request.requestId,
    "D-1",
    "ACCEPTED",
    { userId: "D-1", role: "donor" },
    { notes: "Available for immediate donation at Narayana Health" }
  );
  assert.equal(responded.status, "ACCEPTED_FULFILLED");
  assert.equal(responded.acceptedDonorsCount, 1);

  // 6. Complete Request
  const completed = await engine.completeRequest(
    request.requestId,
    { userId: "COORD-1", role: "coordinator" },
    "Transfusion successfully completed"
  );
  assert.equal(completed.status, "COMPLETED");

  // 7. Verify Audit Trail Completeness
  assert.ok(completed.auditTrail.length >= 5);
  const actions = completed.auditTrail.map(a => a.action);
  assert.ok(actions.includes("REQUEST_CREATED"));
  assert.ok(actions.includes("MATCHES_GENERATED"));
  assert.ok(actions.includes("COORDINATOR_APPROVED"));
  assert.ok(actions.includes("OUTREACH_DISPATCHED"));
  assert.ok(actions.includes("DONOR_ACCEPTED"));
  assert.ok(actions.includes("REQUEST_COMPLETED"));
});

test("6. Human-in-the-Loop Safeguard: Automated outreach forbidden without explicit approval", async () => {
  const { engine } = createHarness();

  const request = await engine.createRequest({
    patientId: "PAT-TEST-2",
    patientName: "Meera D.",
    bloodGroup: "O+",
    hospital: "KEM Hospital",
    city: "Mumbai",
    unitsRequired: 1,
    urgency: "CRITICAL"
  }, { userId: "PAT-TEST-2", role: "patient" });

  // Attempting outreach directly from CREATED status MUST throw error
  await assert.rejects(
    async () => {
      await engine.dispatchOutreach(
        request.requestId,
        { userId: "COORD-1", role: "coordinator" },
        "premature-key"
      );
    },
    /Safety Violation: Automated outreach is forbidden without explicit coordinator approval/
  );
});

test("7. SLA Escalation: accurately triggers when response deadline is exceeded", async () => {
  const { store, engine } = createHarness();

  const request = await engine.createRequest({
    patientId: "PAT-TEST-3",
    patientName: "Vikram S.",
    bloodGroup: "A+",
    hospital: "AIIMS Delhi",
    city: "Delhi",
    unitsRequired: 1,
    urgency: "CRITICAL"
  }, { userId: "COORD-1", role: "coordinator" });

  store.setDonors([
    { donorId: "D-9", firstName: "Rakesh", lastName: "S", bloodType: "A+", city: "Delhi", daysSinceLastDonation: 100, lastDonated: "2024-01-01", hasConditions: "no", phone: "+919999988888" }
  ]);

  await engine.generateMatches(request.requestId, { userId: "COORD-1", role: "coordinator" });
  await engine.coordinatorReview(request.requestId, "APPROVE", { userId: "COORD-1", role: "coordinator" }, { selectedDonorIds: ["D-9"] });
  await engine.dispatchOutreach(request.requestId, { userId: "COORD-1", role: "coordinator" }, "key-sla-test");

  // Manually backdate responseDeadline to simulate timeout
  const updatedReq = await store.getRequest(request.requestId);
  updatedReq.responseDeadline = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  await store.saveRequest(updatedReq);

  // Run escalation check
  const escalated = await engine.checkTimeoutAndEscalate(request.requestId, { userId: "COORD-1", role: "coordinator" });
  assert.ok(escalated.isEscalated, "Request must be flagged as escalated");
  assert.equal(escalated.status, "ESCALATED");
  assert.ok(escalated.escalationReason.includes("Response deadline expired"));
});

test("8. Empty State & Metric Resiliency: zero requests produce zeroed KPI metrics without error", () => {
  const emptyMetrics = computeDashboardMetrics([]);
  assert.equal(emptyMetrics.total, 0);
  assert.equal(emptyMetrics.created, 0);
  assert.equal(emptyMetrics.awaitingReview, 0);
  assert.equal(emptyMetrics.approvedAwaitingOutreach, 0);
  assert.equal(emptyMetrics.activeOutreach, 0);
  assert.equal(emptyMetrics.awaitingResponses, 0);
  assert.equal(emptyMetrics.escalated, 0);
  assert.equal(emptyMetrics.fulfilled, 0);
  assert.equal(emptyMetrics.cancelled, 0);

  const filteredEmpty = filterRequests([], { searchQuery: "test", statusFilter: "ALL" });
  assert.deepEqual(filteredEmpty, []);
});

test("9. Coordinator Rejection Workflow: transitions to COORDINATOR_REJECTED with reason recorded", async () => {
  const { store, engine } = createHarness();

  const request = await engine.createRequest({
    patientId: "PAT-TEST-4",
    patientName: "Deepak N.",
    bloodGroup: "B+",
    hospital: "KIMS Hospital",
    city: "Bengaluru",
    unitsRequired: 1,
    urgency: "URGENT"
  }, { userId: "COORD-1", role: "coordinator" });

  await engine.generateMatches(request.requestId, { userId: "COORD-1", role: "coordinator" });

  const rejected = await engine.coordinatorReview(
    request.requestId,
    "REJECT",
    { userId: "COORD-1", role: "coordinator" },
    { rejectionReason: "Matched donors are located outside optimal 10km transit radius" }
  );

  assert.equal(rejected.status, "COORDINATOR_REJECTED");
  assert.equal(rejected.approvedCandidateIds.length, 0);
  const lastEvent = rejected.auditTrail[rejected.auditTrail.length - 1];
  assert.equal(lastEvent.action, "COORDINATOR_REJECTED");
  assert.ok(lastEvent.reason.includes("transit radius"));
});

test("10. Multi-candidate selection filtering: approves only checked donor candidates", async () => {
  const { store, engine } = createHarness();

  const request = await engine.createRequest({
    patientId: "PAT-TEST-5",
    patientName: "Ananya S.",
    bloodGroup: "B+",
    hospital: "Apollo Hospital",
    city: "Bengaluru",
    unitsRequired: 1,
    urgency: "URGENT"
  }, { userId: "COORD-1", role: "coordinator" });

  const matched = await engine.generateMatches(request.requestId, { userId: "COORD-1", role: "coordinator" });
  assert.equal(matched.candidates.length, 2);

  // Approve only D-1, omitting D-2
  const approved = await engine.coordinatorReview(
    request.requestId,
    "APPROVE",
    { userId: "COORD-1", role: "coordinator" },
    { selectedDonorIds: ["D-1"], coordinatorNotes: "Targeted single nearest donor" }
  );

  assert.equal(approved.approvedCandidateIds.length, 1);
  assert.deepEqual(approved.approvedCandidateIds, ["D-1"]);
});

test("11. Request cancellation workflow: transitions to CANCELLED with audit reason", async () => {
  const { store, engine } = createHarness();

  const request = await engine.createRequest({
    patientId: "PAT-TEST-6",
    patientName: "Kunal M.",
    bloodGroup: "O+",
    hospital: "Manipal Hospital",
    city: "Bengaluru",
    unitsRequired: 1,
    urgency: "ROUTINE"
  }, { userId: "COORD-1", role: "coordinator" });

  const cancelled = await engine.cancelRequest(
    request.requestId,
    { userId: "COORD-1", role: "coordinator" },
    "Patient transferred to another clinical center"
  );

  assert.equal(cancelled.status, "CANCELLED");
  const lastEvent = cancelled.auditTrail[cancelled.auditTrail.length - 1];
  assert.equal(lastEvent.action, "REQUEST_CANCELLED");
  assert.ok(lastEvent.reason.includes("transferred"));
});

