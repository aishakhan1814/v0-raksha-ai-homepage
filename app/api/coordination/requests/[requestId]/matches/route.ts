import { authorizeRequest } from "../../../../../../lib/auth.ts";
import { getCoordinationEngine } from "../../../../../../lib/coordination/engine.ts";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const auth = await authorizeRequest(req, ["coordinator", "patient"]);
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
    const updated = await engine.generateMatches(
      requestId,
      {
        userId: auth.user.userId,
        role: auth.user.role as any,
        email: auth.user.email
      },
      {
        maxCandidates: body.maxCandidates || 5,
        maxDistanceKm: body.maxDistanceKm || 100
      }
    );

    return Response.json({
      success: true,
      message: `Generated ${updated.candidates.length} compatible candidates for coordinator review`,
      request: updated
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || "Failed to generate matches" },
      { status: 400 }
    );
  }
}
