"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── Logo SVG ───────────────────────────────────────────────
function RakshaShield({ width = 28, height = 33 }: { width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" width={width} height={height}>
      <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
      <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
      <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Types ───────────────────────────────────────────────────
type StepStatus = "pending" | "active" | "complete";

interface FormData {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  city: string;
  state: string;
  hospital: string;
  relation: string;
  phone: string;
  thalType: string;
  transfusionFreq: string;
  units: string;
  lastTransfusion: string;
  nextDue: string;
  chelation: string;
  comorbidities: string[];
  notes: string;
  notifChannels: string[];
  language: string;
  alertThreshold: string;
  altPhone: string;
  howHeard: string;
  consent: boolean;
}

// ─── Globals / CSS ───────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --raksha-crimson:    #9B2335;
    --raksha-wine:       #8B1A2A;
    --raksha-blood:      #C0152A;
    --raksha-teal:       #2CA8A0;
    --raksha-teal-light: #4CC9C1;
    --raksha-coral:      #E8897A;
    --raksha-deep:       #0D0D0D;
    --raksha-navy:       #0A1628;
    --raksha-warm:       #F5ECD7;
    --raksha-white:      #FAF9F7;
    --raksha-muted:      #6B7280;
    --raksha-gold:       #D4A847;
    --raksha-green:      #1A7A4A;
    --surface:           #111827;
    --surface-input:     #1e293b;
    --border-subtle:     rgba(139,26,42,0.3);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--raksha-deep);
    color: var(--raksha-white);
    min-height: 100vh;
    overflow-x: hidden;
  }

  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 9999; opacity: 0.35;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes shieldPulse {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(139,26,42,0.4)); }
    50%       { transform: scale(1.06); filter: drop-shadow(0 0 18px rgba(192,21,42,0.6)); }
  }

  @keyframes emergencyPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(192,21,42,0.4); }
    50%       { box-shadow: 0 0 0 6px rgba(192,21,42,0); }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  .field-input:focus, .field-select:focus, .field-textarea:focus {
    border-color: #C0152A !important;
    box-shadow: 0 0 0 3px rgba(192,21,42,0.12) !important;
    outline: none;
  }

  .checkbox-item input:checked + .checkbox-box {
    background: #2CA8A0 !important;
    border-color: #2CA8A0 !important;
  }

  .checkbox-item:hover { border-color: rgba(44,168,160,0.4) !important; }
  .radio-item:hover    { border-color: rgba(44,168,160,0.3) !important; }

  @media (max-width: 860px) {
    .main-wrapper       { grid-template-columns: 1fr !important; }
    .sidebar-col        { position: static !important; }
    .after-steps        { grid-template-columns: repeat(2,1fr) !important; }
    .after-steps-line   { display: none !important; }
    .field-row-triple   { grid-template-columns: 1fr 1fr !important; }
  }

  @media (max-width: 560px) {
    .main-wrapper       { padding: 2rem 1rem 3rem !important; }
    .field-row          { grid-template-columns: 1fr !important; }
    .field-row-triple   { grid-template-columns: 1fr !important; }
    .after-steps        { grid-template-columns: 1fr !important; }
    .step-label-text    { display: none !important; }
    .support-bar        { flex-direction: column !important; align-items: flex-start !important; }
  }
`;

// ─── Reusable field components ───────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--raksha-muted)", fontWeight: 500, marginBottom: 6 }}>
      {children}{required && <span style={{ color: "var(--raksha-blood)", marginLeft: 2 }}>*</span>}
    </div>
  );
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="field-input"
      style={{
        background: "var(--surface-input)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "var(--raksha-white)",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.9rem",
        padding: "0.7rem 0.9rem",
        borderRadius: 6,
        width: "100%",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...props.style,
      }}
    />
  );
}

function FieldSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="field-select"
      style={{
        background: "var(--surface-input)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "var(--raksha-white)",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.9rem",
        padding: "0.7rem 2rem 0.7rem 0.9rem",
        borderRadius: 6,
        width: "100%",
        cursor: "pointer",
        appearance: "none" as const,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...props.style,
      }}
    >
      {children}
    </select>
  );
}

function FieldTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="field-textarea"
      style={{
        background: "var(--surface-input)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "var(--raksha-white)",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.9rem",
        padding: "0.7rem 0.9rem",
        borderRadius: 6,
        width: "100%",
        resize: "vertical",
        minHeight: 90,
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...props.style,
      }}
    />
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "0.72rem", color: "var(--raksha-muted)", marginTop: 4, lineHeight: 1.4 }}>{children}</div>;
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column" as const }}>{children}</div>;
}

function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  const templates: Record<number, string> = { 1: "1fr", 2: "1fr 1fr", 3: "1fr 1fr 1fr" };
  const cls = cols === 3 ? "field-row field-row-triple" : cols === 1 ? "field-row" : "field-row";
  return (
    <div className={cls} style={{ display: "grid", gridTemplateColumns: templates[cols] || "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
      {children}
    </div>
  );
}

// ─── CheckboxItem ─────────────────────────────────────────────
function CheckboxItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className="checkbox-item"
      style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--surface-input)", border: "1px solid rgba(255,255,255,0.08)",
        padding: "0.5rem 0.85rem", borderRadius: 4, cursor: "pointer",
        fontSize: "0.82rem", transition: "all 0.2s", userSelect: "none" as const,
      }}
    >
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span
        className="checkbox-box"
        style={{
          width: 16, height: 16, borderRadius: 3,
          border: checked ? "1.5px solid #2CA8A0" : "1.5px solid rgba(255,255,255,0.2)",
          background: checked ? "#2CA8A0" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all 0.2s", color: "white", fontSize: 10, fontWeight: 700,
        }}
      >
        {checked ? "✓" : ""}
      </span>
      {label}
    </label>
  );
}

// ─── RadioItem ────────────────────────────────────────────────
function RadioItem({ label, name, value, checked, onChange }: { label: string; name: string; value: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className="radio-item"
      style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--surface-input)", border: "1px solid rgba(255,255,255,0.08)",
        padding: "0.5rem 0.85rem", borderRadius: 4, cursor: "pointer",
        fontSize: "0.82rem", transition: "all 0.2s",
      }}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span style={{
        width: 14, height: 14, borderRadius: "50%",
        border: checked ? "1.5px solid #2CA8A0" : "1.5px solid rgba(255,255,255,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.2s",
      }}>
        {checked && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2CA8A0", display: "block" }} />}
      </span>
      {label}
    </label>
  );
}

// ─── Main Page Component ──────────────────────────────────────
export default function PatientRegistrationPage() {
  const [formStep, setFormStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [patientId, setPatientId] = useState("");
  const afterStepsRef = useRef<HTMLDivElement>(null);
  const [afterVisible, setAfterVisible] = useState(false);

  const [data, setData] = useState<FormData>({
    firstName: "", lastName: "", dob: "", gender: "", bloodGroup: "",
    city: "", state: "", hospital: "", relation: "", phone: "",
    thalType: "", transfusionFreq: "", units: "", lastTransfusion: "", nextDue: "",
    chelation: "", comorbidities: [], notes: "",
    notifChannels: ["WhatsApp"], language: "English", alertThreshold: "All alerts (recommended)",
    altPhone: "", howHeard: "", consent: false,
  });

  // Intersection observer for after-steps
  useEffect(() => {
    const el = afterStepsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setAfterVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function toggleComorbidity(val: string) {
    setData(d => ({
      ...d,
      comorbidities: d.comorbidities.includes(val)
        ? d.comorbidities.filter(x => x !== val)
        : [...d.comorbidities, val],
    }));
  }

  function toggleNotif(val: string) {
    setData(d => ({
      ...d,
      notifChannels: d.notifChannels.includes(val)
        ? d.notifChannels.filter(x => x !== val)
        : [...d.notifChannels, val],
    }));
  }

  function validateAndNext(step: number) {
    if (step === 1) {
      if (!data.firstName.trim()) { alert("Please enter the patient's first name."); return; }
      if (!data.bloodGroup) { alert("Please select a blood group."); return; }
    }
    setFormStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack(step: number) {
    setFormStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit() {
    if (!data.consent) { alert("Please accept the consent declaration to proceed."); return; }
    const id = "RAK-2024-" + Math.floor(10000 + Math.random() * 89999);
    setPatientId(id);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Progress bar fill widths per step
  const progressFill = submitted ? "100%" : formStep === 1 ? "50%" : formStep === 2 ? "75%" : "90%";

  function stepStatus(n: number): StepStatus {
    if (submitted) return "complete";
    if (n < formStep) return "complete";
    if (n === formStep) return "active";
    return "pending";
  }

  const stepLabels = ["Verify", "Register", "Confirm"];

  // ─── Render ────────────────────────────────────────────────
  return (
    <>
      <style>{globalStyles}</style>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,22,40,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "0 2rem", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <RakshaShield />
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.35rem", color: "#FAF9F7", letterSpacing: "0.02em" }}>Raksha</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.35rem", color: "#2CA8A0" }}>AI</span>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/login" style={{ fontSize: "0.8rem", color: "var(--raksha-muted)", textDecoration: "none", letterSpacing: "0.05em" }}>Sign In</Link>
          <span style={{ fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", color: "var(--raksha-coral)", background: "rgba(232,137,122,0.1)", border: "1px solid rgba(232,137,122,0.25)", padding: "3px 10px", borderRadius: 2, letterSpacing: "0.08em" }}>PATIENT PORTAL</span>
        </div>
      </header>

      {/* ── PROGRESS BAR ── */}
      <section style={{ background: "var(--raksha-navy)", borderBottom: "1px solid var(--border-subtle)", padding: "1.5rem 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          {/* line */}
          <div style={{ position: "absolute", top: 20, left: 20, right: 20, height: 1, background: "rgba(255,255,255,0.1)", zIndex: 0 }}>
            <div style={{ height: "100%", background: "var(--raksha-teal)", width: progressFill, transition: "width 0.6s ease" }} />
          </div>
          {[1, 2, 3].map((n, i) => {
            const s = stepStatus(n);
            return (
              <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", fontWeight: 500,
                  border: "1.5px solid",
                  borderColor: s === "complete" ? "#2CA8A0" : s === "active" ? "#C0152A" : "rgba(255,255,255,0.15)",
                  background: s === "complete" ? "#2CA8A0" : s === "active" ? "#C0152A" : "var(--surface)",
                  color: s === "pending" ? "var(--raksha-muted)" : "white",
                  transition: "all 0.4s ease",
                }}>
                  {s === "complete" ? "✓" : n}
                </div>
                <div className="step-label-text" style={{
                  fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const,
                  color: s === "complete" ? "#2CA8A0" : s === "active" ? "var(--raksha-white)" : "var(--raksha-muted)",
                }}>
                  {stepLabels[i]}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MAIN GRID ── */}
      <div className="main-wrapper" style={{ maxWidth: 1180, margin: "0 auto", padding: "3rem 2rem 4rem", display: "grid", gridTemplateColumns: "1fr 340px", gap: "3rem", alignItems: "start" }}>

        {/* ── FORM COLUMN ── */}
        <div>
          {!submitted ? (
            <>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 600, color: "var(--raksha-white)", lineHeight: 1.2, marginBottom: "0.4rem" }}>
                Register your <em style={{ color: "var(--raksha-coral)", fontStyle: "italic" }}>loved one</em>
              </h1>
              <p style={{ fontSize: "0.85rem", color: "var(--raksha-muted)", marginBottom: "2.5rem", lineHeight: 1.6 }}>
                Complete the three steps below. It takes about 4 minutes. Our care coordinators review every profile within 2 hours.
              </p>

              {/* Step tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", marginBottom: "2rem" }}>
                {["01 — Patient Info", "02 — Medical Details", "03 — Care Preferences"].map((label, i) => {
                  const n = i + 1;
                  const isDone = n < formStep;
                  const isActive = n === formStep;
                  return (
                    <button
                      key={n}
                      onClick={() => { if (n < formStep) { setFormStep(n); } }}
                      style={{
                        fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" as const,
                        color: isDone ? "#2CA8A0" : isActive ? "#C0152A" : "var(--raksha-muted)",
                        padding: "0.6rem 1.2rem", border: "none", background: "none", cursor: n <= formStep ? "pointer" : "default",
                        borderBottom: isActive ? "2px solid #C0152A" : "2px solid transparent",
                        marginBottom: -1, transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* ── STEP 1 ── */}
              {formStep === 1 && (
                <div style={{ animation: "fadeUp 0.35s ease" }}>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: "0.95rem", color: "var(--raksha-coral)", marginBottom: "1.75rem", lineHeight: 1.55 }}>
                    Let&apos;s begin with who this profile is for. Your answers help us build the most accurate care and donor match for them.
                  </p>
                  <FieldRow>
                    <FieldGroup><FieldLabel required>First Name</FieldLabel><FieldInput placeholder="e.g. Arjun" value={data.firstName} onChange={e => setData(d => ({ ...d, firstName: e.target.value }))} /></FieldGroup>
                    <FieldGroup><FieldLabel>Last Name</FieldLabel><FieldInput placeholder="e.g. Sharma" value={data.lastName} onChange={e => setData(d => ({ ...d, lastName: e.target.value }))} /></FieldGroup>
                  </FieldRow>
                  <FieldRow cols={3}>
                    <FieldGroup><FieldLabel required>Date of Birth</FieldLabel><FieldInput type="date" value={data.dob} onChange={e => setData(d => ({ ...d, dob: e.target.value }))} /></FieldGroup>
                    <FieldGroup>
                      <FieldLabel>Gender</FieldLabel>
                      <FieldSelect value={data.gender} onChange={e => setData(d => ({ ...d, gender: e.target.value }))}>
                        <option value="">Select</option>
                        <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                      </FieldSelect>
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel required>Blood Group</FieldLabel>
                      <FieldSelect value={data.bloodGroup} onChange={e => setData(d => ({ ...d, bloodGroup: e.target.value }))}>
                        <option value="">Select</option>
                        <option>A+</option><option>A−</option><option>B+</option><option>B−</option>
                        <option>AB+</option><option>AB−</option><option>O+</option><option>O−</option>
                      </FieldSelect>
                    </FieldGroup>
                  </FieldRow>
                  <FieldRow>
                    <FieldGroup><FieldLabel required>City / District</FieldLabel><FieldInput placeholder="e.g. Hyderabad" value={data.city} onChange={e => setData(d => ({ ...d, city: e.target.value }))} /></FieldGroup>
                    <FieldGroup>
                      <FieldLabel required>State</FieldLabel>
                      <FieldSelect value={data.state} onChange={e => setData(d => ({ ...d, state: e.target.value }))}>
                        <option value="">Select state</option>
                        <option>Telangana</option><option>Andhra Pradesh</option><option>Maharashtra</option>
                        <option>Karnataka</option><option>Tamil Nadu</option><option>Gujarat</option>
                        <option>Delhi</option><option>West Bengal</option><option>Rajasthan</option><option>Other</option>
                      </FieldSelect>
                    </FieldGroup>
                  </FieldRow>
                  <FieldRow>
                    <FieldGroup><FieldLabel required>Registered Hospital / Centre</FieldLabel><FieldInput placeholder="Name of treating hospital" value={data.hospital} onChange={e => setData(d => ({ ...d, hospital: e.target.value }))} /></FieldGroup>
                    <FieldGroup>
                      <FieldLabel>Your Relation to Patient</FieldLabel>
                      <FieldSelect value={data.relation} onChange={e => setData(d => ({ ...d, relation: e.target.value }))}>
                        <option value="">Select</option>
                        <option>Parent</option><option>Sibling</option><option>Spouse</option>
                        <option>Child</option><option>Self</option><option>Other caregiver</option>
                      </FieldSelect>
                    </FieldGroup>
                  </FieldRow>
                  <FieldRow cols={1}>
                    <FieldGroup>
                      <FieldLabel required>Contact Mobile (Caregiver)</FieldLabel>
                      <FieldInput type="tel" placeholder="+91 XXXXX XXXXX" value={data.phone} onChange={e => setData(d => ({ ...d, phone: e.target.value }))} />
                      <FieldHint>We&apos;ll send critical donor alerts to this number. WhatsApp preferred.</FieldHint>
                    </FieldGroup>
                  </FieldRow>
                  <FormNav onNext={() => validateAndNext(1)} nextLabel="Continue to Medical Details →" />
                </div>
              )}

              {/* ── STEP 2 ── */}
              {formStep === 2 && (
                <div style={{ animation: "fadeUp 0.35s ease" }}>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: "0.95rem", color: "var(--raksha-coral)", marginBottom: "1.75rem", lineHeight: 1.55 }}>
                    Medical details help us build the right donor match and ensure your care coordinator understands the urgency and frequency of need.
                  </p>
                  <div style={{ background: "rgba(44,168,160,0.06)", border: "1px solid rgba(44,168,160,0.2)", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem", color: "rgba(250,249,247,0.7)", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "var(--raksha-teal)", fontSize: "0.9rem", flexShrink: 0, marginTop: 1 }}>ℹ</span>
                    All medical information is encrypted and only accessible to your assigned care coordinator and treating hospital.
                  </div>
                  <FieldRow>
                    <FieldGroup>
                      <FieldLabel required>Thalassemia Type</FieldLabel>
                      <FieldSelect value={data.thalType} onChange={e => setData(d => ({ ...d, thalType: e.target.value }))}>
                        <option value="">Select type</option>
                        <option>Beta Thalassemia Major</option><option>Beta Thalassemia Intermedia</option>
                        <option>Alpha Thalassemia</option><option>Sickle Cell Thalassemia</option><option>Other / Not confirmed</option>
                      </FieldSelect>
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel required>Transfusion Frequency</FieldLabel>
                      <FieldSelect value={data.transfusionFreq} onChange={e => setData(d => ({ ...d, transfusionFreq: e.target.value }))}>
                        <option value="">Select</option>
                        <option>Every 2 weeks</option><option>Every 3 weeks</option>
                        <option>Every 4 weeks</option><option>Monthly (approx.)</option><option>On demand / irregular</option>
                      </FieldSelect>
                    </FieldGroup>
                  </FieldRow>
                  <FieldRow cols={3}>
                    <FieldGroup><FieldLabel>Units per Transfusion</FieldLabel><FieldInput type="number" placeholder="e.g. 2" min={1} max={10} value={data.units} onChange={e => setData(d => ({ ...d, units: e.target.value }))} /></FieldGroup>
                    <FieldGroup><FieldLabel>Last Transfusion Date</FieldLabel><FieldInput type="date" value={data.lastTransfusion} onChange={e => setData(d => ({ ...d, lastTransfusion: e.target.value }))} /></FieldGroup>
                    <FieldGroup><FieldLabel>Next Due Date (approx.)</FieldLabel><FieldInput type="date" value={data.nextDue} onChange={e => setData(d => ({ ...d, nextDue: e.target.value }))} /></FieldGroup>
                  </FieldRow>
                  <FieldRow cols={1}>
                    <FieldGroup>
                      <FieldLabel>Chelation Therapy</FieldLabel>
                      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" as const, marginTop: 4 }}>
                        {[["yes", "Yes — ongoing"], ["no", "No"], ["past", "Past, stopped"]].map(([val, label]) => (
                          <RadioItem key={val} label={label} name="chelation" value={val} checked={data.chelation === val} onChange={() => setData(d => ({ ...d, chelation: val }))} />
                        ))}
                      </div>
                    </FieldGroup>
                  </FieldRow>
                  <FieldRow cols={1}>
                    <FieldGroup>
                      <FieldLabel>Comorbidities or Complications</FieldLabel>
                      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.6rem", marginTop: 4 }}>
                        {["Splenomegaly", "Hepatomegaly", "Cardiac issues", "Diabetes", "Growth delay", "Bone disease", "None"].map(val => (
                          <CheckboxItem key={val} label={val} checked={data.comorbidities.includes(val)} onChange={() => toggleComorbidity(val)} />
                        ))}
                      </div>
                    </FieldGroup>
                  </FieldRow>
                  <FieldRow cols={1}>
                    <FieldGroup>
                      <FieldLabel>Any special requirements or notes</FieldLabel>
                      <FieldTextarea placeholder="e.g. Patient has rare antibody — requires special cross-matching." value={data.notes} onChange={e => setData(d => ({ ...d, notes: e.target.value }))} />
                      <FieldHint>Include anything that helps donors or coordinators understand care needs better.</FieldHint>
                    </FieldGroup>
                  </FieldRow>
                  <FormNav onBack={() => goBack(2)} onNext={() => validateAndNext(2)} nextLabel="Continue to Care Preferences →" />
                </div>
              )}

              {/* ── STEP 3 ── */}
              {formStep === 3 && (
                <div style={{ animation: "fadeUp 0.35s ease" }}>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: "0.95rem", color: "var(--raksha-coral)", marginBottom: "1.75rem", lineHeight: 1.55 }}>
                    Almost done. Tell us how you&apos;d like Raksha AI to support you — so we can personalize every alert, match, and update to your situation.
                  </p>
                  <FieldRow cols={1}>
                    <FieldGroup>
                      <FieldLabel required>Preferred Notification Channel</FieldLabel>
                      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.6rem", marginTop: 4 }}>
                        {["WhatsApp", "SMS", "Call", "Email", "App notification"].map(val => (
                          <CheckboxItem key={val} label={val} checked={data.notifChannels.includes(val)} onChange={() => toggleNotif(val)} />
                        ))}
                      </div>
                    </FieldGroup>
                  </FieldRow>
                  <FieldRow>
                    <FieldGroup>
                      <FieldLabel>Preferred Language for Alerts</FieldLabel>
                      <FieldSelect value={data.language} onChange={e => setData(d => ({ ...d, language: e.target.value }))}>
                        {["English", "Hindi", "Telugu", "Tamil", "Marathi", "Bengali", "Gujarati", "Kannada"].map(l => <option key={l}>{l}</option>)}
                      </FieldSelect>
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel>Alert Urgency Threshold</FieldLabel>
                      <FieldSelect value={data.alertThreshold} onChange={e => setData(d => ({ ...d, alertThreshold: e.target.value }))}>
                        <option>All alerts (recommended)</option>
                        <option>Only critical/urgent</option>
                        <option>Daily digest</option>
                      </FieldSelect>
                    </FieldGroup>
                  </FieldRow>
                  <FieldRow cols={1}>
                    <FieldGroup>
                      <FieldLabel>Alternate Caregiver Contact</FieldLabel>
                      <FieldInput type="tel" placeholder="+91 XXXXX XXXXX (optional backup contact)" value={data.altPhone} onChange={e => setData(d => ({ ...d, altPhone: e.target.value }))} />
                    </FieldGroup>
                  </FieldRow>
                  <FieldRow cols={1}>
                    <FieldGroup>
                      <FieldLabel>How did you hear about Raksha AI?</FieldLabel>
                      <FieldSelect value={data.howHeard} onChange={e => setData(d => ({ ...d, howHeard: e.target.value }))}>
                        <option value="">Select</option>
                        <option>Doctor / Hospital</option><option>Thalassemia society</option>
                        <option>Another family</option><option>Social media</option>
                        <option>News / Article</option><option>Other</option>
                      </FieldSelect>
                    </FieldGroup>
                  </FieldRow>
                  {/* Consent */}
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "1rem 1.1rem", marginBottom: "1rem" }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                      <span
                        onClick={() => setData(d => ({ ...d, consent: !d.consent }))}
                        style={{
                          width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 2,
                          border: data.consent ? "1.5px solid #2CA8A0" : "1.5px solid rgba(255,255,255,0.2)",
                          background: data.consent ? "#2CA8A0" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                        }}
                      >
                        {data.consent ? "✓" : ""}
                      </span>
                      <span style={{ fontSize: "0.82rem", color: "rgba(250,249,247,0.75)", lineHeight: 1.5 }} onClick={() => setData(d => ({ ...d, consent: !d.consent }))}>
                        I consent to Raksha AI storing this medical profile, sharing anonymised data with verified donors and care coordinators, and sending alerts on donor availability. I understand I may withdraw consent at any time.
                      </span>
                    </label>
                  </div>
                  <FormNav onBack={() => goBack(3)} onNext={handleSubmit} nextLabel="Complete Registration ✓" nextTeal />
                </div>
              )}
            </>
          ) : (
            /* ── SUCCESS ── */
            <div style={{ textAlign: "center", padding: "2rem 1rem 3rem", animation: "fadeUp 0.5s ease" }}>
              <div style={{ margin: "0 auto 1.5rem", animation: "shieldPulse 2s ease-in-out infinite", display: "inline-block" }}>
                <RakshaShield width={72} height={84} />
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 600, color: "var(--raksha-white)", marginBottom: "0.5rem" }}>
                You&apos;re now protected.
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--raksha-muted)", marginBottom: "1.75rem", lineHeight: 1.6 }}>
                Registration received. A care coordinator will reach you within 2 hours to confirm details and begin building the donor circle.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left", maxWidth: 380, margin: "0 auto 2rem" }}>
                {["We're building their donor circle", "AI match initiated — donors within 15km notified", "Care coordinator assigned to your profile", "Alerts configured on your preferred channels"].map(msg => (
                  <div key={msg} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(44,168,160,0.06)", border: "1px solid rgba(44,168,160,0.2)", padding: "0.7rem 1rem", borderRadius: 6, fontSize: "0.85rem" }}>
                    <span style={{ color: "#2CA8A0", fontSize: "1rem", fontWeight: 700 }}>✓</span>
                    {msg}
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: "var(--raksha-muted)", letterSpacing: "0.1em", background: "var(--surface-input)", border: "1px solid var(--border-subtle)", padding: "0.4rem 0.9rem", display: "inline-block", marginTop: "0.5rem" }}>
                PATIENT ID: {patientId}
              </div>
              <br />
              <Link href="/dashboard">
                <button style={{ marginTop: "1.25rem", background: "var(--raksha-blood)", color: "white", border: "none", padding: "0.75rem 2rem", fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: 0 }}>
                  Go to Patient Dashboard →
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="sidebar-col" style={{ position: "sticky", top: 80 }}>
          {/* Quote */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "1.5rem", marginBottom: "1rem" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.15rem", fontWeight: 600, color: "var(--raksha-warm)", lineHeight: 1.5, marginBottom: "1rem" }}>
              &quot;You&apos;re not doing this alone anymore.&quot;
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--raksha-muted)", letterSpacing: "0.05em" }}>— Raksha AI Care Coordination Team</div>
          </div>

          {/* Badges */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "1.25rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--raksha-muted)", marginBottom: "0.9rem", fontWeight: 500 }}>What you get after registering</div>
            {["Dedicated care coordinator assigned", "AI-matched donor alerts within hours", "24/7 blood availability monitoring", "Pre-transfusion checklist & reminders", "Secure medical profile — always accessible", "Family notification system"].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.82rem", color: "var(--raksha-white)", padding: "0.45rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#22C55E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "white", fontWeight: 700, flexShrink: 0 }}>✓</span>
                {item}
              </div>
            ))}
          </div>

          {/* Emergency */}
          <div style={{ background: "var(--raksha-blood)", borderRadius: 8, padding: "1.25rem", marginBottom: "1rem", animation: "emergencyPulse 2.5s ease-in-out infinite" }}>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "rgba(250,249,247,0.7)", marginBottom: "0.4rem", fontWeight: 600 }}>Emergency Support</div>
            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--raksha-white)", marginBottom: "0.4rem", lineHeight: 1.3 }}>Need blood urgently right now?</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.05rem", color: "var(--raksha-white)", letterSpacing: "0.05em" }}>1800 - RAKSHA</div>
            <div style={{ fontSize: "0.73rem", color: "rgba(250,249,247,0.7)", marginTop: 4 }}>Toll-free · 24 / 7 · All India</div>
          </div>

          {/* Family quote */}
          <div style={{ background: "var(--surface)", borderLeft: "3px solid var(--raksha-coral)", borderRadius: "0 8px 8px 0", padding: "1rem 1.25rem" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.95rem", color: "var(--raksha-warm)", lineHeight: 1.55 }}>
              &quot;Before Raksha AI, every transfusion was a 3-day panic. Now we get a WhatsApp the night before. My son just sleeps.&quot;
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--raksha-muted)", marginTop: "0.5rem", letterSpacing: "0.04em" }}>— Meenakshi R., mother of a 9-year-old patient, Chennai</div>
          </div>
        </div>
      </div>

      {/* ── WHAT HAPPENS AFTER ── */}
      <section style={{ background: "var(--raksha-navy)", borderTop: "1px solid var(--raksha-wine)", padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--raksha-crimson)", marginBottom: "0.75rem", fontWeight: 500 }}>After Registration</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem,3vw,2rem)", fontWeight: 600, color: "var(--raksha-white)", marginBottom: "2.5rem", lineHeight: 1.2 }}>
            What happens <em style={{ color: "var(--raksha-coral)", fontStyle: "italic" }}>next</em>
          </h2>
          <div ref={afterStepsRef} className="after-steps" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5rem", position: "relative" }}>
            <div className="after-steps-line" style={{ position: "absolute", top: 20, left: 24, right: 24, height: 1, background: "linear-gradient(to right, #2CA8A0, rgba(44,168,160,0.3))", zIndex: 0 }} />
            {[
              { title: "Profile Review (2 hrs)", body: "Our care team verifies medical details and flags any urgent requirements before activating matching." },
              { title: "Donor Circle Built", body: "AI scans our verified donor network by blood group, location, and availability. Initial matches sent within 4 hours." },
              { title: "Coordinator Connects", body: "Your assigned coordinator calls or WhatsApps to confirm profile accuracy and walk you through the dashboard." },
              { title: "Alerts Go Live", body: "From your next transfusion cycle, alerts land 72 hours in advance. No more last-minute searches." },
            ].map((step, i) => (
              <div key={i} style={{ position: "relative", zIndex: 1, opacity: afterVisible ? 1 : 0, transform: afterVisible ? "translateY(0)" : "translateY(20px)", transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s` }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--raksha-teal)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", fontWeight: 500, marginBottom: "1rem" }}>{i + 1}</div>
                <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--raksha-white)", marginBottom: "0.4rem" }}>{step.title}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--raksha-muted)", lineHeight: 1.55 }}>{step.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORT BAR ── */}
      <div className="support-bar" style={{ background: "var(--raksha-deep)", borderTop: "1px solid var(--border-subtle)", padding: "1.2rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" as const }}>
          <span style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--raksha-muted)" }}>Help Line</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.9rem", color: "var(--raksha-white)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", animation: "blink 1.8s ease-in-out infinite", display: "inline-block" }} />
            1800 - RAKSHA (toll-free)
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--raksha-muted)" }}>Available in English, Hindi, Telugu, Tamil, Marathi</span>
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--raksha-muted)", letterSpacing: "0.04em" }}>© 2024 Raksha AI · Blood Intelligence & Care Coordination</div>
      </div>
    </>
  );
}

// ─── FormNav helper ───────────────────────────────────────────
function FormNav({ onBack, onNext, nextLabel, nextTeal }: { onBack?: () => void; onNext: () => void; nextLabel: string; nextTeal?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-subtle)" }}>
      {onBack ? (
        <button onClick={onBack} style={{ background: "transparent", color: "var(--raksha-white)", border: "1px solid rgba(255,255,255,0.2)", padding: "0.75rem 1.5rem", fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", cursor: "pointer", borderRadius: 0, letterSpacing: "0.04em" }}>
          ← Back
        </button>
      ) : <div />}
      <button onClick={onNext} style={{ background: nextTeal ? "#2CA8A0" : "#C0152A", color: "white", border: "none", padding: "0.75rem 2rem", fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, cursor: "pointer", borderRadius: 0 }}>
        {nextLabel}
      </button>
    </div>
  );
}
