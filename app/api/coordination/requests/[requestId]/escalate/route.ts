import { authorizeRequest } from "../../../../../../lib/auth.ts";
import { getCoordinationEngine } from "../../../../../../lib/coordination/engine.ts";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  // Coordinator or System can trigger escalation check
  const auth = await authorizeRequest(req, ["coordinator"]);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { requestId } = await params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  try {
    const engine = getCoordinationEngine();
    const updated = await engine.checkTimeoutAndEscalate(
      requestId,
      {
        userId: auth.user.userId,
        role: "coordinator",
        email: auth.user.email
      },
      {
        forceEscalate: !!body.forceEscalate,
        customReason: body.reason
      }
    );

    return Response.json({
      success: true,
      isEscalated: updated.isEscalated,
      currentStatus: updated.status,
      escalationReason: updated.escalationReason,
      request: updated
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || "Failed to check timeout or escalate" },
      { status: 400 }
    );
  }
}
