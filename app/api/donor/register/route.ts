import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import bcrypt from "bcrypt";

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
      phone,
      email,
      age,
      gender,
      bloodType,
      state,
      city,
      lastDonated,
      donationCount,
      weight,
      hasConditions,
      conditions,
      availability,
      preferredTime,
      maxDistance,
      consentShare,
      consentNotify,
      consentData,
      consentAge,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !bloodType || !city) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (Name, Phone, Blood Type, City)" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if phone already registered
    const existingDonor = await db.collection("donors").findOne({ phone: phone.trim() });
    if (existingDonor) {
      return NextResponse.json(
        { success: false, error: "Phone number already registered" },
        { status: 400 }
      );
    }

    // Map city to coordinates
    const cityKey = city.toLowerCase().trim();
    const coords = CITY_COORDS[cityKey] || { lat: 17.385, lon: 78.4867 };

    // Generate unique donorId matching RKD-[bloodType]-[rand] format
    const randCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const donorId = `RKD-${bloodType.replace(/\s+/g, "")}-${randCode}`;

    // Hash default passwords ("raksha123" and their own phone)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("raksha123", salt);

    const newDonor = {
      donorId,
      firstName,
      lastName,
      phone: phone.trim(),
      email: email ? email.trim() : "",
      bloodType,
      bloodGroup: bloodType,
      blood_group: bloodType.includes("+") ? `${bloodType[0]} Positive` : `${bloodType[0]} Negative`,
      city,
      state: state || "",
      latitude: coords.lat,
      longitude: coords.lon,
      age: parseInt(age) || 25,
      gender: gender || "Male",
      donationCount: parseInt(donationCount) || 0,
      lastDonated: lastDonated || "Never",
      registrationDate: new Date().toISOString().split("T")[0],
      lastContacted: new Date().toISOString().split("T")[0],
      hasConditions: hasConditions || "no",
      conditions: conditions || null,
      availability: Array.isArray(availability) ? availability : ["weekdays", "weekends"],
      feedbackScore: 5.0,
      extendedAntigens: ["Kell"],
      totalCalls: 0,
      frequencyInDays: 90,
      weight: parseFloat(weight) || 60,
      preferredTime: preferredTime || "anytime",
      maxDistance: parseFloat(maxDistance) || 15,
      donorType: "regular",
      aiStatus: "Active",
      aiConfidence: 85,
      aiEvaluatedAt: new Date().toISOString(),
      isVerified: true,
      isActive: true,
      consentShare: !!consentShare,
      consentNotify: !!consentNotify,
      consentData: !!consentData,
      consentAge: !!consentAge,
      passwordHash,
      password: "raksha123", // plaintext password fallback for testing
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("donors").insertOne(newDonor);

    // Return the response format expected by register/donor page
    return NextResponse.json({
      success: true,
      donorId,
      donor: {
        donorId,
        firstName,
        lastName,
        phone,
        email,
        bloodType,
        city,
      }
    });

  } catch (err: any) {
    console.error("Donor registration error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Registration failed" },
      { status: 500 }
    );
  }
}
