import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const patients = await db.collection("patients").find({}).toArray();
    
    // Remove MongoDB _id field to keep payload clean
    const cleanPatients = patients.map(({ _id, ...rest }) => rest);
    
    return NextResponse.json(cleanPatients);
  } catch (err: any) {
    console.error("API patients fetch failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
