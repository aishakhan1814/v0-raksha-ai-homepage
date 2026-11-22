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
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const action = body.action;
  const selectedDonorIds = body.selectedDonorIds || body.selectedCandidateIds;
  const rejectionReason = body.rejectionReason || body.rejectReason;
  const notes = body.notes || body.reviewNotes;

  if (action !== "APPROVE" && action !== "REJECT") {
    return Response.json(
      { success: false, error: "Invalid review action. Must be 'APPROVE' or 'REJECT'" },
      { status: 400 }
    );
  }

  try {
    const engine = getCoordinationEngine();
    const updated = await engine.coordinatorReview(
      requestId,
      action,
      {
        userId: auth.user.userId,
        role: "coordinator",
        email: auth.user.email
      },
      {
        selectedDonorIds,
        rejectionReason,
        coordinatorNotes: notes
      }
    );

    return Response.json({
      success: true,
      message: action === "APPROVE"
        ? `Coordinator approved ${updated.approvedCandidateIds.length} donors for outreach`
        : "Coordinator rejected candidate matches",
      request: updated
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || "Failed to process coordinator review" },
      { status: 400 }
    );
  }
}
