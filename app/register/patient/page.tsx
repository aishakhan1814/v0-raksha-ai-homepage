"use client";

import { useState, useEffect } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Area, AreaChart,
} from "recharts";

// ── FONT ──────────────────────────────────────────────────────────────────────
const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface Countdown { d: number; h: number; m: number; s: number }
type EventType = "confirmed" | "outreach" | "unconfirmed" | "past";
interface CalendarEvent { type: EventType; label: string }
interface SelectedDay extends CalendarEvent { day: number }
interface Donor {
  id: number; initials: string; name: string; blood: string;
  reliability: number; donations: number; status: string;
  primary: boolean; city: string;
}
interface HistoryRow {
  id: number; date: string; unit: number; hbBefore: number;
  hbAfter: number; donor: string; reaction: boolean; center: string;
}
interface HealthPoint { month: string; hb: number | null; trans: boolean }
interface NavItem { id: string; label: string; icon: string }

// ── HELPERS ───────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration: number = 1600, trigger: boolean = true): number {
  const [val, setVal] = useState<number>(0);
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

function useCountdown(targetDate: string): Countdown {
  const [t, setT] = useState<Countdown>({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - new Date().getTime();
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

const pad = (n: number): string => String(n).padStart(2, "0");

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const PATIENT = {
  name: "Arjun", age: 9, blood: "B+",
  family: "Sharma Family",
  hospital: "Rainbow Thalassemia Centre",
  city: "Hyderabad",
  coordinator: "Dr. Meera Iyer",
};
const NEXT_TRANSFUSION = "2026-06-15T09:00:00";

const HEALTH_DATA: HealthPoint[] = [
  { month: "Oct",      hb: 7.2,  trans: true  },
  { month: "Nov",      hb: 10.8, trans: false },
  { month: "Dec",      hb: 7.8,  trans: true  },
  { month: "Jan",      hb: 11.1, trans: false },
  { month: "Feb",      hb: 7.4,  trans: true  },
  { month: "Mar",      hb: 10.4, trans: false },
  { month: "Apr",      hb: 7.6,  trans: true  },
  { month: "May",      hb: 10.4, trans: false },
  { month: "Jun (est)", hb: null, trans: false },
];

const HISTORY: HistoryRow[] = [
  { id: 1, date: "Apr 18, 2026", unit: 2, hbBefore: 7.6,  hbAfter: 10.8, donor: "Ramesh R.",  reaction: false, center: "Rainbow TC"     },
  { id: 2, date: "Feb 10, 2026", unit: 2, hbBefore: 7.4,  hbAfter: 10.4, donor: "Ramesh R.",  reaction: false, center: "Rainbow TC"     },
  { id: 3, date: "Dec 12, 2025", unit: 2, hbBefore: 7.8,  hbAfter: 11.1, donor: "Suresh K.",  reaction: false, center: "KIMS Hospital"  },
  { id: 4, date: "Oct 5, 2025",  unit: 2, hbBefore: 7.2,  hbAfter: 10.8, donor: "Ramesh R.",  reaction: false, center: "Rainbow TC"     },
  { id: 5, date: "Aug 1, 2025",  unit: 2, hbBefore: 7.9,  hbAfter: 11.3, donor: "Anita M.",   reaction: false, center: "Niloufer Hospital" },
];

const DONORS: Donor[] = [
  { id: 1, initials: "RR", name: "Ramesh R.", blood: "O+", reliability: 97, donations: 18, status: "Confirmed", primary: true,  city: "Hyderabad"    },
  { id: 2, initials: "SK", name: "Suresh K.", blood: "B+", reliability: 84, donations: 11, status: "Standby",   primary: false, city: "Hyderabad"    },
  { id: 3, initials: "AM", name: "Anita M.",  blood: "O+", reliability: 78, donations: 7,  status: "Outreach",  primary: false, city: "Secunderabad" },
];

const CALENDAR_EVENTS: Record<string, CalendarEvent> = {
  "2026-06-15": { type: "confirmed",   label: "Transfusion" },
  "2026-06-08": { type: "outreach",    label: "Outreach"    },
  "2026-05-18": { type: "past",        label: "Past"        },
  "2026-06-22": { type: "unconfirmed", label: "Window"      },
};

const NAV: NavItem[] = [
  { id: "home",     label: "Overview",     icon: "⊞" },
  { id: "calendar", label: "Calendar",     icon: "◈" },
  { id: "donors",   label: "Donor Circle", icon: "◉" },
  { id: "history",  label: "History",      icon: "▤" },
  { id: "tracker",  label: "Health Tracker", icon: "◆" },
];

// ── LOGO ──────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg"
        width="36" height="42" style={{ flexShrink: 0 }}>
        <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
        <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z"
          fill="white" opacity="0.95" />
        <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
        <span style={{ color: "#FAF9F7" }}>Raksha</span>
        <span style={{ color: "#2CA8A0" }}>AI</span>
      </span>
    </div>
  );
}

// ── EMERGENCY MODAL ───────────────────────────────────────────────────────────
function EmergencyModal({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSend = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1800);
  };
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 1000, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "#111827", border: "1px solid #C0152A",
        borderRadius: 12, padding: 32, maxWidth: 480, width: "100%",
      }}>
        {!sent ? (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🆘</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#FAF9F7", marginBottom: 8 }}>
              Confirm Emergency Request
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9CA3AF", marginBottom: 8, lineHeight: 1.6 }}>
              This will immediately alert coordinator{" "}
              <strong style={{ color: "#FAF9F7" }}>Dr. Meera Iyer</strong>,
              all confirmed donors in Arjun&apos;s circle, and the nearest compatible blood bank.
            </div>
            <div style={{
              background: "#0A1628", borderRadius: 8, padding: "12px 16px",
              marginBottom: 20, fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, color: "#6B7280", lineHeight: 1.6,
            }}>
              Patient: <span style={{ color: "#FAF9F7" }}>Arjun Sharma, B+</span><br />
              Hospital: <span style={{ color: "#FAF9F7" }}>Rainbow Thalassemia Centre, Hyderabad</span><br />
              Trigger time:{" "}
              <span style={{ color: "#FAF9F7", fontFamily: "'JetBrains Mono', monospace" }}>
                {new Date().toLocaleTimeString("en-IN")}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={handleSend} disabled={loading} style={{
                flex: 1, background: "#C0152A", color: "#fff",
                border: "none", padding: "13px 20px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                fontWeight: 600, cursor: "pointer", borderRadius: 0,
              }}>
                {loading ? "Sending Alert…" : "CONFIRM — TRIGGER NOW"}
              </button>
              <button onClick={onClose} style={{
                background: "transparent", color: "#9CA3AF",
                border: "1px solid #6B7280", padding: "13px 20px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                cursor: "pointer", borderRadius: 0,
              }}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#2CA8A0", marginBottom: 8 }}>
              Emergency Alert Sent
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9CA3AF", lineHeight: 1.7 }}>
              Dr. Meera Iyer has been notified.<br />
              3 donors alerted. Expected response:{" "}
              <span style={{ color: "#2CA8A0", fontFamily: "'JetBrains Mono', monospace" }}>~12 minutes</span>
            </div>
            <button onClick={onClose} style={{
              marginTop: 20, background: "#2CA8A0", color: "#fff",
              border: "none", padding: "10px 28px",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              fontWeight: 600, cursor: "pointer", borderRadius: 0,
            }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── EMERGENCY STRIP ───────────────────────────────────────────────────────────
function EmergencyStrip({ onTrigger }: { onTrigger: () => void }) {
  return (
    <div style={{
      background: "rgba(192,21,42,0.12)", border: "1px solid #C0152A",
      borderRadius: 10, padding: "20px 24px", marginTop: 32,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>
            Emergency Protocol
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#FAF9F7" }}>
            Arjun&apos;s hemoglobin is critically low or you have an urgent need?
          </div>
        </div>
        <button onClick={onTrigger} style={{
          background: "#C0152A", color: "#fff", border: "none",
          padding: "12px 24px", fontFamily: "'DM Sans', sans-serif",
          fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 0,
          display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.5px",
        }}>
          🆘 TRIGGER EMERGENCY REQUEST
        </button>
      </div>
    </div>
  );
}

// ── RELIABILITY BAR ───────────────────────────────────────────────────────────
function ReliabilityBar({ value }: { value: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 400);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${w}%`, background: "#2CA8A0",
        borderRadius: 4, transition: "width 1.2s cubic-bezier(.34,1.56,.64,1)",
      }} />
    </div>
  );
}

// ── PANEL 1 — HOME ────────────────────────────────────────────────────────────
function PanelHome({ countdown, onEmergency }: { countdown: Countdown; onEmergency: () => void }) {
  const hb   = useCountUp(10.4, 1800);
  const days = useCountUp(23,   1400);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Greeting */}
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>
          Family Dashboard
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, color: "#FAF9F7", lineHeight: 1.2 }}>
          Good morning, Sharma Family.<br />
          <span style={{ color: "#9CA3AF", fontSize: 24, fontStyle: "italic" }}>Arjun is in safe hands today.</span>
        </div>
      </div>

      {/* Next transfusion card */}
      <div style={{ background: "#111827", borderTop: "2px solid #2CA8A0", borderRadius: "0 0 12px 12px", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2CA8A0", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
              Next Transfusion
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#FAF9F7" }}>
              Jun 15, 2026 · 9:00 AM
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
              Rainbow Thalassemia Centre · Hyderabad
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <span style={{ background: "#2CA8A0", color: "#fff", padding: "4px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px" }}>
                CONFIRMED ✓
              </span>
              <span style={{ color: "#2CA8A0", fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 12 }}>
                Backup donor also confirmed
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#6B7280", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 6, textAlign: "right" }}>
              Countdown
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: "#D4A847", letterSpacing: 2, textAlign: "right" }}>
              {pad(countdown.d)}d {pad(countdown.h)}h {pad(countdown.m)}m {pad(countdown.s)}s
            </div>
          </div>
        </div>
      </div>

      {/* Health snapshot */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
        {[
          { label: "Hemoglobin",     value: hb.toFixed(1),      unit: "g/dL", color: "#2CA8A0", note: "Within safe range"    },
          { label: "Days Since Last", value: String(Math.floor(days)), unit: "days", color: "#D4A847", note: "Window approaching"   },
          { label: "Window Opens",   value: "Jun 8",            unit: "",     color: "#2CA8A0", note: "Outreach triggered"   },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#111827", border: "1px solid #1e293b",
            borderRadius: 12, padding: "18px 20px",
            borderLeft: `3px solid ${s.color}`,
          }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 30, color: s.color }}>
              {s.value}
              <span style={{ fontSize: 13, color: "#6B7280", marginLeft: 4 }}>{s.unit}</span>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", marginTop: 6 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* AI Insight */}
      <div style={{ background: "#111827", borderLeft: "2px solid #2CA8A0", borderRadius: "0 12px 12px 0", padding: "16px 20px" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2CA8A0", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 6 }}>
          AI Insight
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: "#FAF9F7", fontStyle: "italic" }}>
          &ldquo;Arjun&apos;s hemoglobin trend is stable. Average post-transfusion peak:{" "}
          <span style={{ color: "#2CA8A0" }}>10.9 g/dL</span>. Next expected drop to threshold in ~
          <span style={{ color: "#D4A847" }}>22–25 days</span>.&rdquo;
        </div>
      </div>

      <EmergencyStrip onTrigger={onEmergency} />
    </div>
  );
}

// ── PANEL 2 — CALENDAR ────────────────────────────────────────────────────────
function PanelCalendar({ onEmergency }: { onEmergency: () => void }) {
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
  const year = 2026;
  const month = 5; // June (0-indexed)
  const firstDay  = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const getEvent = (day: number): CalendarEvent | null => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return CALENDAR_EVENTS[key] ?? null;
  };

  const eventBg: Record<EventType, { bg: string; color: string }> = {
    confirmed:   { bg: "#2CA8A0", color: "#fff"     },
    outreach:    { bg: "#D4A847", color: "#0D0D0D"  },
    unconfirmed: { bg: "#C0152A", color: "#fff"     },
    past:        { bg: "#8B1A2A", color: "#FAF9F7"  },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>
          Arjun&apos;s Schedule
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>
          Transfusion Calendar
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { color: "#2CA8A0", label: "Confirmed"   },
          { color: "#D4A847", label: "Outreach"    },
          { color: "#C0152A", label: "Unconfirmed" },
          { color: "#8B1A2A", label: "Past"        },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#9CA3AF" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ background: "#111827", borderRadius: 12, padding: 20 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "#FAF9F7", marginBottom: 16, textAlign: "center" }}>
          June 2026
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", textAlign: "center", paddingBottom: 8, letterSpacing: "0.5px" }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
            const ev = getEvent(day);
            const style = ev ? eventBg[ev.type] : { bg: "transparent", color: "#9CA3AF" };
            return (
              <div
                key={day}
                onClick={() => ev ? setSelectedDay({ day, ...ev }) : setSelectedDay(null)}
                style={{
                  background: style.bg, color: style.color,
                  borderRadius: 6, padding: "8px 4px", textAlign: "center",
                  cursor: ev ? "pointer" : "default",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                  border: "1px solid transparent",
                  transition: "opacity .15s",
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day popup */}
      {selectedDay && (
        <div style={{ background: "#111827", border: "1px solid #C0152A", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 4 }}>
                June {selectedDay.day}, 2026
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#FAF9F7" }}>
                {selectedDay.label}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                {selectedDay.type === "confirmed"   && "Transfusion confirmed. Ramesh R. (O+) attending."}
                {selectedDay.type === "outreach"    && "Coordinator reaching out to backup donors."}
                {selectedDay.type === "unconfirmed" && "Donation window. Donor confirmation pending."}
                {selectedDay.type === "past"        && "Past transfusion — no action needed."}
              </div>
            </div>
            <button onClick={() => setSelectedDay(null)} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
        </div>
      )}

      <EmergencyStrip onTrigger={onEmergency} />
    </div>
  );
}

// ── PANEL 3 — DONORS ──────────────────────────────────────────────────────────
function PanelDonors({ onEmergency }: { onEmergency: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>
          Your Network
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>
          Donor Circle
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginTop: 4 }}>
          AI-matched blood donors committed to Arjun&apos;s care.
        </div>
      </div>

      {DONORS.map((d) => (
        <div key={d.id} style={{
          background: "#111827",
          border: `1px solid ${d.primary ? "#2CA8A0" : "#D4A847"}`,
          borderRadius: 12, padding: 24,
        }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{
              width: 50, height: 50, borderRadius: "50%",
              background: d.primary ? "#8B1A2A" : "#1e293b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              color: "#FAF9F7", flexShrink: 0,
            }}>
              {d.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: "#FAF9F7" }}>
                  {d.name}
                </div>
                <span style={{
                  padding: "2px 10px",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.8px",
                  background: d.primary ? "rgba(44,168,160,0.15)" : "rgba(212,168,71,0.15)",
                  color:  d.primary ? "#2CA8A0" : "#D4A847",
                  border: `1px solid ${d.primary ? "#2CA8A0" : "#D4A847"}`,
                }}>
                  {d.primary ? "PRIMARY" : "BACKUP"}
                </span>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF" }}>
                {d.blood} · {d.city} · {d.donations} donations total
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280" }}>Reliability</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#2CA8A0" }}>{d.reliability}%</span>
                </div>
                <ReliabilityBar value={d.reliability} />
              </div>
            </div>
            <div>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                color: d.status === "Confirmed" ? "#2CA8A0" : d.status === "Standby" ? "#D4A847" : "#9CA3AF",
              }}>
                {d.status === "Confirmed" ? "✓ " : ""}{d.status}
              </span>
            </div>
          </div>
        </div>
      ))}

      <div>
        <button style={{
          background: "transparent", color: "#2CA8A0",
          border: "1px solid #2CA8A0", padding: "10px 22px",
          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          fontWeight: 500, cursor: "pointer", borderRadius: 0,
        }}>
          Message Coordinator →
        </button>
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 300, color: "#6B7280", fontStyle: "italic", lineHeight: 1.7 }}>
        Donor identities are protected under Raksha AI&apos;s privacy protocol. Contact is mediated through the care coordinator only.
      </div>

      <EmergencyStrip onTrigger={onEmergency} />
    </div>
  );
}

// ── PANEL 4 — HISTORY ─────────────────────────────────────────────────────────
function PanelHistory({ onEmergency }: { onEmergency: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>
          Medical Records
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>
          Transfusion History
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b" }}>
              {["Date", "Units", "Hb Before", "Hb After", "Donor", "Reaction", "Centre"].map((h) => (
                <th key={h} style={{
                  padding: "10px 14px", textAlign: "left",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                  color: "#6B7280", letterSpacing: "1.3px",
                  textTransform: "uppercase", whiteSpace: "nowrap",
                  fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? "#111827" : "#0F1A2E" }}>
                <td style={{ padding: "12px 14px", color: "#FAF9F7", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, whiteSpace: "nowrap" }}>{r.date}</td>
                <td style={{ padding: "12px 14px", color: "#9CA3AF", textAlign: "center" }}>{r.unit}</td>
                <td style={{ padding: "12px 14px", color: "#C0152A", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{r.hbBefore}</td>
                <td style={{ padding: "12px 14px", color: "#2CA8A0", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{r.hbAfter}</td>
                <td style={{ padding: "12px 14px", color: "#9CA3AF" }}>{r.donor}</td>
                <td style={{ padding: "12px 14px" }}>
                  {r.reaction
                    ? <span style={{ color: "#C0152A", fontSize: 11 }}>⚠ Reaction</span>
                    : <span style={{ color: "#1A7A4A", fontSize: 11 }}>✓ None</span>}
                </td>
                <td style={{ padding: "12px 14px", color: "#6B7280", fontSize: 12 }}>{r.center}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <button
          style={{
            background: "transparent", color: "#C0152A",
            border: "1px solid #C0152A", padding: "10px 24px",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            fontWeight: 500, cursor: "pointer", borderRadius: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#C0152A"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C0152A"; }}
        >
          Export for Doctor →
        </button>
      </div>

      <EmergencyStrip onTrigger={onEmergency} />
    </div>
  );
}

// ── CUSTOM CHART COMPONENTS ───────────────────────────────────────────────────
interface DotProps {
  cx?: number;
  cy?: number;
  payload?: HealthPoint;
}
function CustomDot({ cx = 0, cy = 0, payload }: DotProps) {
  if (!payload || payload.hb === null) return null;
  const isLow = payload.hb < 8;
  return (
    <circle
      cx={cx} cy={cy} r={isLow ? 6 : 4}
      fill={isLow ? "#C0152A" : "#2CA8A0"}
      stroke="#0D0D0D" strokeWidth={2}
    />
  );
}

interface TipProps {
  active?: boolean;
  payload?: Array<{ value: number | null }>;
  label?: string;
}
function CustomTooltip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: (v ?? 0) < 8 ? "#C0152A" : "#2CA8A0" }}>
        {v != null ? `${v} g/dL` : "—"}
      </div>
      {v != null && v < 8 && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#C0152A", marginTop: 4 }}>
          ⚠ Below safe threshold
        </div>
      )}
    </div>
  );
}

// ── PANEL 5 — HEALTH TRACKER ──────────────────────────────────────────────────
function PanelTracker({ onEmergency }: { onEmergency: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0152A", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>
          AI Health Monitoring
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#FAF9F7" }}>
          Health Tracker
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginTop: 4 }}>
          Arjun&apos;s hemoglobin trend over the last 9 months.
        </div>
      </div>

      <div style={{ background: "#111827", borderRadius: 12, padding: "24px 16px 16px" }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={HEALTH_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="hbGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2CA8A0" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2CA8A0" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: "#6B7280" }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              domain={[5, 13]}
              tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: "#6B7280" }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={9.5} stroke="#1A7A4A" strokeDasharray="5 4" strokeWidth={1.5}
              label={{ value: "Safe min 9.5", fill: "#1A7A4A", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} />
            <ReferenceLine y={7.0} stroke="#C0152A" strokeDasharray="5 4" strokeWidth={1.5}
              label={{ value: "Emergency 7.0", fill: "#C0152A", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} />
            <Area
              type="monotone" dataKey="hb"
              stroke="#2CA8A0" strokeWidth={2.5}
              fill="url(#hbGrad)"
              dot={<CustomDot />}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 12 }}>
        {[
          { label: "Avg Peak Hb",         value: "10.9", unit: "g/dL", color: "#2CA8A0" },
          { label: "Avg Trough Hb",        value: "7.6",  unit: "g/dL", color: "#C0152A" },
          { label: "Avg Cycle",            value: "52",   unit: "days", color: "#D4A847" },
          { label: "Total Transfusions",   value: "9",    unit: "",     color: "#FAF9F7" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: s.color }}>
              {s.value}
              <span style={{ fontSize: 11, color: "#6B7280", marginLeft: 3 }}>{s.unit}</span>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trend insight */}
      <div style={{ background: "#111827", borderLeft: "2px solid #2CA8A0", borderRadius: "0 12px 12px 0", padding: "16px 20px" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#2CA8A0", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 6 }}>
          Trend Insight
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: "#FAF9F7", fontStyle: "italic", lineHeight: 1.5 }}>
          &ldquo;Arjun&apos;s hemoglobin pattern is consistent. Sawtooth cycle averages{" "}
          <span style={{ color: "#2CA8A0" }}>52 days</span>. Trough reached at day ~
          <span style={{ color: "#D4A847" }}>48–55</span>. Pre-emptive scheduling reduces risk by{" "}
          <span style={{ color: "#2CA8A0" }}>68%</span>.&rdquo;
        </div>
      </div>

      <EmergencyStrip onTrigger={onEmergency} />
    </div>
  );
}

// ── PAGE ROOT ─────────────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const [active, setActive] = useState<string>("home");
  const [showEmergency, setShowEmergency] = useState(false);
  const countdown = useCountdown(NEXT_TRANSFUSION);

  const openEmergency = () => setShowEmergency(true);
  const closeEmergency = () => setShowEmergency(false);

  const panels: Record<string, React.ReactNode> = {
    home:     <PanelHome     countdown={countdown}  onEmergency={openEmergency} />,
    calendar: <PanelCalendar                        onEmergency={openEmergency} />,
    donors:   <PanelDonors                          onEmergency={openEmergency} />,
    history:  <PanelHistory                         onEmergency={openEmergency} />,
    tracker:  <PanelTracker                         onEmergency={openEmergency} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#0D0D0D", color: "#FAF9F7" }}>
      <style>{`
        @import url('${FONT_URL}');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A1628; }
        ::-webkit-scrollbar-thumb { background: #C0152A; border-radius: 2px; }
        @keyframes pulse-border {
          0%,100% { box-shadow: 0 0 0 1.5px #C0152A; }
          50%      { box-shadow: 0 0 0 3px #C0152A, 0 0 12px rgba(192,21,42,0.4); }
        }
        @media (max-width: 768px) {
          .sidebar    { display: none !important; }
          .mob-tabs   { display: flex !important; }
          .main-scroll { padding-bottom: 80px !important; }
        }
      `}</style>

      {showEmergency && <EmergencyModal onClose={closeEmergency} />}

      {/* ── SIDEBAR ── */}
      <aside className="sidebar" style={{
        width: 240, background: "#0A1628",
        borderRight: "1px solid #1e293b",
        position: "sticky", top: 0, height: "100vh",
        display: "flex", flexDirection: "column",
        padding: "24px 0", flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px 20px" }}>
          <Logo />
          <div style={{ marginTop: 18 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "#FAF9F7" }}>
              {PATIENT.family}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B7280", marginTop: 2 }}>
              Patient: {PATIENT.name}, {PATIENT.age}
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
          {NAV.map((n) => {
            const isActive = active === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setActive(n.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 12px",
                  background: isActive ? "#111827" : "transparent",
                  border: "none",
                  borderLeft: isActive ? "2px solid #C0152A" : "2px solid transparent",
                  cursor: "pointer", width: "100%", textAlign: "left",
                  color: isActive ? "#FAF9F7" : "#9CA3AF",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                  borderRadius: "0 6px 6px 0", transition: "all .15s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#FAF9F7"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#9CA3AF"; }}
              >
                <span style={{ fontSize: 16, opacity: 0.9 }}>{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </nav>

        {/* Emergency pinned button */}
        <div style={{ padding: "0 12px 20px" }}>
          <button
            onClick={openEmergency}
            style={{
              width: "100%", background: "#C0152A", color: "#fff",
              border: "none", padding: "13px 14px",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
              cursor: "pointer", borderRadius: 0, letterSpacing: "0.5px",
              animation: "pulse-border 2s infinite",
            }}
          >
            🆘 EMERGENCY REQUEST
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-scroll" style={{ flex: 1, overflowY: "auto", padding: "36px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {panels[active]}
        </div>
      </main>

      {/* ── MOBILE BOTTOM TABS ── */}
      <nav className="mob-tabs" style={{
        display: "none", position: "fixed",
        bottom: 0, left: 0, right: 0,
        background: "#0A1628", borderTop: "1px solid #1e293b",
        padding: "8px 0 12px", zIndex: 100, justifyContent: "space-around",
      }}>
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setActive(n.id)}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: active === n.id ? "#C0152A" : "#6B7280",
              fontFamily: "'DM Sans', sans-serif", fontSize: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            {n.label.split(" ")[0]}
          </button>
        ))}
        <button
          onClick={openEmergency}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            color: "#C0152A", fontFamily: "'DM Sans', sans-serif", fontSize: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>🆘</span>
          SOS
        </button>
      </nav>
    </div>
  );
}