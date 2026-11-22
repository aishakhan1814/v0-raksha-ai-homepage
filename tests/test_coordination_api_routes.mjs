import test from "node:test";
import assert from "node:assert/strict";
import { signJWT, JWT_SECRET } from "../lib/auth.ts";
import { POST as createRequestPost, GET as listRequestsGet } from "../app/api/coordination/requests/route.ts";
import { GET as getRequestDetails } from "../app/api/coordination/requests/[requestId]/route.ts";
import { POST as generateMatchesPost } from "../app/api/coordination/requests/[requestId]/matches/route.ts";
import { POST as reviewRequestPost } from "../app/api/coordination/requests/[requestId]/review/route.ts";
import { POST as dispatchOutreachPost } from "../app/api/coordination/requests/[requestId]/outreach/route.ts";
import { POST as respondDonorPost } from "../app/api/coordination/requests/[requestId]/respond/route.ts";
import { POST as escalateRequestPost } from "../app/api/coordination/requests/[requestId]/escalate/route.ts";
import { POST as completeRequestPost } from "../app/api/coordination/requests/[requestId]/complete/route.ts";
import { POST as cancelRequestPost } from "../app/api/coordination/requests/[requestId]/cancel/route.ts";
import { getCoordinationEngine } from "../lib/coordination/engine.ts";

async function createCookie(role = "coordinator", userId = "coord-01", email = "coord@raksha.ai") {
  const token = await signJWT({ userId, role, email }, JWT_SECRET, 3600);
  return `raksha_token=${token}`;
}

test("API 1. Unauthorized request to coordination API returns 401", async () => {
  const req = new Request("http://localhost:3000/api/coordination/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientId: "P-101", patientName: "Aarav", bloodGroup: "B+", city: "Hyderabad", hospital: "Rainbow Hospital" })
  });
  const res = await createRequestPost(req);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test("API 2. Patient creates blood request via API", async () => {
  const cookie = await createCookie("patient", "pat-101", "aarav@gmail.com");
  const req = new Request("http://localhost:3000/api/coordination/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      patientId: "pat-101",
      patientName: "Aarav Sharma",
      bloodGroup: "B+",
      city: "Hyderabad",
      hospital: "Rainbow Hospital",
      unitsRequired: 1,
      urgency: "URGENT"
    })
  });

  const res = await createRequestPost(req);
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.request.requestId.startsWith("REQ-"));
  assert.equal(data.request.status, "CREATED");
});

test("API 3. Coordinator matches and reviews request; non-coordinator rejected with 403", async () => {
  const patientCookie = await createCookie("patient", "pat-102", "patient2@gmail.com");
  const coordCookie = await createCookie("coordinator", "coord-01", "coord@raksha.ai");
  const donorCookie = await createCookie("donor", "dnr-01", "donor@gmail.com");

  // Create request
  const createReq = new Request("http://localhost:3000/api/coordination/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: patientCookie },
    body: JSON.stringify({
      patientId: "pat-102",
      patientName: "Diya Rao",
      bloodGroup: "O+",
      city: "Hyderabad",
      hospital: "Apollo Hospital",
      unitsRequired: 1
    })
  });
  const createRes = await createRequestPost(createReq);
  const { request } = await createRes.json();
  const requestId = request.requestId;

  // Generate matches
  const matchReq = new Request(`http://localhost:3000/api/coordination/requests/${requestId}/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: coordCookie }
  });
  const matchRes = await generateMatchesPost(matchReq, { params: Promise.resolve({ requestId }) });
  assert.equal(matchRes.status, 200);
  const matchData = await matchRes.json();
  assert.equal(matchData.request.status, "PENDING_COORDINATOR_REVIEW");

  // Non-coordinator (donor role) attempts review -> 403 Forbidden
  const donorReviewReq = new Request(`http://localhost:3000/api/coordination/requests/${requestId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: donorCookie },
    body: JSON.stringify({ action: "APPROVE" })
  });
  const donorReviewRes = await reviewRequestPost(donorReviewReq, { params: Promise.resolve({ requestId }) });
  assert.equal(donorReviewRes.status, 403);

  // Coordinator approves candidates -> 200 OK
  const coordReviewReq = new Request(`http://localhost:3000/api/coordination/requests/${requestId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: coordCookie },
    body: JSON.stringify({
      action: "APPROVE",
      notes: "Verified cross-match compatibility"
    })
  });
  const coordReviewRes = await reviewRequestPost(coordReviewReq, { params: Promise.resolve({ requestId }) });
  assert.equal(coordReviewRes.status, 200);
  const reviewData = await coordReviewRes.json();
  assert.equal(reviewData.request.status, "COORDINATOR_APPROVED");

  // Dispatch outreach
  const outreachReq = new Request(`http://localhost:3000/api/coordination/requests/${requestId}/outreach`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: coordCookie,
      "x-idempotency-key": `IDEMP-API-TEST-${requestId}`
    }
  });
  const outreachRes = await dispatchOutreachPost(outreachReq, { params: Promise.resolve({ requestId }) });
  assert.equal(outreachRes.status, 200);
  const outreachData = await outreachRes.json();
  assert.equal(outreachData.request.status, "AWAITING_RESPONSES");

  // Record donor response (accept)
  const approvedDonorId = outreachData.request.approvedCandidateIds[0];
  const respondReq = new Request(`http://localhost:3000/api/coordination/requests/${requestId}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ donorId: approvedDonorId, response: "ACCEPTED", notes: "Available today" })
  });
  const respondRes = await respondDonorPost(respondReq, { params: Promise.resolve({ requestId }) });
  assert.equal(respondRes.status, 200);
  const respondData = await respondRes.json();
  assert.equal(respondData.currentStatus, "ACCEPTED_FULFILLED");

  // Coordinator completes request
  const completeReq = new Request(`http://localhost:3000/api/coordination/requests/${requestId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: coordCookie },
    body: JSON.stringify({ notes: "Blood received and transfused safely" })
  });
  const completeRes = await completeRequestPost(completeReq, { params: Promise.resolve({ requestId }) });
  assert.equal(completeRes.status, 200);
  const completeData = await completeRes.json();
  assert.equal(completeData.request.status, "COMPLETED");
});
