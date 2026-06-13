import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const donorId = searchParams.get("donorId");
    const patientId = searchParams.get("patientId");

    if (!donorId && !patientId) {
      return NextResponse.json(
        { success: false, error: "donorId or patientId query parameter is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const query: any = {};
    if (donorId) {
      query.$or = [
        { donorId: donorId },
        { donor_id: donorId }
      ];
    } else if (patientId) {
      query.$or = [
        { patientId: patientId },
        { patient_id: patientId }
      ];
    }

    const appointments = await db.collection("appointments").find(query).toArray();
    let cleanAppointments = appointments.map(({ _id, ...rest }) => rest);

    // Dynamic Seeding if no appointments exist
    if (cleanAppointments.length === 0) {
      let hospitalName = "KEM Hospital Blood Bank, Mumbai";
      let hospitalAddress = "Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012";
      
      if (patientId) {
        const patient = await db.collection("patients").findOne({
          $or: [
            { requestId: patientId },
            { patientId: patientId }
          ]
        });
        if (patient) {
          hospitalName = patient.hospital || "Rainbow Hospital";
          hospitalAddress = patient.address || "Hyderabad";
        }
      }

      const defaultApt = {
        appointmentId: "apt-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
        donorId: donorId || "RKD-O+-RR8822",
        patientId: patientId || "patient-1",
        requestId: "REQ-9871",
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        hospitalName,
        hospitalAddress,
        status: "pending",
        donorConfirmed: false,
        createdAt: new Date().toISOString()
      };
      await db.collection("appointments").insertOne(defaultApt);
      cleanAppointments = [defaultApt];
    }

    return NextResponse.json(cleanAppointments);

  } catch (err: any) {
    console.error("Failed to fetch appointments:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
