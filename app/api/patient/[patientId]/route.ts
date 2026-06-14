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

    let patient = await db.collection("patients").findOne({
      $or: [
        { patientId: decodedId },
        { requestId: decodedId }
      ]
    });

    // Fallback: If query was by requestId, but it wasn't saved on patients document
    if (!patient && decodedId.startsWith("REQ-")) {
      const requestDoc = await db.collection("blood_requests").findOne({ requestId: decodedId });
      if (requestDoc && requestDoc.patientId) {
        patient = await db.collection("patients").findOne({ patientId: requestDoc.patientId });
      }
    }

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
