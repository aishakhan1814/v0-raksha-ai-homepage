import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const aggregate = await db.collection("donors").aggregate([
      {
        $group: {
          _id: "$bloodType",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          bloodType: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]).toArray();

    return NextResponse.json({ success: true, bloodgroups: aggregate });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to aggregate blood groups" },
      { status: 500 }
    );
  }
}
