import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const donorId = searchParams.get("donorId");

    if (!donorId) {
      return NextResponse.json(
        { success: false, error: "donorId query parameter is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Find requests matching donorId or donor_id
    const requests = await db.collection("blood_requests").find({
      $or: [
        { donorId: donorId },
        { donor_id: donorId }
      ]
    }).toArray();

    // Clean MongoDB _ids
    const cleanRequests = requests.map(({ _id, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      requests: cleanRequests
    });

  } catch (err: any) {
    console.error("Failed to fetch requests:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
