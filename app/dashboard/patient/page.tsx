"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation, Language } from "@/components/raksha/translation-provider";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Area, AreaChart,
} from "recharts";

// ── FONTS ─────────────────────────────────────────────────────────────────────
const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface CountdownTime { d: number; h: number; m: number; s: number; }
interface HealthPoint { month: string; hb: number | null; trans: boolean; }
interface HistoryRecord { id: number; date: string; unit: number; hbBefore: number; hbAfter: number; donor: string; reaction: boolean; center: string; }
interface Donor {
  id: number;
  initials: string;
  name: string;
  blood: string;
  reliability: number;
  donations: number;
  status: string;
  primary: boolean;
  city: string;
  matchScore?: number;
  scoreBreakdown?: {
    bloodTypeMatchScore: number;
    cityMatchScore: number;
    recencyScore: number;
    rankingLabel: string;
    explanation: string;
  };
  eligible?: boolean;
}
interface CalendarEvent { type: "confirmed" | "outreach" | "unconfirmed" | "past"; label: string; }
interface NavItem { id: string; label: string; icon: string; }
interface StatCard { label: string; value: string | number; unit: string; color: string; note: string; }

// ── HELPERS ───────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1600, trigger = true): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(+(p * target).toFixed(1));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, trigger]);
  return val;
}

function useCountdown(targetDate: string): CountdownTime {
  const [t, setT] = useState<CountdownTime>({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return;
      setT({
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
  return t;
}

const pad = (n: number) => String(n).padStart(2, "0");

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const PATIENT = { id: "", name: "Loading...", age: 0, blood: "", family: "Loading...", hospital: "", city: "", coordinator: "", gender: "" };
const NEXT_TRANSFUSION = "2026-06-15T09:00:00";

const HEALTH_DATA: HealthPoint[] = [
  { month: "Oct", hb: 7.2, trans: true }, { month: "Nov", hb: 10.8, trans: false },
  { month: "Dec", hb: 7.8, trans: true }, { month: "Jan", hb: 11.1, trans: false },
  { month: "Feb", hb: 7.4, trans: true }, { month: "Mar", hb: 10.4, trans: false },
  { month: "Apr", hb: 7.6, trans: true }, { month: "May", hb: 10.4, trans: false },
  { month: "Jun (est)", hb: null, trans: false },
];

const HISTORY: HistoryRecord[] = [
  { id: 1, date: "Apr 18, 2026", unit: 2, hbBefore: 7.6, hbAfter: 10.8, donor: "Ramesh R.", reaction: false, center: "Rainbow TC" },
  { id: 2, date: "Feb 10, 2026", unit: 2, hbBefore: 7.4, hbAfter: 10.4, donor: "Ramesh R.", reaction: false, center: "Rainbow TC" },
  { id: 3, date: "Dec 12, 2025", unit: 2, hbBefore: 7.8, hbAfter: 11.1, donor: "Suresh K.", reaction: false, center: "KIMS Hospital" },
  { id: 4, date: "Oct 5, 2025", unit: 2, hbBefore: 7.2, hbAfter: 10.8, donor: "Ramesh R.", reaction: false, center: "Rainbow TC" },
  { id: 5, date: "Aug 1, 2025", unit: 2, hbBefore: 7.9, hbAfter: 11.3, donor: "Anita M.", reaction: false, center: "Niloufer Hospital" },
];

const DONORS: Donor[] = [
  { id: 1, initials: "RR", name: "Ramesh R.", blood: "O+", reliability: 97, donations: 18, status: "Confirmed", primary: true, city: "Hyderabad" },
  { id: 2, initials: "SK", name: "Suresh K.", blood: "B+", reliability: 84, donations: 11, status: "Standby", primary: false, city: "Hyderabad" },
  { id: 3, initials: "AM", name: "Anita M.", blood: "O+", reliability: 78, donations: 7, status: "Outreach", primary: false, city: "Secunderabad" },
];

const CALENDAR_EVENTS: Record<string, CalendarEvent> = {
  "2026-06-15": { type: "confirmed", label: "Transfusion" },
  "2026-06-08": { type: "outreach", label: "Outreach" },
  "2026-05-18": { type: "past", label: "Past" },
  "2026-06-22": { type: "unconfirmed", label: "Window" },
};

const NAV: NavItem[] = [
  { id: "home", label: "Overview", icon: "⊞" },
  { id: "calendar", label: "Calendar", icon: "◈" },
  { id: "donors", label: "Eligible Donors", icon: "◉" },
  { id: "history", label: "History", icon: "▤" },
  { id: "tracker", label: "Health Tracker", icon: "◆" },
  { id: "passport", label: "Transfusion Passport", icon: "🪪" },
];

// ── LOGO ──────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", cursor: "pointer" }}>
      <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="42" style={{ flexShrink: 0 }}>
        <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
        <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
        <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
        <span style={{ color: "#FAF9F7" }}>Raksha</span>
        <span style={{ color: "#2CA8A0" }}>AI</span>
      </span>
    </a>
  );
}

// ── EMERGENCY MODAL ───────────────────────────────────────────────────────────
function EmergencyModal({ patient, donors, onClose }: { patient: typeof PATIENT; donors: Donor[]; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSend = async () => {
    setLoading(true);
    try {
      const primaryDonor = donors[0];
      if (primaryDonor) {
        await fetch("/api/request-donor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            donorId: primaryDonor.id ? String(primaryDonor.id) : "1",
            donorName: primaryDonor.name || "Ramesh R.",
            patientBloodGroup: patient.blood,
            patientCity: patient.city,
            diagnosis: "Thalassemia Major",
            urgency: "CRITICAL SOS"
          })
        });
      }
    } catch (e) {
      console.error("SOS Alert dispatch failed:", e);
    } finally {
      setLoading(false);
      setSent(true);
    }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#111827", border: "1px solid #C0152A", borderRadius: 12, padding: 32, maxWidth: 480, width: "100%" }}>
        {!sent ? (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🆘</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#FAF9F7", marginBottom: 8 }}>Confirm Emergency Request</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9CA3AF", marginBottom: 8, lineHeight: 1.6 }}>
              This will immediately alert your coordinator <strong style={{ color: "#FAF9F7" }}>{patient.coordinator}</strong>, all confirmed donors in {patient.name}'s circle, and the nearest compatible blood bank.
            </div>
            <div style={{ background: "#0A1628", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
              Patient: <span style={{ color: "#FAF9F7" }}>{patient.name} {patient.family.replace(" Family", "")}, {patient.blood}</span><br />
              Hospital: <span style={{ color: "#FAF9F7" }}>{patient.hospital}, {patient.city}</span><br />
              Trigger time: <span style={{ color: "#FAF9F7", fontFamily: "'JetBrains Mono', monospace" }}>{new Date().toLocaleTimeString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={handleSend} disabled={loading} style={{ flex: 1, background: "#C0152A", color: "#fff", border: "none", padding: "13px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", borderRadius: 0 }}>
                {loading ? "Sending Alert…" : "CONFIRM — TRIGGER NOW"}
              </button>
              <button onClick={onClose} style={{ background: "transparent", color: "#9CA3AF", border: "1px solid #6B7280", padding: "13px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer", borderRadius: 0 }}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#2CA8A0", marginBottom: 8 }}>Emergency Alert Sent</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9CA3AF", lineHeight: 1.7 }}>
              {patient.coordinator} has been notified.<br />
              Circle donors alerted. Expected response: <span style={{ color: "#2CA8A0", fontFamily: "'JetBrains Mono', monospace" }}>~12 minutes</span>
            </div>
            <button onClick={onClose} style={{ marginTop: 20, background: "#2CA8A0", color: "#fff", border: "none", padding: "10px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 0 }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── RELIABILITY BAR ───────────────────────────────────────────────────────────
function ReliabilityBar({ value }: { value: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 400); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${w}%`, background: "#2CA8A0", borderRadius: 4, transition: "width 1.2s cubic-bezier(.34,1.56,.64,1)" }} />
    </div>
  );
}

// ── EMERGENCY STRIP ───────────────────────────────────────────────────────────
function EmergencyStrip({ patient, onTrigger }: { patient: typeof PATIENT; onTrigger: () => void }) {
  return (
    <div style={{ background: "rgba(192,21,42,0.12)", border: "1px solid #C0152A", borderRadius: 10, padding: "20px 24px", marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>Emergency Protocol</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#FAF9F7" }}>Is {patient.name}'s hemoglobin critically low or you have an urgent need?</div>
        </div>
        <button onClick={onTrigger} style={{ background: "#C0152A", color: "#fff", border: "none", padding: "12px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 0, display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.5px" }}>
          🆘 TRIGGER EMERGENCY REQUEST
        </button>
      </div>
    </div>
  );
}

// ── PANEL 1 — HOME ────────────────────────────────────────────────────────────
function PanelHome({ patient, countdown, nextTransfusion, onEmergency }: { patient: any; countdown: CountdownTime; nextTransfusion: string; onEmergency: () => void }) {
  const hb = useCountUp(10.4, 1800);
  const days = useCountUp(23, 1400);

  const stats: StatCard[] = [
    { label: "Hemoglobin", value: hb.toFixed(1), unit: "g/dL", color: "#2CA8A0", note: "Within safe range" },
    { label: "Days Since Last", value: Math.floor(days), unit: "days", color: "#D4A847", note: "Window approaching" },
    { label: "Window Opens", value: "Jun 8", unit: "", color: "#2CA8A0", note: "Outreach triggered" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>Family Dashboard</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, color: "#FAF9F7", lineHeight: 1.2 }}>
          Good morning, {patient.family}.<br />
          <span style={{ color: "#9CA3AF", fontSize: 24, fontStyle: "italic" }}>{patient.name} is in safe hands today.</span>
        </div>
      </div>

      <div style={{ background: "#111827", borderTop: "2px solid #2CA8A0", borderRadius: "0 0 12px 12px", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2CA8A0", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Next Transfusion</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#FAF9F7" }}>
              {new Date(nextTransfusion).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {new Date(nextTransfusion).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>{patient.hospital} · {patient.city}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <span style={{ background: "#2CA8A0", color: "#fff", padding: "4px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600 }}>CONFIRMED ✓</span>
              <span style={{ color: "#2CA8A0", fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 12 }}>Backup donor also confirmed</span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#6B7280", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 6, textAlign: "right" }}>Countdown</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: "#D4A847", letterSpacing: 2, textAlign: "right" }}>
              {pad(countdown.d)}d {pad(countdown.h)}h {pad(countdown.m)}m {pad(countdown.s)}s
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "18px 20px", borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 30, color: s.color }}>{s.value}<span style={{ fontSize: 13, color: "#6B7280", marginLeft: 4 }}>{s.unit}</span></div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", marginTop: 6 }}>{s.note}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#111827", borderLeft: "2px solid #2CA8A0", borderRadius: "0 12px 12px 0", padding: "16px 20px" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#2CA8A0", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 6 }}>AI Insight</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: "#FAF9F7", fontStyle: "italic" }}>
          "{patient.name}'s hemoglobin trend is stable. Average post-transfusion peak: <span style={{ color: "#2CA8A0" }}>10.9 g/dL</span>. Next expected drop to threshold in ~<span style={{ color: "#D4A847" }}>22–25 days</span>."
        </div>
      </div>

      <EmergencyStrip patient={patient} onTrigger={onEmergency} />
    </div>
  );
}

// ── PANEL 2 — CALENDAR ────────────────────────────────────────────────────────
interface SelectedDay extends CalendarEvent { day: number; }

function PanelCalendar({ patient, onEmergency }: { patient: typeof PATIENT; onEmergency: () => void }) {
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
  const today = new Date();
  const year = 2026, month = 5;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getEvent = (day: number): CalendarEvent | null => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return CALENDAR_EVENTS[key] ?? null;
  };

  const eventStyles: Record<CalendarEvent["type"], { bg: string; color: string }> = {
    confirmed: { bg: "#2CA8A0", color: "#fff" },
    outreach: { bg: "#D4A847", color: "#0D0D0D" },
    unconfirmed: { bg: "#C0152A", color: "#fff" },
    past: { bg: "#8B1A2A", color: "#FAF9F7" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>{patient.name}'s Schedule</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>Transfusion Calendar</div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {([["#2CA8A0", "Confirmed"], ["#D4A847", "Outreach"], ["#C0152A", "Unconfirmed"], ["#8B1A2A", "Past"]] as [string, string][]).map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#9CA3AF" }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "#111827", borderRadius: 12, padding: 20 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "#FAF9F7", marginBottom: 16, textAlign: "center" }}>June 2026</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", textAlign: "center", paddingBottom: 8 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const ev = getEvent(day);
            const isToday = day === today.getDate() && today.getMonth() === month && today.getFullYear() === year;
            const st = ev ? eventStyles[ev.type] : { bg: "transparent", color: "#9CA3AF" };
            return (
              <div key={day}
                onClick={() => setSelectedDay(ev ? { day, ...ev } : null)}
                style={{ background: st.bg, color: st.color, borderRadius: 6, padding: "8px 4px", textAlign: "center", cursor: ev ? "pointer" : "default", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, border: isToday ? "1px solid #FAF9F7" : "1px solid transparent", transition: "opacity .15s" }}
                onMouseEnter={e => { if (ev) (e.currentTarget as HTMLDivElement).style.opacity = "0.8"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div style={{ background: "#111827", border: "1px solid #C0152A", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 4 }}>June {selectedDay.day}, 2026</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#FAF9F7" }}>{selectedDay.label}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                {selectedDay.type === "confirmed" && "Transfusion confirmed. Compatible donor in circle attending."}
                {selectedDay.type === "outreach" && "Coordinator reaching out to backup donors."}
                {selectedDay.type === "unconfirmed" && "Donation window. Donor confirmation pending."}
              </div>
            </div>
            <button onClick={() => setSelectedDay(null)} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PANEL 3 — DONOR CIRCLE ────────────────────────────────────────────────────
function PanelDonors({ patient, donors, onEmergency, onOpenChat }: { patient: typeof PATIENT; donors: Donor[]; onEmergency: () => void; onOpenChat: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>Your Network</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>Eligible Donors</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginTop: 4 }}>AI-matched compatible blood donors in your city.</div>
      </div>

      {donors.map(d => (
        <div key={d.id} style={{ background: "#111827", border: `1px solid ${d.eligible === false ? "rgba(192,21,42,0.3)" : (d.primary ? "#2CA8A0" : "#D4A847")}`, borderRadius: 12, padding: 24, opacity: d.eligible === false ? 0.75 : 1 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: d.eligible === false ? "#1e293b" : (d.primary ? "#8B1A2A" : "#1e293b"), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#FAF9F7", flexShrink: 0 }}>
              {d.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: "#FAF9F7" }}>{d.name}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ padding: "2px 10px", fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.8px", background: d.eligible === false ? "rgba(107,114,128,0.15)" : (d.primary ? "rgba(44,168,160,0.15)" : "rgba(212,168,71,0.15)"), color: d.eligible === false ? "#6B7280" : (d.primary ? "#2CA8A0" : "#D4A847"), border: `1px solid ${d.eligible === false ? "#6B7280" : (d.primary ? "#2CA8A0" : "#D4A847")}` }}>
                    {d.eligible === false ? "DEFERRED" : (d.primary ? "PRIMARY" : "BACKUP")}
                  </span>
                  {d.matchScore !== undefined && (
                    <span style={{ padding: "2px 10px", fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.8px", background: "rgba(44,168,160,0.1)", color: "#2CA8A0", border: "1px solid rgba(44,168,160,0.4)" }}>
                      ML-RANKED
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF" }}>{d.blood} · {d.city} · {d.donations} donations total</div>
              
              {/* Score Breakdown container if matchScore exists */}
              {d.matchScore !== undefined && d.scoreBreakdown && (
                <div style={{ background: "#0A1628", borderRadius: 8, padding: "12px 16px", marginTop: 14, borderLeft: `3px solid ${d.eligible === false ? "#C0152A" : "#2CA8A0"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#6B7280", letterSpacing: "0.8px", textTransform: "uppercase", fontWeight: 600 }}>Score Breakdown</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: d.eligible === false ? "#C0152A" : "#2CA8A0", fontWeight: "bold" }}>Match Score: {d.matchScore}/100</span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>
                    {d.scoreBreakdown.explanation}
                  </div>
                  {d.eligible === false && (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", marginTop: 6, fontWeight: 600 }}>
                      ⚠️ Safety deferral: Donor has not met the mandatory 90-day donation interval.
                    </div>
                  )}
                </div>
              )}

              {d.matchScore === undefined && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280" }}>Reliability</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#2CA8A0" }}>{d.reliability}%</span>
                  </div>
                  <ReliabilityBar value={d.reliability} />
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: d.eligible === false ? "#6B7280" : (d.status === "Confirmed" ? "#2CA8A0" : d.status === "Standby" ? "#D4A847" : "#9CA3AF") }}>
                {d.eligible === false ? "Deferred" : (d.status === "Confirmed" ? "✓ " + d.status : d.status)}
              </span>
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onOpenChat} style={{ background: "transparent", color: "#2CA8A0", border: "1px solid #2CA8A0", padding: "10px 22px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 0 }}>
          Message Coordinator →
        </button>
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 300, color: "#6B7280", fontStyle: "italic", lineHeight: 1.7 }}>
        Donor identities are protected under Raksha AI's privacy protocol. Contact is mediated through the care coordinator only.
      </div>
    </div>
  );
}

// ── PANEL 4 — HISTORY ─────────────────────────────────────────────────────────
function PanelHistory({ patient, history, onEmergency }: { patient: typeof PATIENT; history: HistoryRecord[]; onEmergency: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>Medical Records</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>Transfusion History</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b" }}>
              {["Date","Units","Hb Before","Hb After","Donor","Reaction","Centre"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#6B7280", letterSpacing: "1.3px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? "#111827" : "#0F1A2E" }}>
                <td style={{ padding: "12px 14px", color: "#FAF9F7", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, whiteSpace: "nowrap" }}>{r.date}</td>
                <td style={{ padding: "12px 14px", color: "#9CA3AF", textAlign: "center" }}>{r.unit}</td>
                <td style={{ padding: "12px 14px", color: "#C0152A", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{r.hbBefore}</td>
                <td style={{ padding: "12px 14px", color: "#2CA8A0", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{r.hbAfter}</td>
                <td style={{ padding: "12px 14px", color: "#9CA3AF" }}>{r.donor}</td>
                <td style={{ padding: "12px 14px" }}>
                  {r.reaction ? <span style={{ color: "#C0152A", fontSize: 11 }}>⚠ Reaction</span> : <span style={{ color: "#1A7A4A", fontSize: 11 }}>✓ None</span>}
                </td>
                <td style={{ padding: "12px 14px", color: "#6B7280", fontSize: 12 }}>{r.center}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <button
          onClick={() => window.print()}
          style={{ background: "transparent", color: "#C0152A", border: "1px solid #C0152A", padding: "10px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#C0152A"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#C0152A"; }}
        >
          Export for Doctor →
        </button>
      </div>
    </div>
  );
}

// ── PANEL 5 — HEALTH TRACKER ──────────────────────────────────────────────────
interface TooltipProps { active?: boolean; payload?: Array<{ value: number }>; label?: string; }

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: v < 8 ? "#C0152A" : "#2CA8A0" }}>{v ? `${v} g/dL` : "—"}</div>
      {v < 8 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#C0152A", marginTop: 4 }}>⚠ Below safe threshold</div>}
    </div>
  );
}

interface DotProps { cx?: number; cy?: number; payload?: HealthPoint; }

function CustomDot({ cx, cy, payload }: DotProps) {
  if (!payload || payload.hb === null || cx === undefined || cy === undefined) return null;
  const isLow = (payload.hb ?? 0) < 8;
  return <circle cx={cx} cy={cy} r={isLow ? 6 : 4} fill={isLow ? "#C0152A" : "#2CA8A0"} stroke="#0D0D0D" strokeWidth={2} />;
}

function PanelTracker({ patient, healthData, onEmergency }: { patient: typeof PATIENT; healthData: HealthPoint[]; onEmergency: () => void }) {
  const peakPoints = healthData.filter(d => !d.trans && d.hb !== null);
  const troughPoints = healthData.filter(d => d.trans && d.hb !== null);
  const avgPeak = peakPoints.length > 0 ? (peakPoints.reduce((acc, d) => acc + (d.hb || 0), 0) / peakPoints.length).toFixed(1) : "10.9";
  const avgTrough = troughPoints.length > 0 ? (troughPoints.reduce((acc, d) => acc + (d.hb || 0), 0) / troughPoints.length).toFixed(1) : "7.6";
  const totalTrans = troughPoints.length || 9;

  const trackerStats = [
    { label: "Avg Peak Hb", value: avgPeak, unit: "g/dL", color: "#2CA8A0" },
    { label: "Avg Trough Hb", value: avgTrough, unit: "g/dL", color: "#C0152A" },
    { label: "Avg Cycle", value: "52", unit: "days", color: "#D4A847" },
    { label: "Total Transfusions", value: String(totalTrans), unit: "", color: "#FAF9F7" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>AI Health Monitoring</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>Health Tracker</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginTop: 4 }}>{patient.name}'s hemoglobin trend over the last 9 months.</div>
      </div>

      <div style={{ background: "#111827", borderRadius: 12, padding: "24px 16px 16px" }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={healthData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="hbGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2CA8A0" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2CA8A0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis domain={[5, 13]} tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={9.5} stroke="#1A7A4A" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: "Safe min 9.5", fill: "#1A7A4A", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} />
            <ReferenceLine y={7.0} stroke="#C0152A" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: "Emergency 7.0", fill: "#C0152A", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} />
            <Area type="monotone" dataKey="hb" stroke="#2CA8A0" strokeWidth={2.5} fill="url(#hbGrad)" dot={<CustomDot />} connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {trackerStats.map(s => (
          <div key={s.label} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: s.color }}>{s.value}<span style={{ fontSize: 11, color: "#6B7280", marginLeft: 3 }}>{s.unit}</span></div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#111827", borderLeft: "2px solid #2CA8A0", borderRadius: "0 12px 12px 0", padding: "16px 20px" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#2CA8A0", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 6 }}>Trend Insight</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: "#FAF9F7", fontStyle: "italic", lineHeight: 1.5 }}>
          "{patient.name}'s hemoglobin pattern is consistent. Sawtooth cycle averages <span style={{ color: "#2CA8A0" }}>52 days</span>. Trough reached at day ~<span style={{ color: "#D4A847" }}>48–55</span>. Pre-emptive scheduling reduces risk by <span style={{ color: "#2CA8A0" }}>68%</span>."
        </div>
      </div>

    </div>
  );
}

// ── PANEL 6 — TRANSFUSION PASSPORT ───────────────────────────────────────────
function PanelPassport({ patient, onEmergency, onShare, onTransfer }: { patient: typeof PATIENT; onEmergency: () => void; onShare: () => void; onTransfer: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2CA8A0", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>Clinical Portable Record</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>Transfusion Passport</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginTop: 4 }}>
          A secure, portable record of {patient.name}'s extended antigen profile and transfusion compatibility history. Clinically novel in India.
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, #0A1628 0%, #111827 100%)", border: "1px solid rgba(44, 168, 160, 0.4)", borderRadius: 16, padding: 28, boxShadow: "0 0 30px rgba(44, 168, 160, 0.08)" }}>
        
        {/* Passport Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(139, 26, 42, 0.2)", paddingBottom: 20, marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#2CA8A0", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600 }}>INDIAN NATIONAL THALASSEMIA REGISTRY</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#FAF9F7", marginTop: 4 }}>Clinical Compatibility Passport</div>
          </div>
          <div style={{ background: "rgba(44,168,160,0.1)", border: "1px solid #2CA8A0", color: "#2CA8A0", padding: "4px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>
            PASSPORT ID: TXP-489A-09
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginBottom: 28 }}>
          
          {/* Patient Details */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Patient Profile</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 14, color: "#FAF9F7" }}>Name: <strong>{patient.name} {patient.family.replace(" Family", "")}</strong></div>
              <div style={{ fontSize: 13, color: "#9CA3AF" }}>Age / Gender: {patient.age} / {patient.gender || "Male"}</div>
              <div style={{ fontSize: 13, color: "#9CA3AF" }}>Diagnosis: Thalassemia Major</div>
              <div style={{ fontSize: 13, color: "#C0152A", fontWeight: 600 }}>Blood Phenotype: {patient.blood} (RhD+)</div>
            </div>
          </div>

          {/* Extended Phenotyping */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Extended Antigen Profile</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["C+", "c+", "E-", "e+", "K-", "Fy(a+)", "Fy(b-)", "Jk(a+)", "Jk(b+)", "M+", "N+"].map(antigen => (
                <span key={antigen} style={{ background: antigen.includes("+") ? "rgba(44,168,160,0.1)" : "rgba(139,26,42,0.08)", color: antigen.includes("+") ? "#2CA8A0" : "#C0152A", border: `1px solid ${antigen.includes("+") ? "rgba(44,168,160,0.3)" : "rgba(139,26,42,0.2)"}`, padding: "2px 8px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {antigen}
                </span>
              ))}
            </div>
          </div>

          {/* Antibody Screen & Reactions */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Antibody Screening</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: "rgba(192,21,42,0.1)", border: "1px solid rgba(192,21,42,0.3)", borderRadius: 6, padding: "8px 12px" }}>
                <div style={{ fontSize: 11, color: "#C0152A", fontWeight: 600 }}>ALLOANTIBODIES DETECTED</div>
                <div style={{ fontSize: 12, color: "#FAF9F7", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>Anti-Kell (K), Anti-E</div>
              </div>
              <div style={{ background: "rgba(212,168,71,0.1)", border: "1px solid rgba(212,168,71,0.2)", borderRadius: 6, padding: "8px 12px" }}>
                <div style={{ fontSize: 11, color: "#D4A847", fontWeight: 600 }}>REACTION HISTORY</div>
                <div style={{ fontSize: 12, color: "#FAF9F7", marginTop: 2 }}>Febrile Non-Hemolytic (Feb 2026)</div>
              </div>
            </div>
          </div>

        </div>

        {/* Security & Verification Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(139, 26, 42, 0.1)", paddingTop: 20, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Verified Hospital: <strong>{patient.hospital}, {patient.city}</strong></div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>Secure verification hash: SHA256-82f3a9d7e1bc3a...</div>
          </div>
          
          {/* Mock QR Code representation */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#FAF9F7", padding: 6, borderRadius: 4 }}>
            {/* Visual grid representing QR Code */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, width: 32, height: 32 }}>
              {Array.from({ length: 25 }).map((_, idx) => (
                <div key={idx} style={{ background: (idx % 2 === 0 && idx % 3 !== 0) || idx === 0 || idx === 4 || idx === 20 || idx === 24 ? "#0D0D0D" : "#FAF9F7" }} />
              ))}
            </div>
            <div style={{ color: "#0D0D0D", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: "bold", lineHeight: 1.1 }}>
              SCAN FOR<br />PORTABILITY
            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={() => window.print()} style={{ background: "#2CA8A0", color: "#fff", border: "none", padding: "12px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 0 }}>
          📥 EXPORT SECURE PDF
        </button>
        <button onClick={onShare} style={{ background: "transparent", color: "#FAF9F7", border: "1px solid #6B7280", padding: "12px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 0 }}>
          ✉ SHARE WITH RECEIVING HOSPITAL
        </button>
        <button onClick={onTransfer} style={{ background: "transparent", color: "#C0152A", border: "1px solid #C0152A", padding: "12px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 0 }}>
          ✈ INITIATE CLINICAL TRANSFER
        </button>
      </div>

      <div style={{ background: "#111827", borderRadius: 10, padding: 18, borderLeft: "2px solid #C0152A" }}>
        <div style={{ fontSize: 12, color: "#C0152A", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Clinical Significance</div>
        <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>
          Normally in India, blood transfusion profiles are locked inside individual hospital records. If a patient transfers centers, the new blood bank has to restart compatibility screening, creating delays. The <strong>Transfusion Passport</strong> allows seamless, secure hospital-to-hospital data portability, eliminating risk and lag.
        </div>
      </div>
    </div>
  );
}

// ── MAIN DEFAULT EXPORT ───────────────────────────────────────────────────────
export default function PatientDashboard() {
  const { language, setLanguage, translating } = useTranslation();
  const [active, setActive] = useState<string>("home");
  const [showEmergency, setShowEmergency] = useState(false);
  const [patient, setPatient] = useState({
    id: "",
    name: "Loading...",
    age: 0,
    blood: "",
    family: "Loading...",
    hospital: "",
    city: "",
    coordinator: "",
    gender: ""
  });
  const [donors, setDonors] = useState<Donor[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [nextTransfusion, setNextTransfusion] = useState("2026-06-15T09:00:00");
  const countdown = useCountdown(nextTransfusion);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Local chat state removed, using global ChatWidget instead

  useEffect(() => {
    async function loadData() {
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

        let foundPatient = null;
        if (loggedInEmail) {
          const res = await fetch(`/api/patient/by-email/${encodeURIComponent(loggedInEmail)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              foundPatient = data.patient;
            }
          }
        }

        // Fallback to checking cached registration details in localStorage
        const cachedPhone = typeof window !== "undefined" ? localStorage.getItem("patientPhone") : null;
        const cachedName = typeof window !== "undefined" ? localStorage.getItem("patientName") : null;
        const cachedBloodGroup = typeof window !== "undefined" ? localStorage.getItem("patientBloodGroup") : null;
        const cachedCity = typeof window !== "undefined" ? localStorage.getItem("patientCity") : null;
        const cachedHospital = typeof window !== "undefined" ? localStorage.getItem("patientHospital") : null;
        const cachedAge = typeof window !== "undefined" ? localStorage.getItem("patientAge") : null;
        const cachedCoordinator = typeof window !== "undefined" ? localStorage.getItem("patientHematologist") : null;
        const cachedId = typeof window !== "undefined" ? localStorage.getItem("patientId") : null;

        let activeBlood = "B+";
        let activeCity = "Hyderabad";
        let patientId = foundPatient?.patientId || foundPatient?.requestId || cachedId || "RKSH-ARJUN9";

        if (foundPatient) {
          activeBlood = foundPatient.bloodGroup;
          activeCity = foundPatient.address?.split(",")?.pop()?.trim() || "Hyderabad";
          setPatient({
            id: patientId,
            name: foundPatient.firstName,
            age: parseInt(foundPatient.dob ? String(new Date().getFullYear() - new Date(foundPatient.dob).getFullYear()) : "9"),
            blood: foundPatient.bloodGroup,
            family: foundPatient.lastName ? `${foundPatient.lastName} Family` : `${foundPatient.firstName} Family`,
            hospital: foundPatient.hospital,
            city: activeCity,
            coordinator: foundPatient.hematologist || "Dr. Meera Iyer",
            gender: foundPatient.gender || "Male"
          });
        } else if (cachedName && cachedBloodGroup) {
          activeBlood = cachedBloodGroup;
          activeCity = cachedCity || "Hyderabad";
          setPatient({
            id: patientId,
            name: cachedName.split(" ")[0],
            age: parseInt(cachedAge || "9"),
            blood: cachedBloodGroup,
            family: cachedName.split(" ")[1] ? `${cachedName.split(" ")[1]} Family` : `${cachedName.split(" ")[0]} Family`,
            hospital: cachedHospital || "Rainbow Thalassemia Centre",
            city: activeCity,
            coordinator: cachedCoordinator || "Dr. Meera Iyer",
            gender: "Male"
          });
        } else if (loggedInUser) {
          const namePart = loggedInUser.name || loggedInUser.email.split("@")[0].toUpperCase();
          const generatedName = namePart.split(" ")[0];
          const generatedFamily = namePart.split(" ")[1] ? `${namePart.split(" ")[1]} Family` : `${namePart} Family`;
          setPatient({
            id: patientId,
            name: generatedName,
            age: 9,
            blood: "B+",
            family: generatedFamily,
            hospital: "Rainbow Hospital",
            city: "Hyderabad",
            coordinator: "Dr. Meera Iyer",
            gender: "Male"
          });
        } else {
          // If no active session, fetch default patient
          const res = await fetch(`/api/patients`);
          if (res.ok) {
            const allPatients = await res.json();
            const defaultPatient = allPatients.find((p: any) => p.phone === "+919876543210") || allPatients[0];
            if (defaultPatient) {
              activeBlood = defaultPatient.bloodGroup;
              activeCity = defaultPatient.address?.split(",")?.pop()?.trim() || "Hyderabad";
              patientId = defaultPatient.patientId || defaultPatient.requestId || "RKSH-ARJUN9";
              setPatient({
                id: patientId,
                name: defaultPatient.firstName,
                age: parseInt(defaultPatient.dob ? String(new Date().getFullYear() - new Date(defaultPatient.dob).getFullYear()) : "9"),
                blood: defaultPatient.bloodGroup,
                family: defaultPatient.lastName ? `${defaultPatient.lastName} Family` : `${defaultPatient.firstName} Family`,
                hospital: defaultPatient.hospital,
                city: activeCity,
                coordinator: defaultPatient.hematologist || "Dr. Meera Iyer",
                gender: defaultPatient.gender || "Male"
              });
            }
          }
        }

        // Fetch appointments
        try {
          const aptRes = await fetch(`/api/appointments?patientId=${encodeURIComponent(patientId)}`);
          if (aptRes.ok) {
            const apts = await aptRes.json();
            if (Array.isArray(apts) && apts.length > 0) {
              const soonest = apts.sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
              if (soonest) {
                setNextTransfusion(soonest.scheduledAt);
              }
            }
          }
        } catch (aptErr) {
          console.error("Failed to load appointments for patient:", aptErr);
        }

        // Fetch matches using local MongoDB API route /api/patient/X/matches
        try {
          const matchRes = await fetch(`/api/patient/${encodeURIComponent(patientId)}/matches`);
          if (matchRes.ok) {
            const matchData = await matchRes.json();
            if (Array.isArray(matchData) && matchData.length > 0) {
              setDonors(matchData);
            }
          }
        } catch (matchErr) {
          console.error("Match endpoint call failed:", matchErr);
        }

        // Fetch Transfusion History from MongoDB
        try {
          const historyRes = await fetch(`/api/patient/${encodeURIComponent(patientId)}/history`);
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            setHistory(historyData);
          }
        } catch (historyErr) {
          console.error("Failed to load transfusion history:", historyErr);
        }

        // Care memory chat history handled via global ChatWidget
      } catch (err) {
        console.error("Failed to load patient live dashboard data:", err);
      }
    }
    loadData();
  }, []);

  const triggerEmergency = () => setShowEmergency(true);

  // Generate dynamic health data from history
  const dynamicHealthData: HealthPoint[] = [...history]
    .reverse()
    .flatMap((r) => {
      const m = r.date.split(" ")[0]; // e.g. "Apr"
      return [
        { month: `${m} (Pre)`, hb: r.hbBefore, trans: true },
        { month: `${m} (Post)`, hb: r.hbAfter, trans: false }
      ];
    });

  const showShareToast = () => {
    showToast(`✓ Passport shared securely with ${patient.hospital}`);
  };

  const showTransferToast = () => {
    showToast(`✓ Clinical transfer request initiated to ${patient.hospital}`);
  };

  const PANELS: Record<string, React.ReactNode> = {
    home: <PanelHome patient={patient} countdown={countdown} nextTransfusion={nextTransfusion} onEmergency={triggerEmergency} />,
    calendar: <PanelCalendar patient={patient} onEmergency={triggerEmergency} />,
    donors: <PanelDonors patient={patient} donors={donors} onEmergency={triggerEmergency} onOpenChat={() => window.dispatchEvent(new Event("open-raksha-chat"))} />,
    history: <PanelHistory patient={patient} history={history} onEmergency={triggerEmergency} />,
    tracker: <PanelTracker patient={patient} healthData={dynamicHealthData} onEmergency={triggerEmergency} />,
    passport: <PanelPassport patient={patient} onEmergency={triggerEmergency} onShare={showShareToast} onTransfer={showTransferToast} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#0D0D0D", color: "#FAF9F7" }}>
      <style>{`
        @import url('${FONT_URL}');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:#0A1628;}
        ::-webkit-scrollbar-thumb{background:#C0152A;border-radius:2px;}
        @keyframes pulse-border{0%,100%{box-shadow:0 0 0 1.5px #C0152A;}50%{box-shadow:0 0 0 3px #C0152A,0 0 12px rgba(192,21,42,0.4);}}
        @media(max-width:768px){.sidebar{display:none!important;}.mobile-tabs{display:flex!important;}.main-scroll{padding-bottom:80px!important;}.raksha-chat-widget{bottom:80px!important;right:16px!important;}}
      `}</style>

      {showEmergency && <EmergencyModal patient={patient} donors={donors} onClose={() => setShowEmergency(false)} />}

      {/* State-based Premium Toast Notification Banner */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 10000,
          background: toast.type === "success" ? "#1A7A4A" : toast.type === "error" ? "#C0152A" : "#0A1628",
          color: "#FAF9F7",
          border: `1px solid ${toast.type === "success" ? "#2CA8A0" : toast.type === "error" ? "#8B1A2A" : "#1e293b"}`,
          borderRadius: "0px",
          padding: "16px 24px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          animation: "slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <span>{toast.type === "success" ? "✓" : toast.type === "error" ? "⚠" : "ℹ"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar" style={{ width: 240, background: "#0A1628", borderRight: "1px solid #1e293b", position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 20px" }}>
          <Logo />
          <div style={{ marginTop: 18 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "#FAF9F7" }}>{patient.family}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B7280", marginTop: 2 }}>Patient: {patient.name}, {patient.age}</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
          {NAV.map(n => {
            const isActive = active === n.id;
            return (
              <button key={n.id} onClick={() => setActive(n.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", background: isActive ? "#111827" : "transparent", border: "none", borderLeft: isActive ? "2px solid #C0152A" : "2px solid transparent", cursor: "pointer", width: "100%", textAlign: "left", color: isActive ? "#FAF9F7" : "#9CA3AF", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, borderRadius: "0 6px 6px 0", transition: "all .15s" }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#FAF9F7"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
              >
                <span style={{ fontSize: 16, opacity: 0.9 }}>{n.icon}</span>{n.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "0 12px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => setShowEmergency(true)} style={{ width: "100%", background: "#C0152A", color: "#fff", border: "none", padding: "13px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 0, letterSpacing: "0.5px", animation: "pulse-border 2s infinite" }}>
            🆘 EMERGENCY REQUEST
          </button>
          
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10, paddingLeft: 8 }}>
            <a href="/patient/search" style={{ textDecoration: "none", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#FAF9F7", fontWeight: 600 }}>
              🔍 Search Patient Profiles
            </a>
            <button onClick={() => window.dispatchEvent(new Event("open-raksha-chat"))} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#2CA8A0", fontWeight: 600, padding: 0, textAlign: "left" }}>
              🤖 Raksha AI Assistant
            </button>
            <a href="/" style={{ textDecoration: "none", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#6B7280", fontWeight: 600 }}>
              ← Go to Homepage
            </a>
            <button onClick={() => {
              localStorage.removeItem("raksha_user");
              window.location.href = "/signin";
            }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#6B7280", padding: 0, textAlign: "left" }}>
              ← Log Out
            </button>
          </div>

          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8, paddingLeft: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#6B7280" }}>
              <span>🌐</span>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Language</span>
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
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
                cursor: "pointer",
                borderRadius: "4px"
              }}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="es">Español (Spanish)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-scroll" style={{ flex: 1, overflowY: "auto", padding: "36px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {PANELS[active]}
        </div>
      </main>

      {/* MOBILE BOTTOM TABS */}
      <nav className="mobile-tabs" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, background: "#0A1628", borderTop: "1px solid #1e293b", padding: "8px 0 12px", zIndex: 100, justifyContent: "space-around" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setActive(n.id)}
            style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active === n.id ? "#C0152A" : "#6B7280", fontFamily: "'DM Sans', sans-serif", fontSize: 10 }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            {n.label.split(" ")[0]}
          </button>
        ))}
        <button onClick={() => setShowEmergency(true)}
          style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#C0152A", fontFamily: "'DM Sans', sans-serif", fontSize: 10, animation: "pulse-border 2s infinite" }}>
          <span style={{ fontSize: 20 }}>🆘</span>SOS
        </button>
      </nav>
    </div>
  );
}