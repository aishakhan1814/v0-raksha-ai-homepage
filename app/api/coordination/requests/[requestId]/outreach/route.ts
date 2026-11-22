import { authorizeCoordinator } from "../../../../../../lib/auth.ts";
import { getCoordinationEngine } from "../../../../../../lib/coordination/engine.ts";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  // 1. Strict Coordinator Authorization Guard
  const auth = await authorizeCoordinator(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { requestId } = await params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const idempotencyKey =
    req.headers.get("x-idempotency-key") ||
    body.idempotencyKey ||
    `IDEMP-${requestId}-${Date.now()}`;

  try {
    const engine = getCoordinationEngine();
    const updated = await engine.dispatchOutreach(
      requestId,
      {
        userId: auth.user.userId,
        role: "coordinator",
        email: auth.user.email
      },
      idempotencyKey
    );

    return Response.json({
      success: true,
      message: `Outreach notifications successfully dispatched to ${updated.approvedCandidateIds.length} approved donors`,
      idempotencyKey,
      responseDeadline: updated.responseDeadline,
      request: updated
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || "Failed to dispatch outreach" },
      { status: 400 }
    );
  }
}
