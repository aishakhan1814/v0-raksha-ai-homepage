import { authorizeCoordinator } from "../../../../lib/auth.ts";

export async function POST(request: Request) {
  // 1. Strictly authenticate requesting user as coordinator
  const auth = await authorizeCoordinator(request);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  // 2. Parse request payload
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const { query, top_k = 3, min_score_threshold = 0.25 } = body;
  if (!query || typeof query !== "string" || !query.trim()) {
    return Response.json(
      { success: false, error: "Query parameter is required and cannot be empty." },
      { status: 400 }
    );
  }

  // 3. Forward to secure backend RAG service
  const backendUrl = process.env.RAKSHAI_BACKEND_URL || "http://127.0.0.1:8000";
  const apiKey = process.env.RAKSHAI_ML_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        success: false,
        error: "RAG service authentication not configured on server (RAKSHAI_ML_API_KEY missing).",
        status: "SERVICE_UNAVAILABLE",
      },
      { status: 503 }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const upstreamResponse = await fetch(`${backendUrl}/rag/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        query: query.trim(),
        top_k: Number(top_k),
        min_score_threshold: Number(min_score_threshold),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text();
      return Response.json(
        {
          success: false,
          error: `Upstream RAG service responded with HTTP ${upstreamResponse.status}: ${errText}`,
          status: "UPSTREAM_ERROR",
        },
        { status: upstreamResponse.status === 401 ? 502 : upstreamResponse.status }
      );
    }

    const data = await upstreamResponse.json();
    return Response.json(data);
  } catch (err: any) {
    if (err.name === "AbortError") {
      return Response.json(
        {
          success: false,
          error: "Upstream RAG service timed out after 8000ms.",
          status: "GATEWAY_TIMEOUT",
        },
        { status: 504 }
      );
    }

    return Response.json(
      {
        success: false,
        error: `Could not connect to upstream RAG service: ${err.message}`,
        status: "SERVICE_UNAVAILABLE",
      },
      { status: 503 }
    );
  }
}
