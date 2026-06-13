import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ donorId: string }> }
) {
  try {
    const { donorId } = await params;
    const db = await getDb();

    // Fetch Donor Record from MongoDB
    const donor = await db.collection("donors").findOne({
      $or: [
        { donorId: donorId },
        { donor_id: donorId }
      ]
    });

    if (!donor) {
      return NextResponse.json({ success: false, error: "Donor not found" }, { status: 404 });
    }

    // Remove MongoDB _id field to keep payload clean
    const { _id, ...donorData } = donor;

    // Fetch Donor's Transfusion History from MongoDB
    let transfusions: any[] = [];
    try {
      const dbTransfusions = await db.collection("transfusions").find({
        $or: [
          { donorId: donorId },
          { donor_id: donorId }
        ]
      }).toArray();
      
      transfusions = dbTransfusions.map(({ _id, ...rest }) => rest) || [];
      transfusions.sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
    } catch (e) {
      console.warn("MongoDB transfusions retrieval failed, continuing with empty history:", e);
    }

    return NextResponse.json({ 
      success: true, 
      donor: donorData,
      transfusions 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ donorId: string }> }
) {
  try {
    const { donorId } = await params;
    const body = await req.json();
    const db = await getDb();

    // Exclude read-only properties
    const { _id, id, donorId: dId, donor_id, ...updateFields } = body;

    const result = await db.collection("donors").updateOne(
      {
        $or: [
          { donorId: donorId },
          { donor_id: donorId }
        ]
      },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Donor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Donor updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
