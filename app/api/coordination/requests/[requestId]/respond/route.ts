import { getCoordinationEngine } from "../../../../../../lib/coordination/engine.ts";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { donorId, response, notes, channel, isSimulated } = body;
  if (!donorId || (response !== "ACCEPTED" && response !== "DECLINED")) {
    return Response.json(
      { success: false, error: "donorId and valid response ('ACCEPTED' | 'DECLINED') are required" },
      { status: 400 }
    );
  }

  try {
    const engine = getCoordinationEngine();
    const updated = await engine.recordDonorResponse(
      requestId,
      donorId,
      response,
      {
        userId: donorId,
        role: "donor"
      },
      {
        notes,
        channel: channel || "SIMULATED",
        isSimulated: isSimulated !== undefined ? isSimulated : true
      }
    );

    return Response.json({
      success: true,
      message: `Donor response '${response}' recorded successfully`,
      currentStatus: updated.status,
      acceptedCount: updated.acceptedDonorsCount,
      requiredCount: updated.requiredDonors,
      request: updated
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || "Failed to record donor response" },
      { status: 400 }
    );
  }
}
