import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, backupDonorId } = body;

    if (!requestId) {
      return NextResponse.json({ success: false, error: "Missing required requestId" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Find and update the request in blood_requests collection
    const updateResult = await db.collection("blood_requests").findOneAndUpdate(
      { requestId: requestId },
      {
        $set: {
          status: "escalated",
          slaBreach: true,
          escalatedAt: new Date().toISOString(),
          backupDonorId: backupDonorId || null,
        }
      },
      { returnDocument: "after" }
    );

    if (!updateResult) {
      return NextResponse.json({ success: false, error: "Match request not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      requestId,
      status: "escalated",
      message: "Emergency SLA Failover Protocol registered in database",
      updatedRequest: updateResult,
    });
  } catch (err: any) {
    console.error("Failover update failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
