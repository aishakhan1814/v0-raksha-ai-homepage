import test from "node:test";
import assert from "node:assert/strict";
import { signJWT, JWT_SECRET } from "../lib/auth.ts";
import { POST } from "../app/api/ml/predict-donor/route.ts";

const SYNTHETIC_ML_KEY = "test-rakshai-ml-key-12345";

// Mock fetch helper to simulate FastAPI ML service responses
function createMockFetch(status = 200, data = {}) {
  return async (url, options) => {
    // Verify API key is passed in header
    assert.equal(
      options.headers["X-API-Key"],
      SYNTHETIC_ML_KEY,
      "Expected server-side X-API-Key header to be forwarded"
    );

    // Verify exactly 8 features are sent in the body
    const body = JSON.parse(options.body);
    const expectedKeys = [
      "cycle_of_donations",
      "frequency_in_days",
      "registration_days",
      "role",
      "blood_group",
      "gender",
      "donor_type",
      "eligibility_status",
    ];
    for (const key of expectedKeys) {
      assert.ok(key in body, `Expected ${key} in forward payload`);
    }

    // Role must be missing representation, never invented
    assert.equal(body.role, "missing");

    // Frequency must be 0.0 when no multi-donation history exists, never 90
    assert.notEqual(body.frequency_in_days, 90.0, "Forbidden frequency=90 fallback detected");

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
    };
  };
}

test("1. Unauthorized request to /api/ml/predict-donor returns 401", async () => {
  const req = new Request("http://localhost:3000/api/ml/predict-donor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ donorId: "test-donor" }),
  });
  const res = await POST(req);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test("2. Non-coordinator request (donor/patient) returns 403 Forbidden", async () => {
  const donorToken = signJWT({ userId: "d-1", role: "donor" }, JWT_SECRET);
  const req = new Request("http://localhost:3000/api/ml/predict-donor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${donorToken}`,
    },
    body: JSON.stringify({ donorId: "test-donor" }),
  });
  const res = await POST(req);
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, "forbidden");
});

test("3. Missing server ML API key fails closed with 503", async () => {
  const coordToken = signJWT({ userId: "c-1", role: "coordinator" }, JWT_SECRET);
  const originalKey = process.env.RAKSHAI_ML_API_KEY;
  delete process.env.RAKSHAI_ML_API_KEY;

  try {
    const req = new Request("http://localhost:3000/api/ml/predict-donor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${coordToken}`,
      },
      body: JSON.stringify({
        features: {
          cycle_of_donations: 0,
          frequency_in_days: 0,
          registration_days: 100,
          blood_group: "O+",
          gender: "Male",
          donor_type: "Regular Donor",
          eligibility_status: "eligible",
        },
      }),
    });
    const res = await POST(req);
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.code, "ml_auth_unconfigured");
  } finally {
    if (originalKey) process.env.RAKSHAI_ML_API_KEY = originalKey;
  }
});

test("4. Successful prediction forwarding with valid coordinator auth and feature contract", async () => {
  const coordToken = signJWT({ userId: "c-1", role: "coordinator" }, JWT_SECRET);
  process.env.RAKSHAI_ML_API_KEY = SYNTHETIC_ML_KEY;

  const originalFetch = global.fetch;
  global.fetch = createMockFetch(200, {
    is_inactive: 1,
    status_label: "Inactive",
    probabilities: { active: 0.35, inactive: 0.65 },
    model_version: "1.0.0",
  });

  try {
    const req = new Request("http://localhost:3000/api/ml/predict-donor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${coordToken}`,
      },
      body: JSON.stringify({
        features: {
          cycle_of_donations: 0.0,
          frequency_in_days: 0.0,
          registration_days: 720.0,
          role: "missing",
          blood_group: "O Positive",
          gender: "Male",
          donor_type: "Regular Donor",
          eligibility_status: "eligible",
        },
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.prediction.is_inactive, 1);
    assert.equal(data.prediction.status_label, "Inactive");
    assert.equal(data.prediction.probabilities.inactive, 0.65);
    assert.equal(data.prediction.model_version, "1.0.0");
    assert.ok(data.disclaimer.includes("Experimental retrospective assessment"));

    // Verify NO secrets leaked in response
    const jsonStr = JSON.stringify(data);
    assert.equal(jsonStr.includes(SYNTHETIC_ML_KEY), false);
    assert.equal(jsonStr.includes("8000"), false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("5. Upstream FastAPI 503 unavailable handled gracefully", async () => {
  const coordToken = signJWT({ userId: "c-1", role: "coordinator" }, JWT_SECRET);
  process.env.RAKSHAI_ML_API_KEY = SYNTHETIC_ML_KEY;

  const originalFetch = global.fetch;
  global.fetch = createMockFetch(503, {
    detail: "ML inference model is currently unavailable or failed to initialize.",
  });

  try {
    const req = new Request("http://localhost:3000/api/ml/predict-donor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${coordToken}`,
      },
      body: JSON.stringify({
        features: {
          cycle_of_donations: 1.0,
          frequency_in_days: 0.0,
          registration_days: 100.0,
          role: "missing",
          blood_group: "A+",
          gender: "Female",
          donor_type: "One-Time Donor",
          eligibility_status: "eligible",
        },
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.code, "ml_service_unavailable");
  } finally {
    global.fetch = originalFetch;
  }
});

test("6. Upstream FastAPI 422 validation error forwarded with details", async () => {
  const coordToken = signJWT({ userId: "c-1", role: "coordinator" }, JWT_SECRET);
  process.env.RAKSHAI_ML_API_KEY = SYNTHETIC_ML_KEY;

  const originalFetch = global.fetch;
  global.fetch = createMockFetch(422, {
    detail: [{ loc: ["body", "cycle_of_donations"], msg: "field required" }],
  });

  try {
    const req = new Request("http://localhost:3000/api/ml/predict-donor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${coordToken}`,
      },
      body: JSON.stringify({
        features: {
          cycle_of_donations: 0,
          frequency_in_days: 0,
          registration_days: 50,
          blood_group: "B+",
          gender: "Male",
          donor_type: "Regular Donor",
          eligibility_status: "eligible",
        },
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 422);
    const data = await res.json();
    assert.equal(data.code, "ml_validation_error");
  } finally {
    global.fetch = originalFetch;
  }
});

test("7. Upstream timeout after 5000ms returns 503 with timeout code", async () => {
  const coordToken = signJWT({ userId: "c-1", role: "coordinator" }, JWT_SECRET);
  process.env.RAKSHAI_ML_API_KEY = SYNTHETIC_ML_KEY;

  const originalFetch = global.fetch;
  global.fetch = async () => {
    const err = new Error("The operation was aborted");
    err.name = "AbortError";
    throw err;
  };

  try {
    const req = new Request("http://localhost:3000/api/ml/predict-donor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${coordToken}`,
      },
      body: JSON.stringify({
        features: {
          cycle_of_donations: 0,
          frequency_in_days: 0,
          registration_days: 50,
          blood_group: "B+",
          gender: "Male",
          donor_type: "Regular Donor",
          eligibility_status: "eligible",
        },
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.code, "ml_timeout");
  } finally {
    global.fetch = originalFetch;
  }
});
