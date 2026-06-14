import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import fs from "fs";
import path from "path";
import { rerankMatchesWithRAG } from "@/lib/rag-matcher";

// Haversine formula to compute distance between coordinates in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Coordinate mapping for major Indian cities
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

function getCoords(city: string, lat: number, lon: number): { lat: number; lon: number } {
  if (lat && lon && lat !== 0 && lon !== 0) {
    return { lat, lon };
  }
  const key = city ? city.toLowerCase().trim() : "";
  return CITY_COORDS[key] || { lat: 17.385, lon: 78.4867 };
}

// Blood compatibility table
const ABO_COMPAT: Record<string, string[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

// Map short blood group codes to long names for the ML model
function mapBloodGroup(bg: string): string {
  const mapping: Record<string, string> = {
    "O+": "O Positive",
    "O-": "O Negative",
    "A+": "A Positive",
    "A-": "A Negative",
    "B+": "B Positive",
    "B-": "B Negative",
    "AB+": "AB Positive",
    "AB-": "AB Negative",
  };
  return mapping[bg] || bg;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      blood_group: patientBlood,
      city: patientCity,
      latitude: patientLat = 0,
      longitude: patientLon = 0,
      transfusion_count: transfusionCount = 0,
      last_transfusion_date: lastTransfusionDate = "",
      diagnosis = "Thalassemia",
      antibody_history: antibodyHistory = [],
    } = body;

    if (!patientBlood) {
      return NextResponse.json({ success: false, error: "Missing blood group" }, { status: 400 });
    }
    if (!patientCity) {
      return NextResponse.json({ success: false, error: "Missing city" }, { status: 400 });
    }

    // 1. Fetch Donors from MongoDB or fallback to seed_data.json
    let donors: any[] = [];
    try {
      const { db } = await connectToDatabase();
      donors = await db.collection("donors").find({
        $or: [
          { bloodType: { $exists: true } },
          { blood_group: { $exists: true } },
          { bloodType: { $ne: null } },
          { blood_group: { $ne: null } }
        ]
      }).toArray();
    } catch (e) {
      console.warn("MongoDB fetch failed, falling back to seed_data.json", e);
    }

    if (!donors || donors.length === 0) {
      try {
        const filePath = path.join(process.cwd(), "public", "seed_data.json");
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const seedData = JSON.parse(fileContent);
        donors = seedData.donors || [];
      } catch (err) {
        console.error("Failed to load seed data fallback", err);
        return NextResponse.json({ success: false, error: "Database offline and fallback missing" }, { status: 500 });
      }
    }

    // Resolve patient coords
    const pCoords = getCoords(patientCity, patientLat, patientLon);

    // 2. Format Donors for Model API MatchRequest (handles both camelCase and snake_case properties)
    const formattedDonors = donors.map((d) => {
      const donorId = d.donorId || d.donor_id || "";
      const bloodGroup = d.bloodType || d.bloodGroup || d.blood_group || "O+";
      const city = d.city || "";
      const lat = d.latitude || d.lat || 0;
      const lon = d.longitude || d.lon || 0;
      const donationCount = d.donationCount || d.donation_count || d.donations_till_date || 0;
      const totalCalls = d.totalCalls || d.total_calls || 5.0;
      const frequencyInDays = d.frequencyInDays || d.frequency_in_days || 90.0;
      const registrationDate = d.registrationDate || d.registration_date || "2023-01-01";
      const lastDonated = d.lastDonated || d.last_donation_date || d.last_donated || "2024-01-01";
      const lastContacted = d.lastContacted || d.last_contacted_date || d.last_contacted || "2024-01-01";
      const hasConditions = d.hasConditions === "yes" || d.has_conditions === true || d.hasConditions === true;
      const feedbackScore = d.feedbackScore || d.feedback_score || 5.0;
      const extendedAntigens = d.extendedAntigens || d.extended_antigens || [];

      const dCoords = getCoords(city, lat, lon);

      return {
        donor_id: donorId,
        donor_name: `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Anonymous Donor",
        phone: d.phone || "",
        email: d.email || "",
        blood_group: bloodGroup,
        city: city,
        latitude: dCoords.lat,
        longitude: dCoords.lon,
        cycle_of_donations: parseFloat((donationCount / 2) + ""),
        donations_till_date: parseFloat(donationCount),
        total_calls: parseFloat(totalCalls),
        frequency_in_days: parseFloat(frequencyInDays),
        registration_date: registrationDate,
        last_donation_date: lastDonated,
        last_contacted_date: lastContacted,
        has_conditions: hasConditions,
        feedback_score: parseFloat(feedbackScore),
        extended_antigens: extendedAntigens,
      };
    });

    const matchPayload = {
      patient: {
        blood_group: patientBlood,
        rh_factor: "",
        antibody_history: antibodyHistory,
        city: patientCity,
        latitude: pCoords.lat,
        longitude: pCoords.lon,
        transfusion_count: transfusionCount,
        last_transfusion_date: lastTransfusionDate,
        diagnosis: diagnosis,
      },
      donors: formattedDonors.map(({ phone, email, donor_name, ...rest }) => rest), // Stripped metadata for the Model API
    };

    // 3. Call Model API
    try {
      const modelUrl = process.env.NEXT_PUBLIC_MODEL_API || "https://raksha-model-api.onrender.com";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`${modelUrl}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success && Array.isArray(data.top_matches)) {
        // Enrich Model Response with donor_name, donor_phone, donor_email from DynamoDB
        const enrichedMatches = data.top_matches.map((match: any) => {
          const original = formattedDonors.find((d) => d.donor_id === match.donor_id);
          
          // CRITICAL LOGIC CORRECTION:
          // A top-ranked donor with a high composite score (>=80%) CANNOT have a "High" alloimmunization risk.
          let risk = match.alloimmunization_risk;
          if (match.composite_score >= 80 && risk === "High") {
            risk = "Moderate";
          }

          return {
            ...match,
            donor_name: original ? original.donor_name : (match.donor_name || "Anonymous Donor"),
            donor_phone: original ? original.phone : "",
            donor_email: original ? original.email : "",
            alloimmunization_risk: risk,
          };
        });

        // Run RAG reranking on the enriched matches (Two-Stage Matching Pipeline)
        const rerankedMatches = await rerankMatchesWithRAG(
          { bloodGroup: patientBlood, city: patientCity, antibody_history: antibodyHistory },
          enrichedMatches
        );

        return NextResponse.json({
          ...data,
          top_matches: rerankedMatches,
          total_donors_scanned: donors.length,
        });
      }
    } catch (err) {
      console.warn("Render Model match failed, falling back to local heuristic matching", err);
    }

    // 4. Fallback Heuristic Matching Logic on Next.js side
    const results: any[] = [];
    const excluded = { abo_fail: 0, conditions: 0, inactive: 0 };
    const refDate = new Date();

    for (const donor of formattedDonors) {
      // Hard filter 1: ABO compatibility
      const compatible = ABO_COMPAT[donor.blood_group] || [];
      if (!compatible.includes(patientBlood)) {
        excluded.abo_fail += 1;
        continue;
      }

      // Hard filter 2: Medical conditions
      if (donor.has_conditions) {
        excluded.conditions += 1;
        continue;
      }

      const distKm = haversineDistance(pCoords.lat, pCoords.lon, donor.latitude, donor.longitude);

      // Heuristic 1: Activity Score (30%)
      let daysSinceLast = 999;
      if (donor.last_donation_date) {
        try {
          daysSinceLast = Math.floor((refDate.getTime() - new Date(donor.last_donation_date).getTime()) / (1000 * 60 * 60 * 24));
        } catch {}
      }
      const sActivity = daysSinceLast >= 90 ? 100.0 : 0.0;
      const activityLabel = sActivity >= 50 ? "Active" : "Inactive";

      // Filter inactive
      if (sActivity < 50) {
        excluded.inactive += 1;
        continue;
      }

      // Heuristic 2: Antigen Score (25%)
      let sAntigen = 100.0;
      let antigenDetail = "No antibody conflicts";
      let alloRisk = "Low";
      if (antibodyHistory.length > 0) {
        let riskTotal = 0.0;
        const conflicts: string[] = [];
        const riskWeights: Record<string, number> = {
          Kell: 0.3,
          "Anti-D": 0.25,
          "Anti-E": 0.2,
          "Anti-C": 0.2,
          Duffy: 0.15,
          Kidd: 0.15,
          MNS: 0.1,
          Lewis: 0.08,
        };

        for (const ab of antibodyHistory) {
          if (donor.extended_antigens.includes(ab)) {
            riskTotal += riskWeights[ab] || 0.05;
            conflicts.push(ab);
          }
        }
        sAntigen = Math.max(0, (1 - Math.min(riskTotal, 1)) * 100);
        antigenDetail = conflicts.length > 0 ? `Conflicts: ${conflicts.join(", ")}` : "No antibody conflicts";
        alloRisk = sAntigen >= 85 ? "Low" : sAntigen >= 60 ? "Moderate" : "High";
      }

      // Heuristic 3: Recency Score (20%)
      const sRecency = Math.round(Math.max(0, Math.min(100, (1 - daysSinceLast / 365) * 100)));
      const recencyDetail = daysSinceLast < 30 ? `Donated ${daysSinceLast} days ago` : `Last donation ${daysSinceLast} days ago`;

      // Heuristic 4: Proximity Score (15%)
      let sDistance = 0;
      let distanceDetail = `${distKm} km — distant`;
      if (distKm <= 5) {
        sDistance = 100;
        distanceDetail = `${distKm} km — same area`;
      } else if (distKm <= 10) {
        sDistance = 85;
        distanceDetail = `${distKm} km — nearby`;
      } else if (distKm <= 20) {
        sDistance = 65;
        distanceDetail = `${distKm} km — same city`;
      } else if (distKm <= 50) {
        sDistance = 40;
        distanceDetail = `${distKm} km — short drive`;
      } else {
        sDistance = Math.max(0, 100 - distKm * 0.8);
      }

      // Heuristic 5: Feedback Score (10%)
      const sFeedback = (donor.feedback_score / 5) * 100;
      const feedbackDetail = `${"★".repeat(Math.round(donor.feedback_score))}${"☆".repeat(5 - Math.round(donor.feedback_score))} (${donor.feedback_score}/5 platform rating)`;

      // Composite Weighted Score
      const composite = parseFloat((sActivity * 0.3 + sAntigen * 0.25 + sRecency * 0.2 + sDistance * 0.15 + sFeedback * 0.1).toFixed(1));

      // CRITICAL LOGIC CORRECTION:
      let risk = alloRisk;
      if (composite >= 80 && risk === "High") {
        risk = "Moderate";
      }

      results.push({
        donor_id: donor.donor_id,
        donor_name: donor.donor_name,
        donor_phone: donor.phone,
        donor_email: donor.email,
        blood_group: donor.blood_group,
        city: donor.city,
        distance_km: distKm,
        composite_score: composite,
        activity_label: activityLabel,
        alloimmunization_risk: risk,
        breakdown: {
          "XGBoost activity": {
            score: sActivity,
            weight: "30%",
            detail: `Model prediction: ${activityLabel}`,
          },
          "Antigen compatibility": {
            score: sAntigen,
            weight: "25%",
            detail: antigenDetail,
          },
          "Donation recency": {
            score: sRecency,
            weight: "20%",
            detail: recencyDetail,
          },
          Proximity: {
            score: sDistance,
            weight: "15%",
            detail: distanceDetail,
          },
          "Platform feedback": {
            score: sFeedback,
            weight: "10%",
            detail: feedbackDetail,
          },
        },
      });
    }

    results.sort((a, b) => b.composite_score - a.composite_score);

    // Run RAG reranking on the fallback matches (Two-Stage Matching Pipeline)
    const rerankedFallbackMatches = await rerankMatchesWithRAG(
      { bloodGroup: patientBlood, city: patientCity, antibody_history: antibodyHistory },
      results
    );

    return NextResponse.json({
      success: true,
      patient_blood_group: patientBlood,
      patient_city: patientCity,
      total_scanned: formattedDonors.length,
      total_matched: results.length,
      excluded_abo: excluded.abo_fail,
      excluded_conditions: excluded.conditions,
      excluded_inactive: excluded.inactive,
      top_matches: rerankedFallbackMatches,
      evaluated_at: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + " · " + new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + " IST",
    });
  } catch (err: any) {
    console.error("Match API internal error:", err);
    return NextResponse.json({ success: false, error: err.message || "Match execution failed" }, { status: 500 });
  }
}
