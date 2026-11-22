import { authorizeCoordinator } from "../../../../../../lib/auth.ts";
import { getCoordinationEngine } from "../../../../../../lib/coordination/engine.ts";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const auth = await authorizeCoordinator(req);
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
    const updated = await engine.completeRequest(
      requestId,
      {
        userId: auth.user.userId,
        role: "coordinator",
        email: auth.user.email
      },
      body.notes
    );

    return Response.json({
      success: true,
      message: "Blood request completed successfully",
      request: updated
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || "Failed to complete request" },
      { status: 400 }
    );
  }
}
