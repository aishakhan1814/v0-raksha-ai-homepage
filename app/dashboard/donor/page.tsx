"use client";

import { useState, useEffect, useRef } from "react";

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
function Sidebar({ active, go }: { active: Panel; go: (p: Panel) => void }) {
  return (
    <aside style={{ width: 240, minHeight: "100vh", background: "#0A1628", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: "auto" }}>
      {/* Logo + profile */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Shield size={34} />
          <div>
            <div style={{ display: "flex", gap: 3, alignItems: "baseline" }}>
              <span style={{ fontFamily: F.serif, fontWeight: 700, fontSize: "1.15rem", color: "#FAF9F7" }}>Raksha</span>
              <span style={{ fontFamily: F.serif, fontWeight: 700, fontSize: "1.15rem", color: "#2CA8A0" }}>AI</span>
            </div>
            <div style={{ fontFamily: F.display, fontSize: "0.58rem", color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase" }}>Donor Portal</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#8B1A2A,#0A1628)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FAF9F7", fontFamily: F.serif, fontWeight: 700, fontSize: "0.9rem", border: "2px solid #C0152A", flexShrink: 0 }}>R</div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: "0.875rem", color: "#FAF9F7" }}>{DONOR.name}</div>
            <span style={{ background: "#C0152A", color: "#FAF9F7", fontFamily: F.mono, fontSize: "0.62rem", fontWeight: 600, padding: "2px 8px", letterSpacing: "0.06em" }}>{DONOR.bloodGroup}</span>
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
      <div style={{ padding: "14px 20px", borderTop: "1px solid #1e293b" }}>
        <button style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F.display, fontSize: "0.8rem", color: "#6B7280", padding: 0 }}>← Log Out</button>
        <div style={{ fontFamily: F.display, fontSize: "0.62rem", color: "#374151", marginTop: 6 }}>Demo · v1.0</div>
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

// ─── PANEL 1 — HOME ───────────────────────────────────────────────────────────
function PanelHome() {
  const cd = useCountdown(NEXT_APT.date);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const confirm = () => {
    setLoading(true);
    setTimeout(() => { setConfirmed(true); setLoading(false); }, 700);
  };

  return (
    <div style={{ padding: "0 36px" }}>
      {/* Welcome card */}
      <div style={{ background: "linear-gradient(135deg,#0A1628,#0F1E35)", border: "1px solid #8B1A2A", borderRadius: 14, padding: "36px 32px", marginBottom: 20 }}>
        <span style={label}>GOOD MORNING</span>
        <h2 style={{ fontFamily: F.serif, fontSize: "2rem", fontWeight: 700, color: "#FAF9F7", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
          Welcome back, <span style={{ fontStyle: "italic", color: "#F5ECD7" }}>Ramesh.</span>
        </h2>
        <p style={{ fontFamily: F.display, fontSize: "0.9rem", color: "#9CA3AF", margin: 0 }}>
          Next donation in <span style={{ fontFamily: F.mono, color: "#D4A847" }}>{cd.days}d {cd.hours}h</span>. Arjun is counting on you.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Donations", value: "7", color: "#C0152A" },
          { label: "Patient in Circle", value: "Arjun · 9", color: "#FAF9F7" },
          { label: "Missed Appointments", value: "0", color: "#2CA8A0" },
        ].map((s, i) => (
          <div key={i} style={card()}>
            <div style={{ fontFamily: F.display, fontSize: "0.68rem", color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontFamily: F.mono, fontSize: "1.75rem", fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Appointment */}
      <div style={{ ...card("#8B1A2A"), marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div>
            <span style={label}>NEXT DONATION</span>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: "1rem", color: "#FAF9F7", marginBottom: 4 }}>Tuesday, March 18 · 10:30 AM</div>
            <div style={{ fontFamily: F.display, fontSize: "0.85rem", color: "#6B7280" }}>KEM Hospital Blood Bank · Patient: <span style={{ color: "#E8897A" }}>Arjun</span></div>
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
          {confirmed
            ? <div style={{ ...btn("#2CA8A0"), cursor: "default" }}>✓ Confirmed — See You There!</div>
            : <button onClick={confirm} disabled={loading} style={btn(loading ? "#1A7A4A" : "#2CA8A0")}>{loading ? "Confirming…" : "Confirm I'll Be There ✓"}</button>
          }
          <button style={{ background: "transparent", color: "#9CA3AF", border: "1px solid #374151", fontFamily: F.display, fontSize: "0.85rem", padding: "11px 20px", cursor: "pointer" }}>Need to Reschedule</button>
        </div>
      </div>

      {/* Activity */}
      <div style={card()}>
        <span style={label}>RECENT ACTIVITY</span>
        {ACTIVITY.map((a, i) => (
          <div key={a.id} style={{ display: "flex", gap: 14, padding: "13px 0 13px 14px", borderLeft: `2px solid ${a.accent}`, borderBottom: i < ACTIVITY.length - 1 ? "1px solid #1e293b" : "none" }}>
            <span style={{ fontSize: 17, flexShrink: 0 }}>{a.icon}</span>
            <div>
              <div style={{ fontFamily: F.display, fontSize: "0.875rem", color: "#FAF9F7", lineHeight: 1.5 }}>{a.text}</div>
              <div style={{ fontFamily: F.mono, fontSize: "0.68rem", color: "#6B7280", marginTop: 3 }}>{a.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PANEL 2 — IMPACT ─────────────────────────────────────────────────────────
function PanelImpact() {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const totalHb = HISTORY.reduce((a, d) => a + (d.hbA - d.hbB), 0);
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
          { val: `${totalHb.toFixed(1)} g/dL`, sub: "Total hemoglobin raised across 7 donations" },
          { val: `~${school}`, sub: "School days Arjun could attend" },
          { val: `${DONOR.streakMonths}mo`, sub: "Consecutive months active — zero cancellations" },
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
              {HISTORY.map((d, i) => (
                <tr key={i} style={{ borderBottom: i < HISTORY.length - 1 ? "1px solid #1e293b" : "none" }}>
                  <td style={{ padding: "11px 14px 11px 0", fontFamily: F.display, fontSize: "0.85rem", color: "#FAF9F7" }}>{d.date}</td>
                  <td style={{ padding: "11px 14px 11px 0", fontFamily: F.mono, fontSize: "0.82rem", color: "#C0152A" }}>{d.hbB}</td>
                  <td style={{ padding: "11px 14px 11px 0", fontFamily: F.mono, fontSize: "0.82rem", color: "#2CA8A0" }}>{d.hbA}</td>
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
function PanelCircle() {
  return (
    <div style={{ padding: "0 36px" }}>
      <div style={{ background: "linear-gradient(135deg,#0A1628,#0F1E35)", border: "1px solid #C0152A", borderRadius: 14, padding: "32px", marginBottom: 20 }}>
        <span style={label}>MY PATIENT CIRCLE</span>
        <h2 style={{ fontFamily: F.serif, fontSize: "1.8rem", fontWeight: 700, color: "#FAF9F7", margin: "0 0 6px" }}>The people your blood <span style={{ fontStyle: "italic" }}>protects.</span></h2>
        <p style={{ fontFamily: F.display, fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>Primary donor for 1 patient, backup for 1 more.</p>
      </div>

      <div style={{ ...card("#C0152A"), marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div>
            <span style={{ ...label, color: "#C0152A" }}>PRIMARY PATIENT</span>
            <div style={{ fontFamily: F.serif, fontSize: "1.4rem", fontWeight: 700, color: "#FAF9F7" }}>Arjun · Age 9</div>
            <div style={{ fontFamily: F.display, fontSize: "0.83rem", color: "#6B7280", marginTop: 3 }}>O+ · KEM Hospital Mumbai</div>
          </div>
          <div style={{ background: "#2CA8A0", color: "#FAF9F7", fontFamily: F.display, fontWeight: 600, fontSize: "0.78rem", padding: "6px 14px" }}>Confirmed ✓</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
          {[{ l: "Compatibility", v: "94%", c: "#2CA8A0" }, { l: "Your Donations", v: "7", c: "#C0152A" }, { l: "Next Window", v: "Mar 17–21", c: "#D4A847" }].map((s, i) => (
            <div key={i} style={{ background: "#0A1628", borderRadius: 8, padding: 14 }}>
              <div style={{ fontFamily: F.mono, fontSize: "1.25rem", color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontFamily: F.display, fontSize: "0.68rem", color: "#6B7280", marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: F.display, fontSize: "0.82rem", color: "#9CA3AF", margin: "0 0 14px", lineHeight: 1.6 }}>Extended Rh match confirmed. Kell negative. <strong style={{ color: "#FAF9F7" }}>7 donations since August 2023.</strong></p>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={btn()}>View Full History</button>
          <button style={{ background: "transparent", color: "#9CA3AF", border: "1px solid #374151", fontFamily: F.display, fontSize: "0.82rem", padding: "10px 18px", cursor: "pointer" }}>Message Coordinator</button>
        </div>
      </div>

      <div style={card()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: F.serif, fontSize: "1.15rem", fontWeight: 700, color: "#9CA3AF" }}>Patient "P." · Age 6 · B+ · Mumbai</div>
          <span style={{ fontFamily: F.display, fontSize: "0.65rem", color: "#6B7280", border: "1px solid #374151", padding: "3px 10px" }}>BACKUP #2</span>
        </div>
        <p style={{ fontFamily: F.display, fontSize: "0.82rem", color: "#6B7280", margin: 0 }}>Second-line backup. No action required unless primary is unavailable.</p>
      </div>
    </div>
  );
}

// ─── PANEL 4 — BADGES ─────────────────────────────────────────────────────────
function PanelBadges() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  return (
    <div style={{ padding: "0 36px" }}>
      <div style={{ ...card(), marginBottom: 20 }}>
        <span style={label}>YOUR BADGE COLLECTION</span>
        <p style={{ fontFamily: F.display, fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>3 earned · 3 in progress. Keep donating to unlock all six.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {BADGES.map(b => (
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
function PanelCommunity() {
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
        <button onClick={() => { navigator.clipboard?.writeText("https://rakshaai.org/register/donor?ref=RAMESH001"); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
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
          <Sidebar active={panel} go={setPanel} />
        </div>

        {/* Mobile tabs */}
        <div className="tabs">
          <Tabs active={panel} go={setPanel} />
        </div>

        {/* Main */}
        <main className="main" style={{ marginLeft: 240, flex: 1, minHeight: "100vh", paddingBottom: 60 }}>
          <PHeader sub={HEADERS[panel].sub} title={HEADERS[panel].title} />
          {panel === "home"      && <PanelHome />}
          {panel === "impact"    && <PanelImpact />}
          {panel === "circle"    && <PanelCircle />}
          {panel === "badges"    && <PanelBadges />}
          {panel === "community" && <PanelCommunity />}
        </main>
      </div>
    </>
  );
}