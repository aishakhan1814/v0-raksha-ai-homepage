import test from "node:test";
import assert from "node:assert/strict";
import { signJWT, JWT_SECRET } from "../lib/auth.ts";
import { POST } from "../app/api/rag/query/route.ts";

const SYNTHETIC_API_KEY = "test-rag-synthetic-key";

// Helper to create synthetic coordinator cookie
async function createCoordinatorCookie() {
  const token = await signJWT(
    { userId: "coord-test-01", role: "coordinator", email: "coord@raksha.ai" },
    JWT_SECRET,
    3600
  );
  return `raksha_token=${token}`;
}

// Helper to create synthetic donor cookie
async function createDonorCookie() {
  const token = await signJWT(
    { userId: "donor-test-01", role: "donor", email: "donor@raksha.ai" },
    JWT_SECRET,
    3600
  );
  return `raksha_token=${token}`;
}

test("1. Unauthorized request to /api/rag/query returns 401", async () => {
  const req = new Request("http://localhost:3000/api/rag/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "What is the pre-transfusion hemoglobin target?" }),
  });
  const res = await POST(req);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test("2. Non-coordinator request (donor/patient) returns 403 Forbidden", async () => {
  const cookie = await createDonorCookie();
  const req = new Request("http://localhost:3000/api/rag/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ query: "What is the pre-transfusion hemoglobin target?" }),
  });
  const res = await POST(req);
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.success, false);
});

test("3. Missing server ML API key fails closed with 503", async () => {
  const origKey = process.env.RAKSHAI_ML_API_KEY;
  delete process.env.RAKSHAI_ML_API_KEY;

  try {
    const cookie = await createCoordinatorCookie();
    const req = new Request("http://localhost:3000/api/rag/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ query: "What is the pre-transfusion hemoglobin target?" }),
    });
    const res = await POST(req);
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.status, "SERVICE_UNAVAILABLE");
  } finally {
    process.env.RAKSHAI_ML_API_KEY = origKey;
  }
});

test("4. Empty query string returns 400 Bad Request", async () => {
  process.env.RAKSHAI_ML_API_KEY = SYNTHETIC_API_KEY;
  const cookie = await createCoordinatorCookie();
  const req = new Request("http://localhost:3000/api/rag/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ query: "   " }),
  });
  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

test("5. Successful query forwarding with valid coordinator auth", async () => {
  process.env.RAKSHAI_ML_API_KEY = SYNTHETIC_API_KEY;
  process.env.RAKSHAI_BACKEND_URL = "http://mock-fastapi:8000";

  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers["X-API-Key"], SYNTHETIC_API_KEY);
    const body = JSON.parse(options.body);
    assert.equal(body.query, "What is the pre-transfusion hemoglobin target?");

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        status: "ANSWERED_GROUNDED",
        answer: "According to IAP guidelines, target Hb is 9.5-10.5 g/dL.",
        citations: [
          {
            document_title: "Clinical Practice Guidelines for Transfusion Management of Beta-Thalassemia Major",
            issuing_organization: "IAP",
            version: "2.1",
            publication_date: "2021-08-10",
            section: "SEC-2.1",
            page: 14,
            relevance_score: 0.85,
          },
        ],
        retrieved_chunks_count: 1,
        disclaimer: "DISCLAIMER: Decision support only.",
      }),
    };
  };

  try {
    const cookie = await createCoordinatorCookie();
    const req = new Request("http://localhost:3000/api/rag/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ query: "What is the pre-transfusion hemoglobin target?" }),
    });
    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "ANSWERED_GROUNDED");
    assert.equal(data.citations.length, 1);
    assert.equal(data.citations[0].section, "SEC-2.1");
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("6. Upstream FastAPI timeout returns 504 Gateway Timeout", async () => {
  process.env.RAKSHAI_ML_API_KEY = SYNTHETIC_API_KEY;
  process.env.RAKSHAI_BACKEND_URL = "http://mock-fastapi:8000";

  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const error = new Error("The operation was aborted");
    error.name = "AbortError";
    throw error;
  };

  try {
    const cookie = await createCoordinatorCookie();
    const req = new Request("http://localhost:3000/api/rag/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ query: "What is the pre-transfusion hemoglobin target?" }),
    });
    const res = await POST(req);
    assert.equal(res.status, 504);
    const data = await res.json();
    assert.equal(data.status, "GATEWAY_TIMEOUT");
  } finally {
    globalThis.fetch = origFetch;
  }
});
