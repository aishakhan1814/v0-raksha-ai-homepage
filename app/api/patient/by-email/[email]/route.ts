import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email).trim();
    const { db } = await connectToDatabase();
    
    // Find patient by email (case-insensitive)
    const patient = await db.collection("patients").findOne({
      email: { $regex: new RegExp("^" + decodedEmail + "$", "i") }
    });
    
    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }
    
    const { _id, ...cleanPatient } = patient;
    return NextResponse.json({ success: true, patient: cleanPatient });
  } catch (err: any) {
    console.error("API patient by email fetch failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
