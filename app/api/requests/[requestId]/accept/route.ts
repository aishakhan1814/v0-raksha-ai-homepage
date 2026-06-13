import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const db = await getDb();

    const result = await db.collection("blood_requests").updateOne(
      { requestId: requestId },
      {
        $set: {
          status: "accepted",
          respondedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Blood request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Blood request accepted successfully"
    });

  } catch (err: any) {
    console.error("Failed to accept request:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to accept request" },
      { status: 500 }
    );
  }
}
