"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage, Language } from "@/context/LanguageContext";
import { getPrediction } from "@/utils/predictDonor";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Panel = "home" | "impact" | "circle" | "badges" | "community";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const DONOR = { name: "Ramesh R.", bloodGroup: "O+", city: "Mumbai", totalDonations: 7, missedAppointments: 0, streakMonths: 8 };
const NEXT_APT = { id: "apt-001", date: "2025-12-18T10:30:00", hospital: "KEM Hospital Blood Bank, Mumbai", patientName: "Arjun" };

const ACTIVITY = [
  { id: "1", timestamp: "Feb 18, 2025 · 11:42 AM", icon: "🩸", text: "Your donation raised Arjun's hemoglobin from 6.8 → 10.4 g/dL", accent: "#C0152A" },
  { id: "2", timestamp: "Feb 19, 2025 · 9:00 AM",  icon: "🎒", text: "Arjun attended school on Feb 19 & 20 — first time in 3 weeks", accent: "#2CA8A0" },
  { id: "3", timestamp: "Feb 18, 2025 · 3:10 PM",  icon: "🏅", text: "You've been a Raksha Guardian for 8 months. Milestone badge earned!", accent: "#D4A847" },
  { id: "4", timestamp: "Jan 24, 2025 · 10:55 AM", icon: "🩸", text: "Donation #6 completed. Hemoglobin raised from 7.2 → 10.8 g/dL", accent: "#C0152A" },
  { id: "5", timestamp: "Jan 10, 2025 · 2:30 PM",  icon: "🔔", text: "Reminder sent: 7 days before Arjun's transfusion window", accent: "#6B7280" },
];

const HISTORY = [
  { date: "Feb 18, 2025", hbB: 6.8, hbA: 10.4, units: 2 },
  { date: "Nov 22, 2024", hbB: 7.1, hbA: 10.2, units: 2 },
  { date: "Sep 01, 2024", hbB: 6.5, hbA: 9.9,  units: 2 },
  { date: "Jun 10, 2024", hbB: 7.0, hbA: 10.5, units: 2 },
  { date: "Mar 18, 2024", hbB: 6.9, hbA: 10.1, units: 2 },
  { date: "Dec 05, 2023", hbB: 7.3, hbA: 10.6, units: 2 },
  { date: "Aug 20, 2023", hbB: 6.6, hbA: 9.8,  units: 2 },
];

const BADGES = [
  { id: "b1", icon: "🩸", name: "First Drop",         desc: "First donation confirmed",            earned: true,  prog: 1,  max: 1,  hint: "" },
  { id: "b2", icon: "🛡️", name: "Raksha Guardian",    desc: "Assigned to a patient's care circle", earned: true,  prog: 1,  max: 1,  hint: "" },
  { id: "b3", icon: "🎯", name: "Zero Cancellations", desc: "7 confirmed, 0 missed",               earned: true,  prog: 7,  max: 7,  hint: "" },
  { id: "b4", icon: "⚔️", name: "Raksha Warrior",     desc: "10+ donations across career",         earned: false, prog: 7,  max: 10, hint: "3 more donations" },
  { id: "b5", icon: "🌟", name: "1-Year Streak",      desc: "Active for 12+ months",               earned: false, prog: 8,  max: 12, hint: "4 more months" },
  { id: "b6", icon: "❤️", name: "Life Changer",       desc: "Raised total 50+ g/dL hemoglobin",    earned: false, prog: 24, max: 50, hint: "26 more g/dL to go" },
];

const DRIVES = [
  { id: "d1", title: "World Thalassemia Day Blood Drive", date: "May 8, 2025",  location: "KEM Hospital, Mumbai",     spots: 12, registered: false },
  { id: "d2", title: "Raksha Community Drive — Pune",     date: "Apr 15, 2025", location: "Sassoon Hospital, Pune",   spots: 8,  registered: true  },
  { id: "d3", title: "Corporate Donor Meet — Mumbai",     date: "Mar 28, 2025", location: "Blood Warriors HQ",        spots: 20, registered: false },
];

const POSTS = [
  { id: "p1", author: "Priya S.",     time: "2 hrs ago",   text: "Just completed my 6th donation at KEM. The staff here are amazing 🙏" },
  { id: "p2", author: "Vikram M.",    time: "1 day ago",   text: "Reminder: World Thalassemia Day drive on May 8 — register early, spots fill fast." },
  { id: "p3", author: "Coordinator", time: "3 days ago",  text: "Welcome to our 50th Mumbai donor this month — Ravi K.! 🎉" },
];

const NAV: { id: Panel; icon: string; label: string }[] = [
  { id: "home",      icon: "🏠", label: "My Dashboard" },
  { id: "impact",    icon: "🩸", label: "My Impact" },
  { id: "circle",    icon: "👥", label: "My Patient Circle" },
  { id: "badges",    icon: "🏅", label: "Badges & Milestones" },
  { id: "community", icon: "💬", label: "Community" },
];

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useCountdown(target: string) {
  const [d, setD] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  useEffect(() => {
    const tick = () => {
      const ms = new Date(target).getTime() - Date.now();
      if (ms <= 0) return;
      const s = Math.floor(ms / 1000);
      setD({ days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), mins: Math.floor((s % 3600) / 60), secs: s % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return d;
}

// ─── SHIELD SVG ───────────────────────────────────────────────────────────────
function Shield({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 56" fill="none" width={size} height={Math.round(size * 1.17)}>
      <path d="M24 2L44 11V30C44 43 24 54 24 54S4 43 4 30V11Z" fill="#8B1A2A" />
      <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
      <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const F = { display: "'DM Sans',sans-serif", serif: "'Cormorant Garamond',serif", mono: "'JetBrains Mono',monospace" };
const card = (border = "#1e293b"): React.CSSProperties => ({ background: "#111827", border: `1px solid ${border}`, borderRadius: 12, padding: "24px" });
const label: React.CSSProperties = { fontFamily: F.display, fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.18em", color: "#9B2335", textTransform: "uppercase" as const, marginBottom: 12, display: "block" };
const btn = (bg = "#C0152A", fg = "#FAF9F7"): React.CSSProperties => ({ background: bg, color: fg, border: "none", fontFamily: F.display, fontWeight: 600, fontSize: "0.85rem", padding: "11px 22px", cursor: "pointer", letterSpacing: "0.03em", transition: "background 0.2s" });

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ donor, active, go }: { donor: typeof DONOR; active: Panel; go: (p: Panel) => void }) {
  const { lang: language, setLang: setLanguage } = useLanguage();
  const translating = false;
  const initial = donor.name ? donor.name.charAt(0).toUpperCase() : "D";
  return (
    <aside style={{ width: 240, minHeight: "100vh", background: "#0A1628", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: "auto" }}>
      {/* Logo + profile */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #1e293b" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, textDecoration: "none" }}>
          <Shield size={34} />
          <div>
            <div style={{ display: "flex", gap: 3, alignItems: "baseline" }}>
              <span style={{ fontFamily: F.serif, fontWeight: 700, fontSize: "1.15rem", color: "#FAF9F7" }}>Raksha</span>
              <span style={{ fontFamily: F.serif, fontWeight: 700, fontSize: "1.15rem", color: "#2CA8A0" }}>AI</span>
            </div>
            <div style={{ fontFamily: F.display, fontSize: "0.58rem", color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase" }}>Donor Portal</div>
          </div>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#8B1A2A,#0A1628)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FAF9F7", fontFamily: F.serif, fontWeight: 700, fontSize: "0.9rem", border: "2px solid #C0152A", flexShrink: 0 }}>{initial}</div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: "0.875rem", color: "#FAF9F7" }}>{donor.name}</div>
            <span style={{ background: "#C0152A", color: "#FAF9F7", fontFamily: F.mono, fontSize: "0.62rem", fontWeight: 600, padding: "2px 8px", letterSpacing: "0.06em" }}>{donor.bloodGroup}</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 12 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => go(n.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: active === n.id ? "rgba(192,21,42,0.08)" : "none", border: "none", borderLeft: `2px solid ${active === n.id ? "#C0152A" : "transparent"}`, cursor: "pointer", textAlign: "left", transition: "all 0.18s" }}>
            <span style={{ fontSize: 15 }}>{n.icon}</span>
            <span style={{ fontFamily: F.display, fontWeight: 500, fontSize: "0.875rem", color: active === n.id ? "#FAF9F7" : "#9CA3AF" }}>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Emergency pill */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ background: "#2CA8A0", padding: "8px 12px", borderRadius: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FAF9F7", display: "inline-block", animation: "blink 1.5s infinite" }} />
          <span style={{ fontFamily: F.display, fontSize: "0.65rem", fontWeight: 600, color: "#FAF9F7", letterSpacing: "0.06em" }}>EMERGENCY BROADCAST: ACTIVE</span>
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: "14px 20px", borderTop: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 10 }}>
        <a href="/" style={{ textDecoration: "none", fontFamily: F.display, fontSize: "0.8rem", color: "#2CA8A0", fontWeight: 600 }}>← Go to Homepage</a>
        <button onClick={() => {
          localStorage.removeItem("raksha_user");
          window.location.href = "/signin";
        }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F.display, fontSize: "0.8rem", color: "#6B7280", padding: 0, textAlign: "left" }}>← Log Out</button>
        <div style={{ fontFamily: F.display, fontSize: "0.62rem", color: "#374151" }}>Demo · v1.0</div>

        <div style={{ borderTop: "1px solid #1e293b", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#6B7280" }}>
            <span>🌐</span>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, fontFamily: F.display }}>Language</span>
            {translating && <span className="w-1.5 h-1.5 rounded-full bg-raksha-teal animate-pulse" style={{ backgroundColor: '#2CA8A0', display: 'inline-block' }} />}
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            style={{
              width: "100%",
              background: "#0D1B30",
              color: "#FAF9F7",
              border: "1px solid rgba(139, 26, 42, 0.4)",
              padding: "8px 12px",
              fontSize: "0.8rem",
              fontFamily: F.display,
              outline: "none",
              cursor: "pointer",
              borderRadius: "4px"
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
          </select>
        </div>
      </div>
    </aside>
  );
}

// ─── MOBILE TABS ──────────────────────────────────────────────────────────────
function Tabs({ active, go }: { active: Panel; go: (p: Panel) => void }) {
  return (
    <div style={{ display: "flex", position: "fixed", bottom: 0, left: 0, right: 0, background: "#0A1628", borderTop: "1px solid #1e293b", zIndex: 50, padding: "6px 0 8px" }}>
      {NAV.map(n => (
        <button key={n.id} onClick={() => go(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
          <span style={{ fontSize: 17 }}>{n.icon}</span>
          <span style={{ fontFamily: F.display, fontSize: "0.55rem", color: active === n.id ? "#C0152A" : "#6B7280", fontWeight: active === n.id ? 600 : 400 }}>{n.label.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}

// ─── PANEL HEADER ─────────────────────────────────────────────────────────────
function PHeader({ sub, title }: { sub: string; title: string }) {
  return (
    <div style={{ padding: "28px 36px 20px", borderBottom: "1px solid #1e293b", marginBottom: 28 }}>
      <span style={label}>{sub}</span>
      <h1 style={{ fontFamily: F.serif, fontSize: "1.9rem", fontWeight: 700, color: "#FAF9F7", margin: 0, letterSpacing: "-0.5px" }}>{title}</h1>
    </div>
  );
}

// Add this component above PanelHome
function AIStatusCard({ donorName, donationCount, lastDonated, streakMonths }: {
  donorName: string;
  donationCount: number;
  lastDonated: string;
  streakMonths: number;
}) {
  const [status, setStatus] = useState<{
    prediction: string;
    confidence: number;
    evaluated_at: string;
    factors: {
      recency: { label: string; score: number; detail: string };
      engagement: { label: string; score: number; detail: string };
      loyalty: { label: string; score: number; detail: string };
      cycle: { label: string; score: number; detail: string };
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrediction = () => {
    setLoading(true);
    getPrediction({
      cycle_of_donations: donationCount,
      donations_till_date: donationCount,
      total_calls: 5,
      frequency_in_days: 90,
      registration_date: "2023-01-01",
      last_donation_date: lastDonated || "2024-01-01",
      last_contacted_date: new Date().toISOString().split("T")[0],
    }).then((data) => {
      setStatus(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchPrediction();
  }, [donationCount, lastDonated]);

  const isActive = status?.prediction === "Active";

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: isActive ? "#2CA8A0" : "#C0152A" }}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const RefreshIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "spin" : ""}>
      <path d="M23 4v6h-6"></path>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
  );

  const getRecent7Months = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      result.push(months[m.getMonth()]);
    }
    return result;
  };

  const formatEvaluationTime = (timestampStr: string | undefined) => {
    if (!timestampStr) return `Evaluated today at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    try {
      const parts = timestampStr.split(" ");
      const dateParts = parts[0].split("-");
      const timeParts = parts[1].split(":");
      
      const date = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(timeParts[0]),
        parseInt(timeParts[1]),
        parseInt(timeParts[2])
      );
      
      const timeStr = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toLowerCase();
      const isToday = date.toDateString() === new Date().toDateString();
      return `Evaluated ${isToday ? "today" : date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} at ${timeStr}`;
    } catch {
      return `Evaluated today at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    }
  };

  const activityMonths = getRecent7Months();
  // Dynamic bars styled matching the screenshot:
  const activeBars = isActive 
    ? [0.65, 0.8, 0.6, 0.85, 0.78, 0.9, 0.95] // opacities/height variations
    : [0.65, 0.5, 0.35, 0.2, 0.1, 0.05, 0.0];

  return (
    <div style={{
      background: "#121820",
      border: "1px solid #1e293b",
      borderRadius: 14,
      padding: "28px",
      marginBottom: 20,
      position: "relative",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: loading ? "#6B7280" : isActive ? "#2CA8A0" : "#C0152A" }} />
            <span style={{ fontFamily: F.display, fontSize: "0.65rem", fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.28em" }}>RAKSHA AI — DONOR INTELLIGENCE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontFamily: F.serif, fontSize: "2rem", fontWeight: 700, color: "#FAF9F7", margin: 0 }}>
              {loading ? "Evaluating profile…" : isActive ? "Active donor" : "At Churn Risk"}
            </h2>
            {!loading && status && (
              <span style={{ 
                background: isActive ? "rgba(44,168,160,0.12)" : "rgba(192,21,42,0.12)", 
                color: isActive ? "#2CA8A0" : "#C0152A", 
                fontFamily: F.display, 
                fontSize: "0.68rem", 
                fontWeight: 600, 
                padding: "3px 10px", 
                borderRadius: 20, 
                border: `1px solid ${isActive ? "rgba(44,168,160,0.2)" : "rgba(192,21,42,0.2)"}` 
              }}>
                {isActive ? "Low churn risk" : "High churn risk"}
              </span>
            )}
          </div>
          <div style={{ fontFamily: F.display, fontSize: "0.78rem", color: "#6B7280" }}>
            {formatEvaluationTime(status?.evaluated_at)} · XGBoost model
          </div>
        </div>

        {/* Circular Confidence Meter */}
        {!loading && status && (
          <div style={{
            position: "relative",
            width: 84,
            height: 84,
            borderRadius: "50%",
            background: `conic-gradient(${isActive ? "#2CA8A0" : "#C0152A"} ${status.confidence}%, #1e293b 0)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <div style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              background: "#121820",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontFamily: F.mono, fontSize: "1.2rem", fontWeight: 700, color: "#FAF9F7", lineHeight: 1 }}>
                {status.confidence}%
              </span>
              <span style={{ fontSize: "0.55rem", color: "#6B7280", marginTop: 2, letterSpacing: "0.02em" }}>
                confidence
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Middle Banner */}
      {!loading && status && (
        <div style={{ 
          background: "rgba(0,0,0,0.2)", 
          borderLeft: `4px solid ${isActive ? "#2CA8A0" : "#C0152A"}`, 
          padding: "16px 20px", 
          borderRadius: "0 8px 8px 0", 
          marginBottom: 24, 
          fontFamily: F.display, 
          fontSize: "0.88rem", 
          lineHeight: 1.6, 
          color: "#9CA3AF" 
        }}>
          <strong>{donorName.split(" ")[0]}</strong> shows strong engagement patterns — <strong>{donationCount} completed donations</strong>, 0 cancellations, and an <strong>{streakMonths}-month active streak</strong>. Model predicts <strong>continued active donation</strong> with very high confidence.
        </div>
      )}

      {/* Key Factors Section */}
      {!loading && status && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: F.display, fontSize: "0.68rem", fontWeight: 600, color: "#6B7280", letterSpacing: "0.15em", marginBottom: 12 }}>
            KEY FACTORS DRIVING THIS PREDICTION
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {/* Donation cycle */}
            <div style={{ background: "#0D131A", border: "1px solid #1e293b", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontFamily: F.display, fontSize: "0.72rem", color: "#6B7280", marginBottom: 6 }}>Donation cycle</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ display: "flex", alignItems: "center" }}><CheckIcon /></span>
                <span style={{ fontFamily: F.display, fontSize: "0.92rem", fontWeight: 600, color: "#FAF9F7" }}>
                  {status.factors.cycle.score > 70 ? "Strong" : status.factors.cycle.score > 40 ? "Moderate" : "Weak"}
                </span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "#1e293b", overflow: "hidden" }}>
                <div style={{ height: "100%", background: status.factors.cycle.score > 70 ? "#1D9E75" : status.factors.cycle.score > 40 ? "#D4A847" : "#C0152A", width: `${status.factors.cycle.score}%`, transition: "width 1s ease" }} />
              </div>
            </div>

            {/* Recency */}
            <div style={{ background: "#0D131A", border: "1px solid #1e293b", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontFamily: F.display, fontSize: "0.72rem", color: "#6B7280", marginBottom: 6 }}>Recency</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ display: "flex", alignItems: "center" }}><CheckIcon /></span>
                <span style={{ fontFamily: F.display, fontSize: "0.92rem", fontWeight: 600, color: "#FAF9F7" }}>
                  {status.factors.recency.score > 70 ? "Recent" : status.factors.recency.score > 40 ? "Needs Donation" : "Lapsed"}
                </span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "#1e293b", overflow: "hidden" }}>
                <div style={{ height: "100%", background: status.factors.recency.score > 70 ? "#1D9E75" : status.factors.recency.score > 40 ? "#D4A847" : "#C0152A", width: `${status.factors.recency.score}%`, transition: "width 1s ease" }} />
              </div>
            </div>

            {/* Engagement */}
            <div style={{ background: "#0D131A", border: "1px solid #1e293b", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontFamily: F.display, fontSize: "0.72rem", color: "#6B7280", marginBottom: 6 }}>Engagement</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ display: "flex", alignItems: "center" }}><CheckIcon /></span>
                <span style={{ fontFamily: F.display, fontSize: "0.92rem", fontWeight: 600, color: "#FAF9F7" }}>
                  {status.factors.engagement.score > 70 ? "High" : status.factors.engagement.score > 40 ? "Moderate" : "Low"}
                </span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "#1e293b", overflow: "hidden" }}>
                <div style={{ height: "100%", background: status.factors.engagement.score > 70 ? "#1D9E75" : status.factors.engagement.score > 40 ? "#D4A847" : "#C0152A", width: `${status.factors.engagement.score}%`, transition: "width 1s ease" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Score — Last 7 Months */}
      {!loading && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: F.display, fontSize: "0.68rem", fontWeight: 600, color: "#6B7280", letterSpacing: "0.15em", marginBottom: 16 }}>
            ACTIVITY SCORE — LAST 7 MONTHS
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            {activityMonths.map((m, i) => (
              <div key={m} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ 
                  height: 36, 
                  background: isActive ? "#2CA8A0" : "#C0152A", 
                  opacity: activeBars[i], 
                  borderRadius: 4, 
                  marginBottom: 8,
                  transition: "opacity 0.5s ease"
                }} />
                <span style={{ fontFamily: F.display, fontSize: "0.7rem", color: "#6B7280" }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: "#1e293b", marginBottom: 20 }} />

      {/* Footer metadata & Re-evaluate button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, border: "1px solid #6B7280", borderRadius: 1, display: "inline-block" }} />
            <span style={{ fontFamily: F.display, fontSize: "0.75rem", color: "#6B7280" }}>Model: <strong style={{ color: "#9CA3AF" }}>XGBoost</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, border: "1px solid #6B7280", borderRadius: 1, display: "inline-block" }} />
            <span style={{ fontFamily: F.display, fontSize: "0.75rem", color: "#6B7280" }}>Trained on: <strong style={{ color: "#9CA3AF" }}>7,033 donors</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, border: "1px solid #6B7280", borderRadius: 1, display: "inline-block" }} />
            <span style={{ fontFamily: F.display, fontSize: "0.75rem", color: "#6B7280" }}>Last synced: <strong style={{ color: "#9CA3AF" }}>Real-time</strong></span>
          </div>
        </div>
        <button onClick={fetchPrediction} disabled={loading} style={{ background: "transparent", color: "#2CA8A0", border: "1px solid #2CA8A0", fontFamily: F.display, fontSize: "0.82rem", padding: "8px 16px", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Syncing..." : "Re-evaluate Model"}
        </button>
      </div>
    </div>
  );
}
      // ─── PANEL 1 — HOME ───────────────────────────────────────────────────────────
function PanelHome({ 
  donor, 
  appointment, 
  onConfirmAppointment, 
  notifications 
}: { 
  donor: any; 
  appointment: any; 
  onConfirmAppointment: () => void; 
  notifications: any[]; 
}) {
  const targetDate = appointment ? appointment.scheduledAt : "2026-06-15T10:30:00";
  const cd = useCountdown(targetDate);

  return (
    <div style={{ padding: "0 36px" }}>
      {/* Welcome card */}
      <div style={{ background: "linear-gradient(135deg,#0A1628,#0F1E35)", border: "1px solid #8B1A2A", borderRadius: 14, padding: "36px 32px", marginBottom: 20 }}>
        <span style={label}>GOOD MORNING</span>
        <h2 style={{ fontFamily: F.serif, fontSize: "2rem", fontWeight: 700, color: "#FAF9F7", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
          Welcome back, <span style={{ fontStyle: "italic", color: "#F5ECD7" }}>{donor.name ? donor.name.split(" ")[0] : "Donor"}.</span>
        </h2>
        <p style={{ fontFamily: F.display, fontSize: "0.9rem", color: "#9CA3AF", margin: 0 }}>
          {appointment 
            ? `Next donation in ${cd.days}d ${cd.hours}h. Patient is counting on you.` 
            : "No upcoming transfusion appointment scheduled."}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Donations", value: String(donor.totalDonations), color: "#C0152A" },
          { label: "Patient in Circle", value: appointment?.patientName || "None", color: "#FAF9F7" },
          { label: "Missed Appointments", value: String(donor.missedAppointments || 0), color: "#2CA8A0" },
        ].map((s, i) => (
          <div key={i} style={card()}>
            <div style={{ fontFamily: F.display, fontSize: "0.68rem", color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontFamily: F.mono, fontSize: "1.75rem", fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <AIStatusCard
        donorName={donor.name}
        donationCount={donor.totalDonations}
        lastDonated={donor.lastDonated || "2025-02-18"}
        streakMonths={donor.streakMonths}
      />

      {/* Appointment */}
      {appointment && (
        <div style={{ ...card("#8B1A2A"), marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div>
              <span style={label}>NEXT DONATION</span>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: "1rem", color: "#FAF9F7", marginBottom: 4 }}>
                {new Date(appointment.scheduledAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {new Date(appointment.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div style={{ fontFamily: F.display, fontSize: "0.85rem", color: "#6B7280" }}>
                {appointment.hospitalName} · Patient: <span style={{ color: "#E8897A" }}>{appointment.patientName}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ v: cd.days, l: "days" }, { v: cd.hours, l: "hrs" }, { v: cd.mins, l: "min" }, { v: cd.secs, l: "sec" }].map(u => (
                <div key={u.l} style={{ background: "#0A1628", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 12px", textAlign: "center", minWidth: 50 }}>
                  <div style={{ fontFamily: F.mono, fontSize: "1.2rem", color: "#D4A847", lineHeight: 1 }}>{String(u.v).padStart(2, "0")}</div>
                  <div style={{ fontFamily: F.display, fontSize: "0.6rem", color: "#6B7280", marginTop: 3 }}>{u.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {appointment.donorConfirmed
              ? <div style={{ ...btn("#2CA8A0"), cursor: "default" }}>✓ Confirmed — See You There!</div>
              : <button onClick={onConfirmAppointment} style={btn("#2CA8A0")}>Confirm I'll Be There ✓</button>
            }
            <button style={{ background: "transparent", color: "#9CA3AF", border: "1px solid #374151", fontFamily: F.display, fontSize: "0.85rem", padding: "11px 20px", cursor: "pointer" }}>Need to Reschedule</button>
          </div>
        </div>
      )}

      {/* Activity */}
      <div style={card()}>
        <span style={label}>RECENT ACTIVITY</span>
        {notifications.length > 0 ? (
          notifications.map((n, i) => (
            <div key={n.notificationId || i} style={{ display: "flex", gap: 14, padding: "13px 0 13px 14px", borderLeft: `2px solid ${n.type === "milestone" ? "#D4A847" : n.type === "reminder" ? "#6B7280" : "#C0152A"}`, borderBottom: i < notifications.length - 1 ? "1px solid #1e293b" : "none" }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>
                {n.type === "milestone" ? "🏅" : n.type === "reminder" ? "🔔" : "🩸"}
              </span>
              <div>
                <div style={{ fontFamily: F.display, fontSize: "0.875rem", color: "#FAF9F7", lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ fontFamily: F.mono, fontSize: "0.68rem", color: "#6B7280", marginTop: 3 }}>
                  {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {new Date(n.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontFamily: F.display, fontSize: "0.875rem", color: "#6B7280", textAlign: "center", padding: "20px 0" }}>No recent activity.</div>
        )}
      </div>
    </div>
  );
}

// ─── PANEL 2 — IMPACT ─────────────────────────────────────────────────────────
function PanelImpact({ donor, transfusions }: { donor: any; transfusions: any[] }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const totalHb = transfusions.reduce((sum, t) => sum + ((t.hemoglobinAfter || 10.4) - (t.hemoglobinBefore || 6.8)), 0);
  const school = Math.round(totalHb * 1.7);

  return (
    <div style={{ padding: "0 36px" }}>
      <div style={{ background: "linear-gradient(135deg,#0A1628,#0F1E35)", border: "1px solid #2CA8A0", borderRadius: 14, padding: "32px", marginBottom: 20 }}>
        <span style={label}>YOUR IMPACT</span>
        <h2 style={{ fontFamily: F.serif, fontSize: "1.8rem", fontWeight: 700, color: "#FAF9F7", margin: "0 0 6px" }}>Your blood has <span style={{ fontStyle: "italic" }}>traveled far.</span></h2>
        <p style={{ fontFamily: F.display, fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>Every number below is a real, documented medical outcome.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { val: `${totalHb.toFixed(1)} g/dL`, sub: "Total hemoglobin raised across donations" },
          { val: `~${school}`, sub: "Estimated school days patients could attend" },
          { val: `${donor.streakMonths}mo`, sub: "Consecutive months active — zero cancellations" },
        ].map((s, i) => (
          <div key={i} style={card()}>
            <div style={{ fontFamily: F.mono, fontSize: "1.75rem", color: "#2CA8A0", lineHeight: 1, marginBottom: 8 }}>{s.val}</div>
            <div style={{ fontFamily: F.display, fontSize: "0.78rem", color: "#6B7280", lineHeight: 1.5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card(), marginBottom: 20 }}>
        <span style={label}>DONATION HISTORY</span>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Date", "Hb Before", "Hb After", "Units"].map(h => <th key={h} style={{ fontFamily: F.display, fontSize: "0.65rem", fontWeight: 600, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 14px 12px 0", textAlign: "left", borderBottom: "1px solid #1e293b" }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {transfusions.map((d, i) => (
                <tr key={d.transfusionId || i} style={{ borderBottom: i < transfusions.length - 1 ? "1px solid #1e293b" : "none" }}>
                  <td style={{ padding: "11px 14px 11px 0", fontFamily: F.display, fontSize: "0.85rem", color: "#FAF9F7" }}>
                    {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={{ padding: "11px 14px 11px 0", fontFamily: F.mono, fontSize: "0.82rem", color: "#C0152A" }}>{d.hemoglobinBefore}</td>
                  <td style={{ padding: "11px 14px 11px 0", fontFamily: F.mono, fontSize: "0.82rem", color: "#2CA8A0" }}>{d.hemoglobinAfter}</td>
                  <td style={{ padding: "11px 0", fontFamily: F.mono, fontSize: "0.82rem", color: "#9CA3AF" }}>{d.units}u</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); setDone(true); }, 900); }} disabled={loading || done}
        style={{ background: "transparent", border: `1px solid ${done ? "#2CA8A0" : "#C0152A"}`, color: done ? "#2CA8A0" : "#C0152A", fontFamily: F.display, fontWeight: 600, fontSize: "0.9rem", padding: "12px 26px", cursor: done ? "default" : "pointer", letterSpacing: "0.04em" }}>
        {loading ? "Generating…" : done ? "✓ Impact Letter Sent to Your Email" : "Generate My Impact Letter →"}
      </button>
    </div>
  );
}

// ─── PANEL 3 — CIRCLE ─────────────────────────────────────────────────────────
function PanelCircle({ patient }: { patient: any }) {
  return (
    <div style={{ padding: "0 36px" }}>
      <div style={{ background: "linear-gradient(135deg,#0A1628,#0F1E35)", border: "1px solid #C0152A", borderRadius: 14, padding: "32px", marginBottom: 20 }}>
        <span style={label}>MY PATIENT CIRCLE</span>
        <h2 style={{ fontFamily: F.serif, fontSize: "1.8rem", fontWeight: 700, color: "#FAF9F7", margin: "0 0 6px" }}>The people your blood <span style={{ fontStyle: "italic" }}>protects.</span></h2>
        <p style={{ fontFamily: F.display, fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>
          {patient ? "Primary donor for 1 patient." : "Not currently assigned to a patient's care circle."}
        </p>
      </div>

      {patient ? (
        <div style={{ ...card("#C0152A"), marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
            <div>
              <span style={{ ...label, color: "#C0152A" }}>PRIMARY PATIENT</span>
              <div style={{ fontFamily: F.serif, fontSize: "1.4rem", fontWeight: 700, color: "#FAF9F7" }}>
                {patient.firstName} {patient.lastName || ""} · Age {parseInt(patient.dob ? String(new Date().getFullYear() - new Date(patient.dob).getFullYear()) : "9")}
              </div>
              <div style={{ fontFamily: F.display, fontSize: "0.83rem", color: "#6B7280", marginTop: 3 }}>
                {patient.bloodGroup} · {patient.hospital}
              </div>
            </div>
            <div style={{ background: "#2CA8A0", color: "#FAF9F7", fontFamily: F.display, fontWeight: 600, fontSize: "0.78rem", padding: "6px 14px" }}>Confirmed ✓</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
            {[{ l: "Compatibility", v: "94%", c: "#2CA8A0" }, { l: "Your Donations", v: "3+", c: "#C0152A" }, { l: "Next Window", v: "Approaching", c: "#D4A847" }].map((s, i) => (
              <div key={i} style={{ background: "#0A1628", borderRadius: 8, padding: 14 }}>
                <div style={{ fontFamily: F.mono, fontSize: "1.25rem", color: s.c, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontFamily: F.display, fontSize: "0.68rem", color: "#6B7280", marginTop: 6 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: F.display, fontSize: "0.82rem", color: "#9CA3AF", margin: "0 0 14px", lineHeight: 1.6 }}>
            Extended Rh match confirmed. Kell negative. Assigned since registration.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btn()}>View Full History</button>
            <button style={{ background: "transparent", color: "#9CA3AF", border: "1px solid #374151", fontFamily: F.display, fontSize: "0.82rem", padding: "10px 18px", cursor: "pointer" }}>Message Coordinator</button>
          </div>
        </div>
      ) : (
        <div style={{ ...card(), textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
          <div style={{ fontFamily: F.serif, fontSize: "1.25rem", color: "#FAF9F7", marginBottom: 6 }}>No Assigned Patient</div>
          <div style={{ fontFamily: F.display, fontSize: "0.875rem", color: "#6B7280" }}>
            You will be assigned to a patient's care circle when a compatibility match request is generated by a coordinator.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PANEL 4 — BADGES ─────────────────────────────────────────────────────────
function PanelBadges({ donor, patient, transfusions }: { donor: any; patient: any; transfusions: any[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  const totalHb = transfusions.reduce((sum, t) => sum + ((t.hemoglobinAfter || 10.4) - (t.hemoglobinBefore || 6.8)), 0);
  const regDate = donor.registrationDate ? new Date(donor.registrationDate) : new Date("2023-01-01");
  const diffTime = Math.abs(new Date().getTime() - regDate.getTime());
  const diffMonths = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4)));

  const dynamicBadges = [
    { id: "b1", icon: "🩸", name: "First Drop",         desc: "First donation confirmed",            earned: donor.totalDonations >= 1,  prog: donor.totalDonations >= 1 ? 1 : 0,  max: 1,  hint: donor.totalDonations >= 1 ? "" : "1 more donation" },
    { id: "b2", icon: "🛡️", name: "Raksha Guardian",    desc: "Assigned to a patient's care circle", earned: patient !== null,  prog: patient !== null ? 1 : 0,  max: 1,  hint: patient !== null ? "" : "Awaiting assignment" },
    { id: "b3", icon: "🎯", name: "Zero Cancellations", desc: "Confirmed donations, 0 missed",       earned: donor.totalDonations >= 1 && donor.missedAppointments === 0,  prog: donor.totalDonations,  max: donor.totalDonations || 1,  hint: "" },
    { id: "b4", icon: "⚔️", name: "Raksha Warrior",     desc: "10+ donations across career",         earned: donor.totalDonations >= 10, prog: donor.totalDonations,  max: 10, hint: donor.totalDonations >= 10 ? "" : `${10 - donor.totalDonations} more donations` },
    { id: "b5", icon: "🌟", name: "1-Year Streak",      desc: "Active for 12+ months",               earned: diffMonths >= 12, prog: diffMonths,  max: 12, hint: diffMonths >= 12 ? "" : `${12 - diffMonths} more months` },
    { id: "b6", icon: "❤️", name: "Life Changer",       desc: "Raised total 50+ g/dL hemoglobin",    earned: totalHb >= 50, prog: Math.round(totalHb), max: 50, hint: totalHb >= 50 ? "" : `${Math.round(50 - totalHb)} more g/dL to go` },
  ];

  const earnedCount = dynamicBadges.filter(b => b.earned).length;

  return (
    <div style={{ padding: "0 36px" }}>
      <div style={{ ...card(), marginBottom: 20 }}>
        <span style={label}>YOUR BADGE COLLECTION</span>
        <p style={{ fontFamily: F.display, fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>
          {earnedCount} earned · {6 - earnedCount} in progress. Keep donating to unlock all six.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {dynamicBadges.map(b => (
          <div key={b.id} style={{ background: "#111827", border: `1px solid ${b.earned ? "#D4A847" : "#1e293b"}`, borderRadius: 12, padding: 22, opacity: b.earned ? 1 : 0.65, transition: "opacity 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 26, filter: b.earned ? "none" : "grayscale(1)" }}>{b.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: "0.88rem", color: b.earned ? "#FAF9F7" : "#6B7280" }}>{b.name}</div>
                <div style={{ fontFamily: F.display, fontSize: "0.72rem", color: "#6B7280", marginTop: 2 }}>{b.desc}</div>
              </div>
              {b.earned && <span style={{ fontFamily: F.display, fontSize: "0.62rem", fontWeight: 600, background: "rgba(212,168,71,0.15)", color: "#D4A847", padding: "3px 8px", letterSpacing: "0.08em", flexShrink: 0 }}>EARNED</span>}
            </div>
            <div style={{ background: "#0A1628", borderRadius: 4, height: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", background: b.earned ? "#D4A847" : "#C0152A", width: animated ? `${Math.min((b.prog / b.max) * 100, 100)}%` : "0%", transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
              <span style={{ fontFamily: F.mono, fontSize: "0.68rem", color: b.earned ? "#D4A847" : "#C0152A" }}>{b.prog} / {b.max}</span>
              {!b.earned && <span style={{ fontFamily: F.display, fontSize: "0.7rem", color: "#6B7280" }}>{b.hint}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PANEL 5 — COMMUNITY ──────────────────────────────────────────────────────
function PanelCommunity({ donor }: { donor: any }) {
  const [drives, setDrives] = useState(DRIVES);
  const [regId, setRegId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const register = (id: string) => {
    setRegId(id);
    setTimeout(() => { setDrives(p => p.map(d => d.id === id ? { ...d, registered: true } : d)); setRegId(null); }, 600);
  };

  return (
    <div style={{ padding: "0 36px" }}>
      <div style={{ background: "linear-gradient(135deg,#0A1628,#0F1E35)", border: "1px solid #2CA8A0", borderRadius: 14, padding: "32px", marginBottom: 20 }}>
        <span style={label}>RAKSHA COMMUNITY</span>
        <h2 style={{ fontFamily: F.serif, fontSize: "1.8rem", fontWeight: 700, color: "#FAF9F7", margin: "0 0 4px" }}>Raksha Donors — <span style={{ color: "#2CA8A0" }}>Mumbai</span></h2>
        <p style={{ fontFamily: F.display, fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>143 members · 50 active this month</p>
      </div>

      <div style={{ ...card(), marginBottom: 16 }}>
        <span style={label}>RECENT POSTS</span>
        {POSTS.map((p, i) => (
          <div key={p.id} style={{ paddingBottom: i < POSTS.length - 1 ? 14 : 0, marginBottom: i < POSTS.length - 1 ? 14 : 0, borderBottom: i < POSTS.length - 1 ? "1px solid #1e293b" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: "0.85rem", color: "#E8897A" }}>{p.author}</span>
              <span style={{ fontFamily: F.mono, fontSize: "0.68rem", color: "#6B7280" }}>{p.time}</span>
            </div>
            <p style={{ fontFamily: F.display, fontSize: "0.875rem", color: "#9CA3AF", margin: 0, lineHeight: 1.6 }}>{p.text}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={label}>UPCOMING DRIVES</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {drives.map(d => (
            <div key={d.id} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 10, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: "0.875rem", color: "#FAF9F7", marginBottom: 3 }}>{d.title}</div>
                <div style={{ fontFamily: F.display, fontSize: "0.75rem", color: "#6B7280" }}>
                  <span style={{ color: "#E8897A", fontWeight: 500, marginRight: 6 }}>{d.date}</span>
                  {d.location} · {d.spots} spots
                </div>
              </div>
              {d.registered
                ? <span style={{ fontFamily: F.display, fontSize: "0.75rem", fontWeight: 600, color: "#2CA8A0", border: "1px solid #2CA8A0", padding: "5px 12px" }}>Registered ✓</span>
                : <button onClick={() => register(d.id)} disabled={regId === d.id} style={btn(regId === d.id ? "#6B7280" : "#C0152A")}>{regId === d.id ? "…" : "Register →"}</button>
              }
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card(), display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: "0.9rem", color: "#FAF9F7", marginBottom: 3 }}>Know someone who should be donating?</div>
          <div style={{ fontFamily: F.display, fontSize: "0.8rem", color: "#6B7280" }}>Share your referral link. Every donor strengthens the network.</div>
        </div>
        <button onClick={() => { 
          const code = donor.name ? donor.name.replace(/\s+/g, "").toUpperCase() + "001" : "DONOR001";
          navigator.clipboard?.writeText(`https://rakshaai.org/register/donor?ref=${code}`); 
          setCopied(true); 
          setTimeout(() => setCopied(false), 2500); 
        }}
          style={{ background: "transparent", border: "1px solid #2CA8A0", color: "#2CA8A0", fontFamily: F.display, fontWeight: 600, fontSize: "0.82rem", padding: "10px 18px", cursor: "pointer", whiteSpace: "nowrap" }}>
          {copied ? "✓ Link Copied!" : "Copy Referral Link →"}
        </button>
      </div>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────
export default function DonorDashboard() {
  const [panel, setPanel] = useState<Panel>("home");
  const [donor, setDonor] = useState<any>({
    name: "Loading...",
    bloodGroup: "",
    city: "",
    totalDonations: 0,
    missedAppointments: 0,
    streakMonths: 0,
    donorId: ""
  });
  const [appointment, setAppointment] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [transfusions, setTransfusions] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  const confirmAppointment = async () => {
    if (!appointment || loadingConfirm) return;
    setLoadingConfirm(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.appointmentId}/confirm`, {
        method: "PUT"
      });
      if (res.ok) {
        setAppointment((prev: any) => ({
          ...prev,
          donorConfirmed: true,
          status: "confirmed"
        }));
      }
    } catch (err) {
      console.error("Failed to confirm appointment:", err);
    } finally {
      setLoadingConfirm(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      // 1. Initial fallbacks from localStorage to avoid layout shift
      const cachedPhone = typeof window !== "undefined" ? localStorage.getItem("donorPhone") : null;
      const cachedName = typeof window !== "undefined" ? localStorage.getItem("donorName") : null;
      const cachedBloodGroup = typeof window !== "undefined" ? localStorage.getItem("donorBloodGroup") : null;
      const cachedCity = typeof window !== "undefined" ? localStorage.getItem("donorCity") : null;
      const cachedDonations = typeof window !== "undefined" ? parseInt(localStorage.getItem("donorDonations") || "0") : 0;

      let currentDonor = {
        name: cachedName || "Loading...",
        bloodGroup: cachedBloodGroup || "",
        city: cachedCity || "",
        totalDonations: cachedDonations,
        missedAppointments: 0,
        streakMonths: cachedDonations > 12 ? 12 : cachedDonations > 8 ? 8 : 4,
        donorId: ""
      };
      setDonor(currentDonor);

      try {
        let loggedInEmail = null;
        let loggedInUser = null;
        
        // Fetch session
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            loggedInUser = meData.user;
            loggedInEmail = meData.user.email?.toLowerCase();
          }
        }

        if (!loggedInEmail) {
          const userStr = typeof window !== "undefined" ? localStorage.getItem("raksha_user") : null;
          const user = userStr ? JSON.parse(userStr) : null;
          loggedInEmail = user?.email?.toLowerCase();
          loggedInUser = user;
        }

        let donorId = loggedInUser?.id || "";

        if (loggedInEmail && !donorId) {
          // Fallback search
          const res = await fetch(`/api/auth/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: loggedInEmail, password: "password", accountType: "donor" })
          });
          if (res.ok) {
            const signInData = await res.json();
            if (signInData.success) {
              donorId = signInData.userId;
            }
          }
        }

        if (!donorId && cachedPhone) {
          const res = await fetch(`/api/donor/by-phone/${encodeURIComponent(cachedPhone)}`);
          if (res.ok) {
            const phoneData = await res.json();
            donorId = phoneData?.donorId || phoneData?._id;
          }
        }

        if (donorId) {
          const donorRes = await fetch(`/api/donor/${encodeURIComponent(donorId)}`);
          if (donorRes.ok) {
            const data = await donorRes.json();
            if (data.success && data.donor) {
              const foundDbDonor = data.donor;
              const formattedDbDonor = {
                name: `${foundDbDonor.firstName || ""} ${foundDbDonor.lastName || ""}`.trim() || currentDonor.name,
                bloodGroup: foundDbDonor.bloodType || foundDbDonor.bloodGroup || currentDonor.bloodGroup,
                city: foundDbDonor.city || currentDonor.city,
                totalDonations: foundDbDonor.donationCount || foundDbDonor.totalDonations || 0,
                missedAppointments: 0,
                streakMonths: (foundDbDonor.donationCount || 0) > 12 ? 12 : (foundDbDonor.donationCount || 0) > 8 ? 8 : 4,
                donorId: donorId
              };
              setDonor(formattedDbDonor);
              
              if (Array.isArray(data.transfusions)) {
                setTransfusions(data.transfusions);
              }
            }
          }

          // Fetch appointments
          const aptRes = await fetch(`/api/appointments?donorId=${encodeURIComponent(donorId)}`);
          if (aptRes.ok) {
            const apts = await aptRes.json();
            if (Array.isArray(apts) && apts.length > 0) {
              const soonest = apts.sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
              if (soonest) {
                let patientName = "Arjun";
                if (soonest.patientId) {
                  const patientRes = await fetch(`/api/patient/${encodeURIComponent(soonest.patientId)}`);
                  if (patientRes.ok) {
                    const patData = await patientRes.json();
                    if (patData.success && patData.patient) {
                      patientName = patData.patient.firstName || "Arjun";
                      setPatient(patData.patient);
                    }
                  }
                }
                setAppointment({
                  ...soonest,
                  patientName
                });
              }
            }
          }

          // Fetch notifications
          const notifRes = await fetch(`/api/notifications?userId=${encodeURIComponent(donorId)}`);
          if (notifRes.ok) {
            const notifData = await notifRes.json();
            if (notifData.success && Array.isArray(notifData.notifications)) {
              setNotifications(notifData.notifications);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load live donor dashboard data:", err);
      }
    }
    loadData();
  }, []);

  const HEADERS: Record<Panel, { sub: string; title: string }> = {
    home:      { sub: "Your Raksha AI donor home base",  title: "My Dashboard" },
    impact:    { sub: "Every donation — documented",      title: "My Impact" },
    circle:    { sub: "The people your blood protects",   title: "My Patient Circle" },
    badges:    { sub: "Your donation journey",            title: "Badges & Milestones" },
    community: { sub: "Raksha Donors — Mumbai",           title: "Community" },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0D0D0D;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#0A1628}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px}
        @media(max-width:768px){
          .sidebar{display:none!important}
          .main{margin-left:0!important;padding-bottom:72px!important}
        }
        @media(min-width:769px){
          .tabs{display:none!important}
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#0D0D0D" }}>
        {/* Sidebar */}
        <div className="sidebar">
          <Sidebar donor={donor} active={panel} go={setPanel} />
        </div>

        {/* Mobile tabs */}
        <div className="tabs">
          <Tabs active={panel} go={setPanel} />
        </div>

        {/* Main */}
        <main className="main" style={{ marginLeft: 240, flex: 1, minHeight: "100vh", paddingBottom: 60 }}>
          <PHeader sub={HEADERS[panel].sub} title={HEADERS[panel].title} />
          {panel === "home"      && <PanelHome donor={donor} appointment={appointment} onConfirmAppointment={confirmAppointment} notifications={notifications} />}
          {panel === "impact"    && <PanelImpact donor={donor} transfusions={transfusions} />}
          {panel === "circle"    && <PanelCircle patient={patient} />}
          {panel === "badges"    && <PanelBadges donor={donor} patient={patient} transfusions={transfusions} />}
          {panel === "community" && <PanelCommunity donor={donor} />}
        </main>
      </div>
    </>
  );
}