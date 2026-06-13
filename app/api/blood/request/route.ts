import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  hyderabad: { lat: 17.385, lon: 78.4867 },
  secunderabad: { lat: 17.4399, lon: 78.4983 },
  warangal: { lat: 17.9784, lon: 79.5941 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  pune: { lat: 18.5204, lon: 73.8567 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  delhi: { lat: 28.7041, lon: 77.1025 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  lucknow: { lat: 26.8467, lon: 80.9462 },
  nagpur: { lat: 21.1458, lon: 79.0882 },
  visakhapatnam: { lat: 17.6868, lon: 83.2185 },
  vijayawada: { lat: 16.5062, lon: 80.648 },
  karimnagar: { lat: 18.4386, lon: 79.1288 },
  nizamabad: { lat: 18.6725, lon: 78.0941 },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      dob,
      gender,
      address,
      phone,
      email,
      parentName,
      parentPhone,
      diagnosis,
      bloodGroup,
      transfusionFreq,
      hospital,
      hematologist,
      lastHb,
      medications,
      complication, // Antibody history (array)
      source,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      donorCount,
      notif,
      consent1,
      consent2
    } = body;

    if (!firstName || !lastName || !phone || !bloodGroup || !address) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (Name, Phone, Blood Group, Address)" },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Resolve city and coordinates
    const city = address.split(",").pop()?.trim() || "Hyderabad";
    const cityKey = city.toLowerCase();
    const coords = CITY_COORDS[cityKey] || { lat: 17.385, lon: 78.4867 };

    // Generate IDs
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const patientId = `RKSH-${firstName.toUpperCase().substring(0, 4)}${randCode}`;
    const requestId = `REQ-${Date.now()}`;

    // 1. Insert patient profile
    const newPatient = {
      patientId,
      firstName,
      lastName,
      phone: phone.trim(),
      email: email ? email.trim() : "",
      bloodGroup,
      rhFactor: bloodGroup.includes("+") ? "Positive" : "Negative",
      blood_group: bloodGroup.includes("+") ? `${bloodGroup[0]} Positive` : `${bloodGroup[0]} Negative`,
      city,
      state: "",
      latitude: coords.lat,
      longitude: coords.lon,
      dob,
      gender,
      diagnosis: diagnosis || "Thalassemia Major",
      transfusionCount: parseInt(donorCount) || 0,
      transfusionFreq: transfusionFreq || "Every 21 days",
      hospital: hospital || "Rainbow Hospital",
      hematologist: hematologist || "Staff Physician",
      medications: medications || "",
      parentName: parentName || "",
      parentPhone: parentPhone || "",
      emergencyName: emergencyName || "",
      emergencyPhone: emergencyPhone || "",
      emergencyRelation: emergencyRelation || "",
      antibodyHistory: Array.isArray(complication) ? complication : [],
      complication: Array.isArray(complication) ? complication : [],
      assignedDonors: [],
      hemoglobinHistory: [
        {
          date: new Date().toISOString().split("T")[0],
          hb: parseFloat(lastHb) || 8.0
        }
      ],
      notif: notif || ["sms", "whatsapp"],
      consent1: !!consent1,
      consent2: !!consent2,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection("patients").insertOne(newPatient);

    // 2. Insert blood request
    const newRequest = {
      requestId,
      patientId,
      patientName: `${firstName} ${lastName}`.trim(),
      patientBloodGroup: bloodGroup,
      patientCity: city,
      diagnosis: diagnosis || "Thalassemia Major",
      urgency: "Standard",
      status: "pending",
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection("blood_requests").insertOne(newRequest);

    return NextResponse.json({
      success: true,
      requestId,
      patientId,
      message: "Patient registered and blood request created successfully"
    });

  } catch (err: any) {
    console.error("Patient registration and blood request failed:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Request failed" },
      { status: 500 }
    );
  }
}
