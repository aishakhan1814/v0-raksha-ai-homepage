import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { donorId, aiStatus, aiConfidence } = body;

    if (!donorId || !aiStatus) {
      return NextResponse.json(
        { success: false, error: "Missing donorId or aiStatus" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const result = await db.collection("donors").updateOne(
      {
        $or: [
          { donorId: donorId },
          { donor_id: donorId }
        ]
      },
      {
        $set: {
          aiStatus,
          aiConfidence: parseFloat(aiConfidence) || 85,
          aiEvaluatedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Donor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "AI status updated successfully" });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
