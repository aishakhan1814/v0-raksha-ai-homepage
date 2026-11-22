import { authorizeCoordinator } from "../../../../lib/auth.ts";

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
  return mapping[bg] || bg || "O Positive";
}

export async function POST(request: Request) {
  // 1. Strictly authenticate requesting user as coordinator
  const auth = await authorizeCoordinator(request);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  // 2. Parse request
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { donorId, features: clientFeatures } = body;

  let modelFeatures: any = null;

  // 3. Resolve features server-side from database if donorId is provided
  if (donorId) {
    try {
      let dbConnect: any = null;
      try {
        const mongo = await import("@/lib/mongodb");
        dbConnect = mongo.connectToDatabase;
      } catch {
        try {
          const mongo = await import("../../../../lib/mongodb.ts");
          dbConnect = mongo.connectToDatabase;
        } catch {}
      }

      if (dbConnect) {
        const { db } = await dbConnect();
        const donorRecord = await db.collection("donors").findOne({
          $or: [
            { donorId: donorId },
            { donor_id: donorId },
            { phone: donorId },
            { name: donorId },
          ],
        });

      if (donorRecord) {
        const donationCount = parseInt(donorRecord.donationCount || donorRecord.donations_till_date || 0);

        // Gender mapping
        let gender = "missing";
        const g = (donorRecord.gender || "").toLowerCase().trim();
        if (g === "male" || g === "m") gender = "Male";
        else if (g === "female" || g === "f") gender = "Female";

        // Cycle of donations: inter-donation waiting cycle in days (90d male, 120d female, 0d inactive)
        let cycle_of_donations = 0.0;
        if (donorRecord.cycle_of_donations != null && !isNaN(parseFloat(donorRecord.cycle_of_donations))) {
          cycle_of_donations = parseFloat(donorRecord.cycle_of_donations);
        } else if (donationCount > 0) {
          cycle_of_donations = gender === "Female" ? 120.0 : 90.0;
        }

        // True frequency: only if multi-donation history exists; otherwise 0.0 (training median)
        let frequency_in_days = 0.0;
        if (donationCount > 1 && donorRecord.frequency_in_days != null) {
          frequency_in_days = parseFloat(donorRecord.frequency_in_days);
        } else if (donationCount > 1 && donorRecord.frequencyInDays != null && donorRecord.frequencyInDays !== 90) {
          frequency_in_days = parseFloat(donorRecord.frequencyInDays);
        }

        // Days since registration
        let registration_days = 366.0; // fallback to training median
        const regDateStr = donorRecord.registrationDate || donorRecord.registration_date || donorRecord.createdAt;
        if (regDateStr) {
          const parsed = new Date(regDateStr).getTime();
          if (!isNaN(parsed)) {
            registration_days = Math.max(0.0, parseFloat(((Date.now() - parsed) / (1000 * 60 * 60 * 24)).toFixed(1)));
          }
        }

        // Role: legacy platform classification uncollected in registration; use 'missing'
        const role = "missing";

        // Blood group canonical mapping
        const blood_group = mapBloodGroup(donorRecord.blood_group || donorRecord.bloodGroup || donorRecord.bloodType || "O Positive");

        // Donor type mapped to training categories
        let donor_type = "Other";
        if (donationCount > 1) {
          donor_type = "Regular Donor";
        } else if (donationCount === 1) {
          donor_type = "One-Time Donor";
        } else if (donorRecord.donorType === "regular" || donorRecord.donor_type === "regular") {
          donor_type = "Regular Donor";
        }

        // Eligibility status: self-reported intake screening
        const hasCondStr = typeof donorRecord.hasConditions === "string" ? donorRecord.hasConditions.toLowerCase().trim() : "";
        const hasCondBool = donorRecord.hasConditions === true || donorRecord.has_conditions === true;
        const hasCondText = donorRecord.conditions && typeof donorRecord.conditions === "string" && donorRecord.conditions.trim() !== "";
        const isNotEligible = hasCondStr === "yes" || hasCondBool || hasCondText;
        const eligibility_status = isNotEligible ? "not eligible" : "eligible";

        modelFeatures = {
          cycle_of_donations,
          frequency_in_days,
          registration_days,
          role,
          blood_group,
          gender,
          donor_type,
          eligibility_status,
        };
      }
    }
  } catch (dbErr) {
    // Database connection error handled below if modelFeatures remains null
  }
}

  // 4. Validate or fallback to validated clientFeatures (useful for synthetic assessments or offline testing)
  if (!modelFeatures && clientFeatures && typeof clientFeatures === "object") {
    modelFeatures = {
      cycle_of_donations: parseFloat(clientFeatures.cycle_of_donations ?? 0.0),
      frequency_in_days: parseFloat(clientFeatures.frequency_in_days ?? 0.0),
      registration_days: parseFloat(clientFeatures.registration_days ?? 366.0),
      role: clientFeatures.role || "missing",
      blood_group: mapBloodGroup(clientFeatures.blood_group || "O Positive"),
      gender: clientFeatures.gender || "missing",
      donor_type: clientFeatures.donor_type || "Other",
      eligibility_status: clientFeatures.eligibility_status || "eligible",
    };
  }

  if (!modelFeatures) {
    return Response.json(
      {
        success: false,
        error: "Donor record not found and no valid evaluation features supplied",
        code: "donor_not_found",
      },
      { status: 404 }
    );
  }

  // 5. Connect to FastAPI ML Inference Backend
  const fastApiUrl = process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";
  const mlApiKey = process.env.RAKSHAI_ML_API_KEY;

  if (!mlApiKey) {
    return Response.json(
      {
        success: false,
        error: "ML service authentication is not configured on the server",
        code: "ml_auth_unconfigured",
      },
      { status: 503 }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${fastApiUrl}/predict/donor-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": mlApiKey,
      },
      body: JSON.stringify(modelFeatures),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return Response.json(
          {
            success: false,
            error: "ML service authorization failed between backend services",
            code: "ml_auth_rejected",
          },
          { status: 503 }
        );
      }
      if (response.status === 503) {
        return Response.json(
          {
            success: false,
            error: errData.detail || "ML inference service is temporarily unavailable",
            code: "ml_service_unavailable",
          },
          { status: 503 }
        );
      }
      if (response.status === 422) {
        return Response.json(
          {
            success: false,
            error: "Model input validation rejected feature contract",
            detail: errData.detail,
            code: "ml_validation_error",
          },
          { status: 422 }
        );
      }
      return Response.json(
        {
          success: false,
          error: `Inference service returned status ${response.status}`,
          code: "ml_upstream_error",
        },
        { status: response.status }
      );
    }

    const predData = await response.json();

    return Response.json({
      success: true,
      donorId: donorId || "synthetic",
      prediction: {
        is_inactive: predData.is_inactive,
        status_label: predData.status_label,
        probabilities: predData.probabilities,
        model_version: predData.model_version,
      },
      disclaimer: "Experimental retrospective assessment classifying historical platform engagement. Not a prospective forecast and does not determine clinical eligibility or safety.",
    });
  } catch (fetchErr: any) {
    if (fetchErr.name === "AbortError") {
      return Response.json(
        {
          success: false,
          error: "ML inference request timed out after 5000ms",
          code: "ml_timeout",
        },
        { status: 503 }
      );
    }
    return Response.json(
      {
        success: false,
        error: "Failed to connect to ML inference backend",
        code: "ml_connection_failed",
      },
      { status: 503 }
    );
  }
}
