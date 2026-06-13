import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Query notifications sorted by createdAt descending
    const notifications = await db.collection("notifications")
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray();

    let cleanNotifs = notifications.map(({ _id, ...rest }) => rest);

    // Seeding default notifications if empty
    if (cleanNotifs.length === 0) {
      const defaultNotifs = [
        {
          notificationId: "n-001",
          userId: userId,
          type: "milestone",
          title: "Milestone Reached",
          message: "You've been a Raksha Guardian for 8 months. Milestone badge earned!",
          isRead: false,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          notificationId: "n-002",
          userId: userId,
          type: "reminder",
          title: "Donation Window",
          message: "Reminder sent: 7 days before Arjun's transfusion window",
          isRead: false,
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        },
        {
          notificationId: "n-003",
          userId: userId,
          type: "impact",
          title: "Hemoglobin Boosted",
          message: "Your donation raised Arjun's hemoglobin from 6.8 → 10.4 g/dL",
          isRead: false,
          createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
        }
      ];
      await db.collection("notifications").insertMany(defaultNotifs);
      cleanNotifs = defaultNotifs;
    }

    return NextResponse.json({
      success: true,
      notifications: cleanNotifs
    });

  } catch (err: any) {
    console.error("Failed to fetch notifications:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
