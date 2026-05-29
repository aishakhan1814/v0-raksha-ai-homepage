"use client";

import { useState, useEffect, useRef } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────
function useCountUp(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return val;
}

function useCountdown(targetDate) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) return;
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

const pad = (n) => String(n).padStart(2, "0");

// ── mock data ─────────────────────────────────────────────────────────────────
const DONOR = {
  name: "Ramesh R.",
  blood: "O+",
  city: "Hyderabad",
  totalDonations: 18,
  patientsInCircle: 2,
  missedAppointments: 0,
  nextAppt: "2026-06-15T09:30:00",
  nextApptCenter: "Rainbow Thalassemia Centre",
  nextApptAddress: "Banjara Hills, Hyderabad",
};

const ACTIVITY = [
  { id: 1, text: "Appointment confirmed for June 15", time: "2h ago", type: "confirm" },
  { id: 2, text: "New patient Kavya T. added to your circle", time: "1d ago", type: "patient" },
  { id: 3, text: "Emergency broadcast: O+ needed in KIMS", time: "2d ago", type: "emergency" },
  { id: 4, text: "Badge unlocked: Iron Will (5 donations)", time: "4d ago", type: "badge" },
  { id: 5, text: "Impact letter generated & emailed", time: "1w ago", type: "letter" },
];

const IMPACT = {
  livesImpacted: 34,
  unitsGiven: 18,
  hoursVolunteered: 54,
  emergencyResponses: 3,
  patientsSaved: 7,
};

const PATIENTS = [
  {
    id: 1,
    name: "Kavya T.",
    age: 9,
    blood: "O+",
    hospital: "Rainbow Thalassemia Centre",
    city: "Hyderabad",
    match: 94,
    status: "Confirmed",
    primary: true,
    nextTransfusion: "Jun 15, 2026",
    photo: "KT",
  },
  {
    id: 2,
    name: "Arjun M.",
    age: 14,
    blood: "O+",
    hospital: "KIMS Hospital",
    city: "Hyderabad",
    match: 87,
    status: "Backup",
    primary: false,
    nextTransfusion: "Jun 20, 2026",
    photo: "AM",
  },
  {
    id: 3,
    name: "Priya S.",
    age: 7,
    blood: "O+",
    hospital: "Niloufer Hospital",
    city: "Hyderabad",
    match: 81,
    status: "Backup",
    primary: false,
    nextTransfusion: "Jun 28, 2026",
    photo: "PS",
  },
];

const BADGES = [
  { id: 1, icon: "🩸", name: "First Drop", desc: "First donation", earned: true, date: "Jan 2024" },
  { id: 2, icon: "⚡", name: "Emergency Hero", desc: "Responded to 3 emergencies", earned: true, date: "Mar 2024" },
  { id: 3, icon: "🛡️", name: "Iron Will", desc: "5 consecutive donations", earned: true, date: "May 2024" },
  { id: 4, icon: "🌟", name: "Circle Guardian", desc: "Joined 2 patient circles", earned: true, date: "Jul 2024" },
  { id: 5, icon: "💎", name: "Diamond Donor", desc: "20 total donations", earned: false, progress: 90, next: "2 more" },
  { id: 6, icon: "🏆", name: "City Champion", desc: "Top 10 in Hyderabad", earned: false, progress: 60, next: "3 more" },
  { id: 7, icon: "❤️", name: "Life Saver", desc: "10 patients impacted", earned: false, progress: 70, next: "3 more" },
  { id: 8, icon: "🎖️", name: "5-Year Veteran", desc: "5 years with Raksha", earned: false, progress: 40, next: "3 yrs" },
];

const DRIVES = [
  { id: 1, title: "Hyderabad O+ Marathon Drive", date: "Jun 8", location: "Gachibowli Stadium", slots: 14, registered: true },
  { id: 2, title: "KIMS Emergency Drive", date: "Jun 14", location: "KIMS Hospital Auditorium", slots: 6, registered: false },
  { id: 3, title: "City Blood Heroes Camp", date: "Jun 22", location: "Hitec City Community Hall", slots: 30, registered: false },
];

const COMMUNITY_STATS = { cityDonors: 1204, activeDrives: 3, referrals: 2 };

const NAV = [
  { id: "home", label: "Dashboard", icon: "⊞" },
  { id: "impact", label: "My Impact", icon: "◈" },
  { id: "circle", label: "Patient Circle", icon: "◉" },
  { id: "badges", label: "Badges", icon: "◆" },
  { id: "community", label: "Community", icon: "◎" },
];

// ── sub-components ────────────────────────────────────────────────────────────

function Logo({ collapsed = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="42" style={{ flexShrink: 0 }}>
        <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
        <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
        <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
      {!collapsed && (
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
          <span style={{ color: "#FAF9F7" }}>Raksha</span>
          <span style={{ color: "#2CA8A0" }}>AI</span>
        </span>
      )}
    </div>
  );
}

function StatCard({ label, value, color, prefix = "", suffix = "" }) {
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const counted = useCountUp(value, 1600, started);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      background: "#111827", border: "1px solid #1e293b", borderRadius: 12,
      padding: "20px 24px", flex: 1, minWidth: 140,
      transition: "border-color .2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#C0152A"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1e293b"}
    >
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 500, color }}>
        {prefix}{counted}{suffix}
      </div>
    </div>
  );
}

function ActivityFeed() {
  const typeColor = { confirm: "#2CA8A0", patient: "#FAF9F7", emergency: "#C0152A", badge: "#D4A847", letter: "#E8897A" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {ACTIVITY.map((a, i) => (
        <div key={a.id} style={{
          display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0",
          borderBottom: i < ACTIVITY.length - 1 ? "1px solid #1e293b" : "none",
        }}>
          <div style={{ width: 2, background: "#C0152A", alignSelf: "stretch", borderRadius: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: typeColor[a.type] || "#FAF9F7", lineHeight: 1.5 }}>{a.text}</div>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6B7280", flexShrink: 0 }}>{a.time}</div>
        </div>
      ))}
    </div>
  );
}

function AppointmentCard({ countdown }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div style={{ background: "#111827", border: "1px solid #8B1A2A", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>Next Appointment</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#FAF9F7" }}>Jun 15, 2026 · 9:30 AM</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>{DONOR.nextApptCenter} · {DONOR.nextApptAddress}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 6 }}>Countdown</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: "#D4A847", letterSpacing: 2 }}>
            {pad(countdown.d)}d {pad(countdown.h)}h {pad(countdown.m)}m {pad(countdown.s)}s
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <button
          onClick={() => setConfirmed(c => !c)}
          style={{
            background: confirmed ? "#1A7A4A" : "#2CA8A0",
            color: "#fff", border: "none", padding: "10px 22px",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
            cursor: "pointer", borderRadius: 0, transition: "background .2s",
          }}
        >
          {confirmed ? "✓ Confirmed — See You There!" : "Confirm I'll Be There ✓"}
        </button>
        <button style={{
          background: "transparent", color: "#9CA3AF",
          border: "1px solid #6B7280", padding: "10px 22px",
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
          cursor: "pointer", borderRadius: 0,
        }}>
          Need to Reschedule
        </button>
      </div>
    </div>
  );
}

// ── PANELS ────────────────────────────────────────────────────────────────────

function PanelHome({ countdown }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 6 }}>Welcome Back</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, color: "#FAF9F7", lineHeight: 1.15 }}>
          Good morning, {DONOR.name.split(" ")[0]}.<br />
          <span style={{ color: "#9CA3AF", fontSize: 26, fontStyle: "italic" }}>Your donation saves lives today.</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard label="Total Donations" value={DONOR.totalDonations} color="#C0152A" />
        <StatCard label="Patients in My Circle" value={DONOR.patientsInCircle} color="#FAF9F7" />
        <StatCard label="Missed Appointments" value={DONOR.missedAppointments} color="#2CA8A0" />
      </div>

      <AppointmentCard countdown={countdown} />

      <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 16 }}>Recent Activity</div>
        <ActivityFeed />
      </div>
    </div>
  );
}

function PanelImpact() {
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const lives = useCountUp(IMPACT.livesImpacted, 2000, started);
  const units = useCountUp(IMPACT.unitsGiven, 2000, started);
  const hours = useCountUp(IMPACT.hoursVolunteered, 2000, started);
  const emergency = useCountUp(IMPACT.emergencyResponses, 2000, started);
  const saved = useCountUp(IMPACT.patientsSaved, 2000, started);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const metrics = [
    { label: "Lives Touched", value: lives },
    { label: "Units Donated", value: units },
    { label: "Hours Volunteered", value: hours },
    { label: "Emergency Responses", value: emergency },
    { label: "Patients Saved", value: saved },
  ];

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>Your Legacy</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>My Impact</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginTop: 4 }}>Every drop you give writes a story of survival.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "20px 18px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 38, fontWeight: 500, color: "#2CA8A0" }}>{m.value}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF", marginTop: 6, letterSpacing: "0.5px" }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "#FAF9F7", fontStyle: "italic", marginBottom: 14 }}>
          "Your 18 donations have directly contributed to keeping Kavya T. healthy for the past 9 months. You are her guardian."
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B7280" }}>— Raksha AI Impact Report · May 2026</div>
        <button style={{
          marginTop: 20, background: "transparent", color: "#C0152A",
          border: "1px solid #C0152A", padding: "10px 24px",
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
          cursor: "pointer", borderRadius: 0, transition: "all .2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#C0152A"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C0152A"; }}
        >
          Generate My Impact Letter
        </button>
      </div>
    </div>
  );
}

function PanelCircle() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>Your Network</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>Patient Circle</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginTop: 4 }}>AI-matched patients who depend on donors like you.</div>
      </div>

      {PATIENTS.map(p => (
        <div key={p.id} style={{
          background: "#111827",
          border: `1px solid ${p.primary ? "#C0152A" : "#1e293b"}`,
          borderRadius: 12, padding: 24,
          transition: "border-color .2s",
        }}
          onMouseEnter={e => { if (!p.primary) e.currentTarget.style.borderColor = "#C0152A"; }}
          onMouseLeave={e => { if (!p.primary) e.currentTarget.style.borderColor = "#1e293b"; }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%", background: p.primary ? "#8B1A2A" : "#1e293b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#FAF9F7", flexShrink: 0,
            }}>
              {p.photo}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 600, color: "#FAF9F7" }}>{p.name}</div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 0, background: p.primary ? "#C0152A" : "#1e293b", color: p.primary ? "#fff" : "#6B7280", letterSpacing: "1px" }}>
                  {p.primary ? "PRIMARY" : "BACKUP"}
                </span>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
                Age {p.age} · {p.blood} · {p.hospital}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                Next transfusion: <span style={{ color: "#FAF9F7" }}>{p.nextTransfusion}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 500, color: "#2CA8A0" }}>{p.match}%</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#6B7280", letterSpacing: "1px", textTransform: "uppercase" }}>Match</div>
              <div style={{ marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: p.status === "Confirmed" ? "#2CA8A0" : "#6B7280", fontWeight: 600, letterSpacing: "0.5px" }}>
                {p.status === "Confirmed" ? "✓ Confirmed" : p.status}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelBadges() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>Your Achievements</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>Badges & Milestones</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginTop: 4 }}>Recognition for your extraordinary commitment.</div>
      </div>

      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#D4A847", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>Earned</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {BADGES.filter(b => b.earned).map(b => (
            <div key={b.id} style={{
              background: "#111827", border: "1px solid #D4A847", borderRadius: 12,
              padding: "20px 18px", display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ fontSize: 28 }}>{b.icon}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#FAF9F7" }}>{b.name}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF" }}>{b.desc}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#D4A847" }}>{b.date}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>Locked — Keep Going</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {BADGES.filter(b => !b.earned).map(b => (
            <div key={b.id} style={{
              background: "#111827", border: "1px solid #1e293b", borderRadius: 12,
              padding: "20px 18px", opacity: 0.75,
            }}>
              <div style={{ fontSize: 28, filter: "grayscale(1)" }}>{b.icon}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#FAF9F7", marginTop: 8 }}>{b.name}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>{b.desc}</div>
              <div style={{ background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 6 }}>
                <ProgressBar value={b.progress} />
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", fontWeight: 500 }}>
                {b.next} to unlock
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  const [width, setWidth] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 300);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div ref={ref} style={{
      height: "100%", width: `${width}%`,
      background: "#C0152A", borderRadius: 4,
      transition: "width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
    }} />
  );
}

function PanelCommunity() {
  const [drove, setDrove] = useState({});
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>Around You</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>Community</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginTop: 4 }}>Blood warriors of Hyderabad. Together we're stronger.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14 }}>
        {[
          { label: "Hyderabad Donors", value: COMMUNITY_STATS.cityDonors, color: "#FAF9F7" },
          { label: "Active Drives", value: COMMUNITY_STATS.activeDrives, color: "#2CA8A0" },
          { label: "My Referrals", value: COMMUNITY_STATS.referrals, color: "#D4A847" },
        ].map(s => (
          <div key={s.label} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "18px 16px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 30, color: s.color }}>{s.value.toLocaleString()}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#FAF9F7", marginBottom: 14 }}>Upcoming Drives in Hyderabad</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {DRIVES.map(d => (
            <div key={d.id} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", transition: "border-color .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#C0152A"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1e293b"}
            >
              <div style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#E8897A",
                minWidth: 52, textAlign: "center", lineHeight: 1.1,
              }}>
                {d.date.split(" ")[0]}<br /><span style={{ fontSize: 13, fontWeight: 500, color: "#E8897A99" }}>{d.date.split(" ")[1]}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#FAF9F7" }}>{d.title}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>{d.location}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6B7280", marginTop: 3 }}>{d.slots} slots available</div>
              </div>
              <button
                onClick={() => setDrove(prev => ({ ...prev, [d.id]: true }))}
                style={{
                  background: drove[d.id] ? "#1A7A4A" : (d.registered ? "#1e293b" : "#C0152A"),
                  color: "#fff", border: "none", padding: "9px 20px",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", borderRadius: 0, flexShrink: 0,
                }}
              >
                {drove[d.id] ? "✓ Registered" : (d.registered ? "Registered ✓" : "Register")}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#FAF9F7", marginBottom: 8 }}>Refer a Friend</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}>Grow the circle. Every referral could save a child's life.</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            placeholder="Friend's phone or email"
            style={{
              flex: 1, minWidth: 200, background: "#0A1628", border: "1px solid #1e293b",
              color: "#FAF9F7", padding: "10px 14px", fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, borderRadius: 0, outline: "none",
            }}
          />
          <button style={{
            background: "transparent", color: "#2CA8A0", border: "1px solid #2CA8A0",
            padding: "10px 22px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
            cursor: "pointer", borderRadius: 0,
          }}>
            Send Invite →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function DonorDashboard() {
  const [active, setActive] = useState("home");
  const countdown = useCountdown(DONOR.nextAppt);
  const [sidebarHover, setSidebarHover] = useState(null);

  const PANELS = { home: <PanelHome countdown={countdown} />, impact: <PanelImpact />, circle: <PanelCircle />, badges: <PanelBadges />, community: <PanelCommunity /> };

  return (
    <div style={{
      display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif",
      background: "#0D0D0D", color: "#FAF9F7",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0A1628; } ::-webkit-scrollbar-thumb { background: #C0152A; border-radius: 2px; }
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .mobile-tabs { display: flex !important; }
          .main-scroll { padding-bottom: 80px !important; }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="sidebar" style={{
        width: 240, background: "#0A1628", borderRight: "1px solid #1e293b",
        position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column",
        padding: "24px 0", overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px 20px" }}>
          <Logo />
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#8B1A2A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#FAF9F7" }}>RR</div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "#FAF9F7" }}>{DONOR.name}</div>
              <span style={{ background: "#C0152A", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", letterSpacing: "0.5px" }}>{DONOR.blood}</span>
            </div>
          </div>
        </div>

        <div style={{ margin: "0 14px 16px", background: "#2CA8A0", padding: "7px 12px", borderRadius: 0, display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#fff", fontWeight: 600, letterSpacing: "0.5px" }}>Emergency Broadcast: Active</span>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
          {NAV.map(n => {
            const isActive = active === n.id;
            return (
              <button key={n.id} onClick={() => setActive(n.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 12px", background: isActive ? "#111827" : "transparent",
                  border: "none", borderLeft: isActive ? "2px solid #C0152A" : "2px solid transparent",
                  cursor: "pointer", width: "100%", textAlign: "left",
                  color: isActive ? "#FAF9F7" : "#9CA3AF",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                  borderRadius: "0 6px 6px 0", transition: "all .15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "#FAF9F7"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "#9CA3AF"; }}
              >
                <span style={{ fontSize: 16, opacity: 0.9 }}>{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "0 8px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", background: "transparent", border: "none", cursor: "pointer", width: "100%", color: "#6B7280", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
            <span>⎋</span> Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-scroll" style={{ flex: 1, overflowY: "auto", padding: "36px 32px" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          {PANELS[active]}
        </div>
      </main>

      {/* MOBILE BOTTOM TABS */}
      <nav className="mobile-tabs" style={{
        display: "none", position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#0A1628", borderTop: "1px solid #1e293b",
        padding: "8px 0 12px", zIndex: 100, justifyContent: "space-around",
      }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setActive(n.id)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            color: active === n.id ? "#C0152A" : "#6B7280",
            fontFamily: "'DM Sans', sans-serif", fontSize: 10,
          }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            {n.label.split(" ")[0]}
          </button>
        ))}
      </nav>
    </div>
  );
}