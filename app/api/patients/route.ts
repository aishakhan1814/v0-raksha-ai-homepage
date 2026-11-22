import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { authorizeRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await authorizeRequest(request, ["coordinator", "patient"]);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

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
