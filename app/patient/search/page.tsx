"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClinicalDispatchModal from "@/components/raksha/clinical-dispatch-modal";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ANTIBODIES = ["Kell", "Anti-D", "Anti-E", "Anti-C", "Duffy", "Kidd", "MNS", "Lewis"];

const RISK_COLOR: Record<string, string> = {
  Low: "#2CA8A0",
  Moderate: "#D4A847",
  High: "#C0152A",
};

const RISK_BG: Record<string, string> = {
  Low: "rgba(44,168,160,0.10)",
  Moderate: "rgba(212,168,71,0.10)",
  High: "rgba(192,21,42,0.10)",
};

interface Toast {
  show: boolean;
  message: string;
  type: "success" | "error";
}

export default function PatientSearchPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    blood_group: "",
    rh_factor: "",
    city: "",
    latitude: 0,
    longitude: 0,
    transfusion_count: 0,
    last_transfusion_date: "",
    diagnosis: "Thalassemia",
    antibody_history: [] as string[],
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast>({ show: false, message: "", type: "success" });
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedDonorForDispatch, setSelectedDonorForDispatch] = useState<any>(null);

  // Animate scanCount during loading state
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setScanCount((prev) => {
          if (prev >= 7033) {
            return 7033;
          }
          const step = Math.floor(Math.random() * 380) + 180;
          return Math.min(prev + step, 7033);
        });
      }, 70);
    } else {
      setScanCount(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const toggle = (ab: string) =>
    setForm((f) => ({
      ...f,
      antibody_history: f.antibody_history.includes(ab)
        ? f.antibody_history.filter((x) => x !== ab)
        : [...f.antibody_history, ab],
    }));

  const handleSearch = async () => {
    if (!form.blood_group) {
      setError("Please select a blood group");
      return;
    }
    if (!form.city.trim()) {
      setError("Please enter patient city");
      return;
    }
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server error — check Vercel logs");
      }
      if (!data.success) throw new Error(data.error || "Match failed");
      setResults(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDonor = (donorId: string, donorName: string) => {
    const donorObj = results?.top_matches?.find((x: any) => x.donor_id === donorId);
    setSelectedDonorForDispatch({
      donorId,
      donorName,
      donorBloodGroup: donorObj?.blood_group || form.blood_group || "O+",
      donorCity: donorObj?.city || form.city,
      distance: donorObj?.distance_km || 6.8,
    });
    setDispatchModalOpen(true);
  };

  const label = (txt: string) => (
    <div
      style={{
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#9CA3AF",
        marginBottom: 8,
      }}
    >
      {txt}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0A1628",
    border: "1px solid #1e293b",
    color: "#FAF9F7",
    padding: "12px 14px",
    borderRadius: "4px",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s ease",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060C16",
        color: "#FAF9F7",
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: "80px",
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
              transition: "all 0.15s ease",
            }}
          >
            Coordinator Console
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Page title */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9B2335", fontWeight: 600, marginBottom: 8 }}>
            Clinical Matching Portal
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 700, margin: "0 0 10px", lineHeight: 1.1 }}>
            Find a Compatible Donor
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: "600px" }}>
            Query the active donor registry using extended phenotypical profiles and geographic location. The XGBoost model calculates live donation likelihood based on historical activity.
          </p>
        </div>

        {/* Search form */}
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "4px", padding: "28px", marginBottom: "32px" }}>
          {/* Blood group selection */}
          <div style={{ marginBottom: "24px" }}>
            {label("Patient Blood Group (Required)")}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {BLOOD_GROUPS.map((g) => {
                const isSelected = form.blood_group === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, blood_group: g }))}
                    style={{
                      padding: "10px 18px",
                      background: isSelected ? "#9B2335" : "#0A1628",
                      border: `1px solid ${isSelected ? "#C0152A" : "#1e293b"}`,
                      color: isSelected ? "#FAF9F7" : "#9CA3AF",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      borderRadius: "4px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div>
              {label("Patient City (Required)")}
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Hyderabad"
                style={inputStyle}
              />
            </div>
            <div>
              {label("Diagnosis")}
              <select
                value={form.diagnosis}
                onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option>Thalassemia</option>
                <option>Sickle Cell Anemia</option>
                <option>Aplastic Anemia</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div>
              {label("Prior Transfusions")}
              <input
                type="number"
                min={0}
                value={form.transfusion_count}
                onChange={(e) => setForm((f) => ({ ...f, transfusion_count: parseInt(e.target.value) || 0 }))}
                style={inputStyle}
              />
            </div>
            <div>
              {label("Last Transfusion Date")}
              <input
                type="date"
                value={form.last_transfusion_date}
                onChange={(e) => setForm((f) => ({ ...f, last_transfusion_date: e.target.value }))}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "28px" }}>
            {label("Known Alloantibodies")}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
              {ANTIBODIES.map((ab) => {
                const isSelected = form.antibody_history.includes(ab);
                return (
                  <button
                    key={ab}
                    type="button"
                    onClick={() => toggle(ab)}
                    style={{
                      padding: "8px 14px",
                      background: isSelected ? "rgba(192, 21, 42, 0.15)" : "#0A1628",
                      border: `1px solid ${isSelected ? "#C0152A" : "#1e293b"}`,
                      color: isSelected ? "#FAF9F7" : "#9CA3AF",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      borderRadius: "4px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {ab}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: "0.72rem", color: "#6B7280", margin: 0 }}>
              These are checked against each donor's extended antigen profile to calculate alloimmunization risk.
            </p>
          </div>

          {error && (
            <div
              style={{
                color: "#C0152A",
                fontSize: "0.82rem",
                marginBottom: "16px",
                padding: "10px 14px",
                background: "rgba(192,21,42,0.08)",
                border: "1px solid rgba(192,21,42,0.3)",
                borderRadius: "4px",
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#1e293b" : "#9B2335",
              color: loading ? "#6B7280" : "#FAF9F7",
              border: "none",
              padding: "16px",
              fontSize: "0.9rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              borderRadius: "4px",
              transition: "background 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid #6B7280",
                    borderTopColor: "#FAF9F7",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Scanning {scanCount} donors · Running XGBoost model…
              </>
            ) : (
              "Run Donor Match →"
            )}
          </button>
        </div>

        {/* Results section */}
        {results && (
          <div>
            {/* Summary bar */}
            <div
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: "4px",
                padding: "16px 24px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.35rem", fontWeight: 700 }}>
                  {results.total_matched} compatible donors found
                </span>
                <span style={{ color: "#6B7280", fontSize: "0.82rem", marginLeft: "12px" }}>
                  from {results.total_scanned} scanned in database
                </span>
              </div>
              <div style={{ display: "flex", gap: "24px" }}>
                {[
                  { label: "ABO Excluded", val: results.excluded_abo },
                  { label: "Conditions Excluded", val: results.excluded_conditions },
                  { label: "Inactive Excluded", val: results.excluded_inactive },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.15rem", color: "#C0152A", fontWeight: 600 }}>
                      {s.val}
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", color: "#6B7280" }}>
                {results.evaluated_at}
              </div>
            </div>

            {/* Donor cards list */}
            {results.top_matches.map((m: any, idx: number) => {
              const scoreColor = m.composite_score >= 80 ? "#2CA8A0" : m.composite_score >= 60 ? "#D4A847" : "#C0152A";
              return (
                <div
                  key={m.donor_id}
                  style={{
                    background: "#111827",
                    border: `1px solid ${idx === 0 ? "#2CA8A0" : "#1e293b"}`,
                    borderRadius: "4px",
                    marginBottom: "20px",
                    overflow: "hidden",
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      padding: "20px 24px",
                      borderBottom: "1px solid #1e293b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: "#0A1628",
                          border: `2px solid ${idx === 0 ? "#2CA8A0" : "#C0152A"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          color: "#FAF9F7",
                          flexShrink: 0,
                        }}
                      >
                        {(m.donor_name || "D").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          {idx === 0 && (
                            <span
                              style={{
                                background: "#2CA8A0",
                                color: "#FAF9F7",
                                fontSize: "0.58rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                letterSpacing: "0.1em",
                                borderRadius: "2px",
                              }}
                            >
                              BEST MATCH
                            </span>
                          )}
                          <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                            {m.donor_name}
                          </span>
                          <span
                            style={{
                              background: "#C0152A",
                              color: "#FAF9F7",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "0.7rem",
                              padding: "2px 8px",
                              fontWeight: 600,
                              borderRadius: "2px",
                            }}
                          >
                            {m.blood_group}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>
                          {m.city} · {m.distance_km} km away · Model Status:{" "}
                          <span style={{ color: m.activity_label === "Active" ? "#2CA8A0" : "#C0152A", fontWeight: 600 }}>
                            {m.activity_label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: score + risk */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.3rem", fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                        {m.composite_score}%
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "#6B7280", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        composite match score
                      </div>
                      <div
                        style={{
                          marginTop: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: RISK_BG[m.alloimmunization_risk] || "rgba(255,255,255,0.05)",
                          border: `1px solid ${RISK_COLOR[m.alloimmunization_risk] || "#6B7280"}`,
                          borderRadius: "2px",
                          padding: "3px 10px",
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: RISK_COLOR[m.alloimmunization_risk] || "#6B7280",
                            display: "inline-block",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            color: RISK_COLOR[m.alloimmunization_risk] || "#6B7280",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          Alloimmunization risk: {m.alloimmunization_risk}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div style={{ padding: "16px 24px", borderBottom: "1px solid #1e293b", background: "rgba(10,22,40,0.4)" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B7280", marginBottom: 12 }}>
                      Score breakdown · all values computed from live data
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
                      {Object.entries(m.breakdown).map(([key, val]: any) => {
                        const valColor = val.score >= 70 ? "#2CA8A0" : val.score >= 40 ? "#D4A847" : "#C0152A";
                        return (
                          <div key={key} style={{ background: "#0A1628", border: "1px solid #1e293b", borderRadius: "2px", padding: "12px 14px" }}>
                            <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginBottom: "4px", textTransform: "capitalize" }}>
                              {key.replace("XGBoost", "XGBoost").replace("Antigen", "Antigen").replace("Donation", "Donation")}
                              <span style={{ color: "#6B7280", marginLeft: "4px" }}>({val.weight})</span>
                            </div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.15rem", fontWeight: 700, color: valColor, marginBottom: "6px" }}>
                              {val.score}%
                            </div>
                            <div style={{ height: "4px", background: "#1e293b", overflow: "hidden", marginBottom: "6px" }}>
                              <div
                                style={{
                                  height: "100%",
                                  background: valColor,
                                  width: `${val.score}%`,
                                  transition: "width 1s ease",
                                }}
                              />
                            </div>
                            <div style={{ fontSize: "0.65rem", color: "#6B7280", lineHeight: 1.4 }}>
                              {val.detail}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ padding: "14px 24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleRequestDonor(m.donor_id, m.donor_name)}
                      disabled={requestingId !== null}
                      style={{
                        background: "#9B2335",
                        color: "#FAF9F7",
                        border: "none",
                        padding: "10px 22px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        cursor: requestingId !== null ? "not-allowed" : "pointer",
                        borderRadius: "2px",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {requestingId === m.donor_id ? "Sending Alert..." : "Request This Donor →"}
                    </button>
                    <button
                      onClick={() => router.push(`/donor/profile/${m.donor_id}`)}
                      style={{
                        background: "transparent",
                        color: "#9CA3AF",
                        border: "1px solid #2d3748",
                        padding: "10px 20px",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        borderRadius: "2px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#FAF9F7";
                        (e.currentTarget as HTMLButtonElement).style.color = "#FAF9F7";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#2d3748";
                        (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
                      }}
                    >
                      View Full Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
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

      {/* Premium Clinical Dispatch Modal */}
      {selectedDonorForDispatch && (
        <ClinicalDispatchModal
          isOpen={dispatchModalOpen}
          onClose={() => {
            setDispatchModalOpen(false);
            setSelectedDonorForDispatch(null);
          }}
          donorId={selectedDonorForDispatch.donorId}
          donorName={selectedDonorForDispatch.donorName}
          donorBloodGroup={selectedDonorForDispatch.donorBloodGroup}
          donorCity={selectedDonorForDispatch.donorCity}
          patientCity={form.city}
          patientBloodGroup={form.blood_group}
          diagnosis={form.diagnosis}
          distance={selectedDonorForDispatch.distance}
          backupDonorId={results?.top_matches?.[1]?.donor_id}
          backupDonorName={results?.top_matches?.[1]?.donor_name}
          backupDonorBloodGroup={results?.top_matches?.[1]?.blood_group}
          backupDonorCity={results?.top_matches?.[1]?.city}
          backupDistance={results?.top_matches?.[1]?.distance_km}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #0A1628; }
        input { font-family: 'DM Sans', sans-serif; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.85); }
      `}</style>
    </div>
  );
}
