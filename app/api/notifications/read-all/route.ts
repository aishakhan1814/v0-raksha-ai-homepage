import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    await db.collection("notifications").updateMany(
      { userId: userId },
      { $set: { isRead: true } }
    );

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read"
    });

  } catch (err: any) {
    console.error("Failed to mark notifications as read:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
