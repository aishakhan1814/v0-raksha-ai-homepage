import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const count = await db.collection("blood_requests").countDocuments({ status: "completed" });
    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to count requests" },
      { status: 500 }
    );
  }
}
