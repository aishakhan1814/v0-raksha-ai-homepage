import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const decodedId = decodeURIComponent(patientId).trim();
    const { db } = await connectToDatabase();

    const patient = await db.collection("patients").findOne({
      $or: [
        { patientId: decodedId },
        { requestId: decodedId }
      ]
    });

    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }

    const { _id, ...cleanPatient } = patient;
    return NextResponse.json({ success: true, patient: cleanPatient });
  } catch (err: any) {
    console.error("API patient fetch failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
