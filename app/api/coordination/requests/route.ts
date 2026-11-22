import { authorizeRequest } from "../../../../lib/auth.ts";
import { getCoordinationEngine } from "../../../../lib/coordination/engine.ts";

export async function POST(req: Request) {
  // 1. Authorize: Coordinator or Patient can submit a blood request
  const auth = await authorizeRequest(req, ["coordinator", "patient"]);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const body = await req.json();
    const engine = getCoordinationEngine();

    const record = await engine.createRequest(body, {
      userId: auth.user.userId,
      role: auth.user.role as any,
      email: auth.user.email
    });

    return Response.json({
      success: true,
      message: "Blood request created successfully",
      request: record
    }, { status: 201 });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message || "Failed to create blood request"
    }, { status: 400 });
  }
}

export async function GET(req: Request) {
  // Authorize: Coordinators and Patients can view requests
  const auth = await authorizeRequest(req, ["coordinator", "patient"]);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") as any;
    const engine = getCoordinationEngine();
    const requests = await engine.getStore().listRequests(statusFilter || undefined);

    // If patient, restrict to their own requests
    const filtered = auth.user.role === "patient"
      ? requests.filter((r) => r.input.patientId === auth.user.userId)
      : requests;

    return Response.json({
      success: true,
      count: filtered.length,
      requests: filtered
    });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message || "Failed to list requests"
    }, { status: 500 });
  }
}
