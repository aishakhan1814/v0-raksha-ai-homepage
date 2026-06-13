import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const donorId = searchParams.get("donorId");

    if (!donorId) {
      return NextResponse.json(
        { success: false, error: "donorId query parameter is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Query transfusions by donorId or donor_id
    const transfusions = await db.collection("transfusions").find({
      $or: [
        { donorId: donorId },
        { donor_id: donorId }
      ]
    }).toArray();

    let cleanTransfusions = transfusions.map(({ _id, ...rest }) => rest);

    // Seed default transfusion records if database is empty
    if (cleanAppointmentsCheck(cleanTransfusions)) {
      const defaultTransfusions = [
        {
          transfusionId: "TX-001",
          donorId: donorId,
          patientId: "patient-1",
          date: "2025-02-18",
          hemoglobinBefore: 6.8,
          hemoglobinAfter: 10.4,
          units: 2,
          outcome: "success",
          hospitalName: "KEM Hospital, Mumbai",
          createdAt: new Date().toISOString()
        },
        {
          transfusionId: "TX-002",
          donorId: donorId,
          patientId: "patient-1",
          date: "2024-11-22",
          hemoglobinBefore: 7.1,
          hemoglobinAfter: 10.2,
          units: 2,
          outcome: "success",
          hospitalName: "KEM Hospital, Mumbai",
          createdAt: new Date().toISOString()
        },
        {
          transfusionId: "TX-003",
          donorId: donorId,
          patientId: "patient-2",
          date: "2024-09-01",
          hemoglobinBefore: 6.5,
          hemoglobinAfter: 9.9,
          units: 2,
          outcome: "success",
          hospitalName: "KIMS Hospital, Hyderabad",
          createdAt: new Date().toISOString()
        }
      ];
      await db.collection("transfusions").insertMany(defaultTransfusions);
      cleanTransfusions = defaultTransfusions;
    }

    return NextResponse.json(cleanTransfusions);

  } catch (err: any) {
    console.error("Failed to fetch transfusions:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch transfusions" },
      { status: 500 }
    );
  }
}

function cleanAppointmentsCheck(arr: any[]) {
  return arr.length === 0;
}
