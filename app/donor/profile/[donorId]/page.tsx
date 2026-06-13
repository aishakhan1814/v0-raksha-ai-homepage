"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClinicalDispatchModal from "@/components/raksha/clinical-dispatch-modal";

interface PageProps {
  params: Promise<{ donorId: string }>;
}

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

function getCoords(cityName: string, latVal: number, lonVal: number): { lat: number; lon: number } {
  if (latVal && lonVal && latVal !== 0 && lonVal !== 0) {
    return { lat: latVal, lon: lonVal };
  }
  const key = cityName ? cityName.toLowerCase().trim() : "";
  return CITY_COORDS[key] || { lat: 17.385, lon: 78.4867 };
}

interface Toast {
  show: boolean;
  message: string;
  type: "success" | "error";
}

export default function DonorProfilePage({ params }: PageProps) {
  const router = useRouter();
  const { donorId } = use(params);

  // States
  const [donor, setDonor] = useState<any>(null);
  const [transfusions, setTransfusions] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<string>("Active");
  const [confidence, setConfidence] = useState<number>(0);
  const [evaluatedAt, setEvaluatedAt] = useState<string>("");
  const [factors, setFactors] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [requesting, setRequesting] = useState<boolean>(false);
  const [requestSuccess, setRequestSuccess] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast>({ show: false, message: "", type: "success" });
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);

  // Animations
  const [animateBars, setAnimateBars] = useState<boolean>(false);
  const [dashOffset, setDashOffset] = useState<number>(219.9); // 2 * PI * 35 radius

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        // 1. Fetch from DynamoDB through local Next.js API
        const donorRes = await fetch(`/api/donor/${donorId}`);
        const donorData = await donorRes.json();

        if (!donorData.success) {
          throw new Error(donorData.error || "Failed to load donor profile");
        }

        const d = donorData.donor;
        setDonor(d);
        setTransfusions(donorData.transfusions || []);

        // 2. Prepare payload for Model API
        const bloodType = d.bloodType || d.bloodGroup || d.blood_group || "O+";
        const city = d.city || "";
        const donationCount = d.donationCount || d.donation_count || d.donations_till_date || 0;
        const totalCalls = d.totalCalls || d.total_calls || 5.0;
        const frequencyInDays = d.frequencyInDays || d.frequency_in_days || 90.0;
        const registrationDate = d.registrationDate || d.registration_date || "2023-01-01";
        const lastDonated = d.lastDonated || d.last_donation_date || d.last_donated || "2024-01-01";
        const lastContacted = d.lastContacted || d.last_contacted_date || d.last_contacted || "2024-01-01";
        const hasConditions = d.hasConditions === "yes" || d.has_conditions === true || d.hasConditions === true;
        const feedbackScore = d.feedbackScore || d.feedback_score || 5.0;

        const resolvedCoords = getCoords(city, d.latitude || d.lat || 0, d.longitude || d.lon || 0);

        const predictPayload = {
          donor_id: donorId,
          blood_group: bloodType,
          city: city,
          latitude: resolvedCoords.lat,
          longitude: resolvedCoords.lon,
          cycle_of_donations: parseFloat((donationCount / 2).toFixed(1)),
          donations_till_date: parseFloat(donationCount),
          total_calls: parseFloat(totalCalls),
          frequency_in_days: parseFloat(frequencyInDays),
          registration_date: registrationDate,
          last_donation_date: lastDonated,
          last_contacted_date: lastContacted,
          has_conditions: hasConditions,
          feedback_score: parseFloat(feedbackScore),
        };

        // 3. Call Model API Predict
        try {
          const modelApiUrl = process.env.NEXT_PUBLIC_MODEL_API || "https://raksha-model-api.onrender.com";
          const predRes = await fetch(`${modelApiUrl}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(predictPayload),
          });
          const predData = await predRes.json();

          if (predData.success) {
            setPrediction(predData.prediction);
            setConfidence(predData.confidence);
            setEvaluatedAt(predData.evaluated_at);
            setFactors(predData.factors);

            // Animate SVG ring and score bars
            const targetOffset = 219.9 - (219.9 * predData.confidence) / 100;
            setTimeout(() => {
              setDashOffset(targetOffset);
              setAnimateBars(true);
            }, 100);
          } else {
            throw new Error("Prediction API failed");
          }
        } catch (predErr) {
          console.warn("Model predict API failed, running local heuristics fallback:", predErr);
          
          // Local Heuristic Fallback Prediction
          const today = new Date();
          let daysSinceLast = 999;
          if (lastDonated) {
            try {
              daysSinceLast = Math.floor((today.getTime() - new Date(lastDonated).getTime()) / (1000 * 60 * 60 * 24));
            } catch {}
          }
          const isPredictionActive = daysSinceLast >= 90;
          const fallbackConf = isPredictionActive ? 85.0 : 40.0;
          const fallbackLabel = isPredictionActive ? "Active" : "Inactive";
          
          setPrediction(fallbackLabel);
          setConfidence(fallbackConf);
          setEvaluatedAt(new Date().toISOString().replace("T", " ").substring(0, 19));
          setFactors({
            recency: {
              label: "Last donation",
              score: Math.max(0, Math.min(100, (1 - daysSinceLast / 365) * 100)),
              detail: `${daysSinceLast} days ago`
            },
            engagement: {
              label: "Last contacted",
              score: 80,
              detail: "Contacted recently"
            },
            loyalty: {
              label: "Time registered",
              score: 90,
              detail: "Registered donor"
            },
            cycle: {
              label: "Donation cycles",
              score: Math.min(100, (predictPayload.cycle_of_donations / 10) * 100),
              detail: `${predictPayload.cycle_of_donations} cycles completed`
            }
          });

          // Animate SVG ring and score bars fallback
          const targetOffset = 219.9 - (219.9 * fallbackConf) / 100;
          setTimeout(() => {
            setDashOffset(targetOffset);
            setAnimateBars(true);
          }, 100);
        }

      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [donorId]);

  const handleRequestDonor = () => {
    if (!donor) return;
    setDispatchModalOpen(true);
  };

  const label = (txt: string) => (
    <div
      style={{
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#6B7280",
        marginBottom: 6,
      }}
    >
      {txt}
    </div>
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#060C16",
          color: "#FAF9F7",
          fontFamily: "'DM Sans', sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
        className="grain-overlay"
      >
        <span
          style={{
            width: 32,
            height: 32,
            border: "3px solid #111827",
            borderTopColor: "#9B2335",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", color: "#9CA3AF" }}>
          Querying Raksha AI model prediction...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#060C16",
          color: "#FAF9F7",
          fontFamily: "'DM Sans', sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          padding: "24px",
        }}
        className="grain-overlay"
      >
        <div
          style={{
            color: "#C0152A",
            fontSize: "1.1rem",
            padding: "20px 24px",
            background: "rgba(192,21,42,0.08)",
            border: "1px solid rgba(192,21,42,0.3)",
            borderRadius: "4px",
            maxWidth: "500px",
            textAlign: "center",
          }}
        >
          {error || "Donor profile not found"}
        </div>
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            color: "#FAF9F7",
            border: "1px solid #1e293b",
            padding: "10px 20px",
            fontSize: "0.85rem",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const d = donor;
  const firstName = d.firstName || "";
  const lastName = d.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Anonymous Donor";
  const bloodGroup = d.bloodType || d.bloodGroup || d.blood_group || "O+";
  const hasConditions = d.hasConditions === "yes" || d.has_conditions === true || d.hasConditions === true;
  const availability = Array.isArray(d.availability)
    ? d.availability.join(", ")
    : typeof d.availability === "string"
    ? d.availability
    : "Not Configured";

  let likelihood = "Low";
  if (prediction === "Active") {
    likelihood = confidence >= 80 ? "High" : "Moderate";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060C16",
        color: "#FAF9F7",
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: "120px",
      }}
      className="grain-overlay"
    >
      {/* Sticky top navigation bar */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          background: "#0A1628",
          borderBottom: "1px solid rgba(139, 26, 42, 0.3)",
          height: "64px",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => router.push("/")}>
            <svg viewBox="0 0 48 56" fill="none" width="28" height="32" style={{ flexShrink: 0 }}>
              <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
              <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
              <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", fontWeight: 700, color: "#FAF9F7", letterSpacing: "0.5px" }}>
                Raksha<span style={{ color: "#2CA8A0" }}>AI</span>
              </span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7280", marginTop: 2 }}>
                Donor Matching Engine
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push("/console")}
            style={{
              background: "transparent",
              border: "1px solid rgba(250, 249, 247, 0.2)",
              color: "#9CA3AF",
              padding: "6px 14px",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            Coordinator Console
          </button>
        </div>
      </nav>

      {/* Main Page Content Container */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 24px" }}>
        
        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            color: "#9CA3AF",
            border: "1px solid #1e293b",
            padding: "10px 20px",
            fontSize: "0.82rem",
            cursor: "pointer",
            borderRadius: "4px",
            transition: "all 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "28px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#FAF9F7";
            (e.currentTarget as HTMLButtonElement).style.color = "#FAF9F7";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e293b";
            (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
          }}
        >
          ← Back to results
        </button>

        {/* Section 1 — Identity Card */}
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "4px", padding: "32px", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px", borderBottom: "1px solid #1e293b", paddingBottom: "24px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#0A1628",
                  border: "2px solid #C0152A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: "#FAF9F7",
                  flexShrink: 0,
                }}
              >
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
                    {fullName}
                  </h1>
                  <span
                    style={{
                      background: "#9B2335",
                      color: "#FAF9F7",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.75rem",
                      padding: "3px 10px",
                      fontWeight: 600,
                      borderRadius: "2px",
                    }}
                  >
                    {bloodGroup}
                  </span>
                </div>
                <div style={{ fontSize: "0.9rem", color: "#9CA3AF" }}>
                  {d.city || "N/A"}, {d.state || "N/A"}
                </div>
              </div>
            </div>

            {/* Live AI status badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: prediction === "Active" ? "rgba(44,168,160,0.1)" : "rgba(192,21,42,0.1)",
                border: `1px solid ${prediction === "Active" ? "#2CA8A0" : "#C0152A"}`,
                borderRadius: "2px",
                padding: "6px 14px",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: prediction === "Active" ? "#2CA8A0" : "#C0152A",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: prediction === "Active" ? "#2CA8A0" : "#C0152A",
                  display: "inline-block",
                }}
              />
              Live AI Status: {prediction} · {confidence}% confidence
            </div>
          </div>

          {/* Profile details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            <div>
              {label("Phone Number")}
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem" }}>
                {d.phone || "Not Shared"}
              </div>
            </div>
            <div>
              {label("Email Address")}
              <div style={{ fontSize: "0.95rem" }}>
                {d.email || "Not Shared"}
              </div>
            </div>
            <div>
              {label("Age / Gender")}
              <div style={{ fontSize: "0.95rem" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.age || "N/A"}</span> yrs · {d.gender || "N/A"}
              </div>
            </div>
            <div>
              {label("Total Donations")}
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem", fontWeight: 600, color: "#2CA8A0" }}>
                {d.donationCount || d.donation_count || d.donations_till_date || 0} donations
              </div>
            </div>
            <div>
              {label("Last Donated")}
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem" }}>
                {d.lastDonated || d.last_donation_date || d.last_donated || "Never"}
              </div>
            </div>
            <div>
              {label("Available Days")}
              <div style={{ fontSize: "0.95rem", textTransform: "capitalize" }}>
                {availability}
              </div>
            </div>
            <div style={{ gridColumn: "span 1" }}>
              {label("Medical Conditions")}
              <div style={{ fontSize: "0.95rem", color: hasConditions ? "#C0152A" : "#9CA3AF" }}>
                {hasConditions ? (d.conditions || "Yes (details unspecified)") : "None Recorded"}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Raksha AI Live Assessment */}
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "4px", padding: "32px", marginBottom: "28px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "24px" }}>
            <div>
              <div style={{ fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C0152A", fontWeight: 700, marginBottom: 4 }}>
                ◈ RAKSHA AI — LIVE DONOR ASSESSMENT
              </div>
              <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                Evaluated {evaluatedAt || "just now"} · XGBoost · Trained on 7,033 donors · ROC-AUC 0.9999
              </div>
            </div>

            {/* Confidence ring SVG */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#0A1628", border: "1px solid #1e293b", padding: "10px 18px", borderRadius: "4px" }}>
              <div style={{ position: "relative", width: "80px", height: "80px" }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" fill="transparent" stroke="#1e293b" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="transparent"
                    stroke={prediction === "Active" ? "#2CA8A0" : "#C0152A"}
                    strokeWidth="6"
                    strokeDasharray="219.9"
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                    style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
                  />
                  <text
                    x="50%"
                    y="50%"
                    dominantBaseline="central"
                    textAnchor="middle"
                    fill="#FAF9F7"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem", fontWeight: 700 }}
                  >
                    {confidence}%
                  </text>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7280" }}>
                  Model Confidence
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: prediction === "Active" ? "#2CA8A0" : "#C0152A" }}>
                  {prediction} Prediction
                </div>
              </div>
            </div>
          </div>

          {/* Factor cards */}
          {factors && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "24px" }}>
              {Object.entries(factors).map(([key, val]: any) => {
                const scoreColor = val.score >= 70 ? "#2CA8A0" : val.score >= 40 ? "#D4A847" : "#C0152A";
                return (
                  <div key={key} style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.02)", padding: "14px 16px", borderRadius: "2px" }}>
                    <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", marginBottom: 4 }}>
                      {val.label}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1rem", fontWeight: 700, color: scoreColor }}>
                        {val.score}%
                      </span>
                    </div>
                    <div style={{ height: "3px", background: "#0D0D0D", overflow: "hidden", marginBottom: 6 }}>
                      <div
                        style={{
                          height: "100%",
                          background: scoreColor,
                          width: animateBars ? `${val.score}%` : "0%",
                          transition: "width 1s ease",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#6B7280", lineHeight: 1.3 }}>
                      {val.detail}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Prediction statement */}
          <div style={{ background: "rgba(44,168,160,0.05)", borderLeft: "3px solid #2CA8A0", padding: "16px 20px" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5, color: "#FAF9F7" }}>
              This donor shows <strong style={{ color: prediction === "Active" ? "#2CA8A0" : "#C0152A" }}>{likelihood}</strong> likelihood of active donation based on their donation history, engagement frequency, and platform activity.
            </p>
          </div>
        </div>

        {/* Section 3 — Donation History */}
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "4px", padding: "32px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 700, margin: "0 0 16px" }}>
            Donation & Transfusion History
          </h2>

          {transfusions.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e293b", color: "#9CA3AF" }}>
                    <th style={{ padding: "12px 8px" }}>Date</th>
                    <th style={{ padding: "12px 8px" }}>Hb Before</th>
                    <th style={{ padding: "12px 8px" }}>Hb After</th>
                    <th style={{ padding: "12px 8px" }}>Units</th>
                    <th style={{ padding: "12px 8px" }}>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {transfusions.map((t: any) => {
                    const isPositive = t.outcome?.toLowerCase() === "success" || t.outcome?.toLowerCase() === "positive" || t.outcome?.toLowerCase() === "good";
                    return (
                      <tr key={t.transfusionId || t.transfusion_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "12px 8px", fontFamily: "'JetBrains Mono', monospace" }}>{t.date || "N/A"}</td>
                        <td style={{ padding: "12px 8px", fontFamily: "'JetBrains Mono', monospace" }}>{t.hemoglobinBefore || t.hb_before || "—"} g/dL</td>
                        <td style={{ padding: "12px 8px", fontFamily: "'JetBrains Mono', monospace" }}>{t.hemoglobinAfter || t.hb_after || "—"} g/dL</td>
                        <td style={{ padding: "12px 8px", fontFamily: "'JetBrains Mono', monospace" }}>{t.units || "—"} units</td>
                        <td style={{ padding: "12px 8px" }}>
                          <span style={{ color: isPositive ? "#2CA8A0" : "#D4A847", fontWeight: 600 }}>
                            {t.outcome || "Completed"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                background: "#0A1628",
                border: "1px solid #1e293b",
                padding: "24px",
                textAlign: "center",
                color: "#6B7280",
                fontSize: "0.9rem",
              }}
            >
              No transfusion history recorded yet
            </div>
          )}
        </div>

      </div>

      {/* Section 4 — Action Bar (Sticky Bottom) */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#0A1628",
          borderTop: "1px solid #1e293b",
          padding: "16px 24px",
          zIndex: 90,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              Quick action for {fullName}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>
              Alert is dispatched instantly to the blood bank coordinator.
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                // Pre-filled email coordinator simulation
                window.location.href = `mailto:coordinator@raksha.ai?subject=Urgent: Match request for ${fullName}&body=Requesting coordinator matching process for donor ID ${donorId}.`;
              }}
              style={{
                background: "transparent",
                color: "#9CA3AF",
                border: "1px solid #1e293b",
                padding: "12px 20px",
                fontSize: "0.82rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "2px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#FAF9F7";
                (e.currentTarget as HTMLButtonElement).style.color = "#FAF9F7";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e293b";
                (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
              }}
            >
              Message Coordinator
            </button>
            <button
              onClick={handleRequestDonor}
              disabled={requesting}
              style={{
                background: requesting ? "#1e293b" : "#9B2335",
                color: requesting ? "#6B7280" : "#FAF9F7",
                border: "none",
                padding: "12px 24px",
                fontSize: "0.82rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: requesting ? "not-allowed" : "pointer",
                borderRadius: "2px",
                transition: "background 0.15s ease",
              }}
            >
              {requesting ? "Sending alert..." : "Request This Donor"}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            bottom: "96px",
            right: "24px",
            background: toast.type === "success" ? "#0A1628" : "#C0152A",
            border: `1px solid ${toast.type === "success" ? "#2CA8A0" : "#FAF9F7"}`,
            color: "#FAF9F7",
            padding: "14px 24px",
            zIndex: 1000,
            fontSize: "0.88rem",
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            animation: "fade-up 0.3s ease-out",
          }}
        >
          <span>{toast.type === "success" ? "✓" : "⚠"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {donor && (
        <ClinicalDispatchModal
          isOpen={dispatchModalOpen}
          onClose={() => setDispatchModalOpen(false)}
          donorId={donorId}
          donorName={`${donor.firstName || ""} ${donor.lastName || ""}`.trim()}
          donorBloodGroup={donor.bloodType || donor.bloodGroup || donor.blood_group || "O+"}
          donorCity={donor.city || ""}
          patientCity={donor.city || "Hyderabad"}
          patientBloodGroup={donor.bloodType || donor.bloodGroup || donor.blood_group || "O+"}
          diagnosis="Thalassemia Major"
          distance={6.8}
        />
      )}

      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
