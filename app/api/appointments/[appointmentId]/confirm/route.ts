import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;
    const db = await getDb();

    const result = await db.collection("appointments").updateOne(
      { appointmentId: appointmentId },
      {
        $set: {
          donorConfirmed: true,
          status: "confirmed"
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Appointment confirmed successfully"
    });

  } catch (err: any) {
    console.error("Failed to confirm appointment:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to confirm appointment" },
      { status: 500 }
    );
  }
}
