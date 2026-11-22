import test from "node:test";
import assert from "node:assert/strict";
import {
  verifyJWT,
  signJWT,
  verifyAuth,
  authorizeRequest,
  authorizeCoordinator,
  JWT_SECRET,
} from "../lib/auth.ts";

test("1. Missing token returns 401 Unauthorized", async () => {
  const req = new Request("http://localhost:3000/api/console/donors");
  const auth = await authorizeCoordinator(req);
  assert.ok(auth.errorResponse, "Expected error response for missing token");
  assert.equal(auth.errorResponse.status, 401);
  const data = await auth.errorResponse.json();
  assert.equal(data.success, false);
  assert.equal(data.code, "missing_token");
});

test("2. Invalid token signature returns 401 Unauthorized", async () => {
  const forgedToken = signJWT(
    { userId: "attacker", role: "coordinator" },
    "wrong_secret_key"
  );
  const req = new Request("http://localhost:3000/api/console/donors", {
    headers: { Authorization: `Bearer ${forgedToken}` },
  });
  const auth = await authorizeCoordinator(req);
  assert.ok(auth.errorResponse, "Expected error response for forged signature");
  assert.equal(auth.errorResponse.status, 401);
  const data = await auth.errorResponse.json();
  assert.equal(data.code, "invalid_token");
});

test("3. Expired token returns 401 Unauthorized", async () => {
  const expiredToken = signJWT(
    { userId: "coord-1", role: "coordinator" },
    JWT_SECRET,
    -100 // expired 100 seconds ago
  );
  const req = new Request("http://localhost:3000/api/console/donors", {
    headers: { Cookie: `raksha_token=${expiredToken}` },
  });
  const auth = await authorizeCoordinator(req);
  assert.ok(auth.errorResponse, "Expected error response for expired token");
  assert.equal(auth.errorResponse.status, 401);
  const data = await auth.errorResponse.json();
  assert.equal(data.code, "expired_token");
});

test("4. Valid non-coordinator token on coordinator-only route returns 403 Forbidden", async () => {
  // Donor role attempting to access coordinator route
  const donorToken = signJWT(
    { userId: "donor-1", email: "donor@example.com", role: "donor" },
    JWT_SECRET
  );
  const req1 = new Request("http://localhost:3000/api/console/donors", {
    headers: { Authorization: `Bearer ${donorToken}` },
  });
  const auth1 = await authorizeCoordinator(req1);
  assert.ok(auth1.errorResponse, "Expected 403 for donor accessing coordinator route");
  assert.equal(auth1.errorResponse.status, 403);
  const data1 = await auth1.errorResponse.json();
  assert.equal(data1.code, "forbidden");

  // Patient role attempting to access coordinator route
  const patientToken = signJWT(
    { userId: "patient-1", email: "patient@example.com", role: "patient" },
    JWT_SECRET
  );
  const req2 = new Request("http://localhost:3000/api/console/donors", {
    headers: { Cookie: `raksha_token=${patientToken}` },
  });
  const auth2 = await authorizeCoordinator(req2);
  assert.ok(auth2.errorResponse, "Expected 403 for patient accessing coordinator route");
  assert.equal(auth2.errorResponse.status, 403);
});

test("5. Valid coordinator token on coordinator route is allowed", async () => {
  const coordinatorToken = signJWT(
    {
      userId: "COORD-ADMIN",
      email: "admin@raksha.ai",
      role: "coordinator",
      name: "ADMIN",
    },
    JWT_SECRET
  );
  const req = new Request("http://localhost:3000/api/console/donors", {
    headers: { Cookie: `raksha_token=${coordinatorToken}` },
  });
  const auth = await authorizeCoordinator(req);
  assert.equal(auth.errorResponse, undefined);
  assert.ok(auth.user, "Expected authorized user object");
  assert.equal(auth.user.role, "coordinator");
  assert.equal(auth.user.email, "admin@raksha.ai");
});

test("6. Multi-role protected routes (patients/match) allow coordinator and patient but reject donor", async () => {
  const patientToken = signJWT(
    { userId: "pat-1", email: "pat@example.com", role: "patient" },
    JWT_SECRET
  );
  const donorToken = signJWT(
    { userId: "don-1", email: "don@example.com", role: "donor" },
    JWT_SECRET
  );
  const coordToken = signJWT(
    { userId: "coord-1", email: "c@raksha.ai", role: "coordinator" },
    JWT_SECRET
  );

  // Patient requesting patient route -> allowed
  const reqPat = new Request("http://localhost:3000/api/patients", {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const authPat = await authorizeRequest(reqPat, ["coordinator", "patient"]);
  assert.equal(authPat.errorResponse, undefined);
  assert.equal(authPat.user.role, "patient");

  // Coordinator requesting patient route -> allowed
  const reqCoord = new Request("http://localhost:3000/api/patients", {
    headers: { Authorization: `Bearer ${coordToken}` },
  });
  const authCoord = await authorizeRequest(reqCoord, ["coordinator", "patient"]);
  assert.equal(authCoord.errorResponse, undefined);
  assert.equal(authCoord.user.role, "coordinator");

  // Donor requesting patient route -> 403 Forbidden
  const reqDonor = new Request("http://localhost:3000/api/patients", {
    headers: { Authorization: `Bearer ${donorToken}` },
  });
  const authDonor = await authorizeRequest(reqDonor, ["coordinator", "patient"]);
  assert.ok(authDonor.errorResponse);
  assert.equal(authDonor.errorResponse.status, 403);
});

test("7. Client-supplied role cannot bypass cryptographic verification", async () => {
  // Tampered payload claiming role: coordinator with forged body
  const validToken = signJWT({ userId: "donor-99", role: "donor" }, JWT_SECRET);
  const [header, body, signature] = validToken.split(".");
  // Attacker decodes body, changes role to coordinator, re-encodes with same signature
  const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  parsed.role = "coordinator";
  const tamperedBody = Buffer.from(JSON.stringify(parsed)).toString("base64url");
  const tamperedToken = `${header}.${tamperedBody}.${signature}`;

  const req = new Request("http://localhost:3000/api/console/donors", {
    headers: { Authorization: `Bearer ${tamperedToken}` },
  });
  const auth = await authorizeCoordinator(req);
  assert.ok(auth.errorResponse);
  assert.equal(auth.errorResponse.status, 401);
});
