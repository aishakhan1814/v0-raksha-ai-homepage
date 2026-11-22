import { authorizeRequest } from "../../../../../lib/auth.ts";
import { getCoordinationEngine } from "../../../../../lib/coordination/engine.ts";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const auth = await authorizeRequest(req, ["coordinator", "patient"]);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { requestId } = await params;
  const engine = getCoordinationEngine();
  const request = await engine.getStore().getRequest(requestId);

  if (!request) {
    return Response.json(
      { success: false, error: `Blood request '${requestId}' not found` },
      { status: 404 }
    );
  }

  // Patients can only view their own requests
  if (auth.user.role === "patient" && request.input.patientId !== auth.user.userId) {
    return Response.json(
      { success: false, error: "Access denied to this blood request" },
      { status: 403 }
    );
  }

  // Sanitize candidates: mask phone numbers unless coordinator
  const sanitizedCandidates = request.candidates.map((c) => {
    const { rawPhone, ...rest } = c;
    return {
      ...rest,
      phoneMasked: c.rawPhone ? (auth.user.role === "coordinator" ? c.rawPhone : "***") : undefined
    };
  });

  return Response.json({
    success: true,
    request: {
      ...request,
      candidates: sanitizedCandidates
    }
  });
}
