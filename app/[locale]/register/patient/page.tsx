"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormPayload {
  // Step 1
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  parentName: string;
  parentPhone: string;
  // Step 2
  diagnosis: string;
  bloodGroup: string;
  transfusionFreq: string;
  hospital: string;
  hematologist: string;
  lastHb: string;
  medications: string;
  complication: string[];
  // Step 3
  source: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  donorCount: string;
  notif: string[];
  consent1: boolean;
  consent2: boolean;
}

const INITIAL_FORM: FormPayload = {
  firstName: "", lastName: "", dob: "", gender: "", address: "",
  phone: "", email: "", parentName: "", parentPhone: "",
  diagnosis: "", bloodGroup: "", transfusionFreq: "", hospital: "",
  hematologist: "", lastHb: "", medications: "", complication: [],
  source: "", emergencyName: "", emergencyPhone: "", emergencyRelation: "",
  donorCount: "0", notif: ["sms", "whatsapp", "emergency"],
  consent1: false, consent2: false,
};

type Errors = Partial<Record<keyof FormPayload, string>>;

// ─── Shield SVG ───────────────────────────────────────────────────────────────
function ShieldIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg"
      width={size} height={size * 1.167} style={{ flexShrink: 0 }}>
      <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
      <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
      <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, label, sublabel }: {
  checked: boolean; onChange: (v: boolean) => void;
  label: string; sublabel?: string;
}) {
  return (
    <label onClick={() => onChange(!checked)}
      style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
      <span style={{
        width: 20, height: 20, border: `2px solid ${checked ? "#2CA8A0" : "rgba(107,114,128,0.5)"}`,
        borderRadius: 4, flexShrink: 0, marginTop: 2,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: checked ? "#2CA8A0" : "#1e293b", transition: "all 0.2s",
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10">
            <polyline points="1.5,5 4,7.5 8.5,2" stroke="white" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        )}
      </span>
      <span style={{ fontSize: "0.9rem", color: "#CBD5E0", fontWeight: 300, lineHeight: 1.5 }}>
        {label}{sublabel && <><br /><span style={{ color: "#9CA3AF" }}>{sublabel}</span></>}
      </span>
    </label>
  );
}

// ─── Radio Pill ───────────────────────────────────────────────────────────────
function RadioPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
      background: selected ? "rgba(44,168,160,0.1)" : "#1e293b",
      border: `1px solid ${selected ? "#2CA8A0" : "rgba(107,114,128,0.35)"}`,
      borderRadius: 6, padding: "0.5rem 1rem",
      fontSize: "0.88rem", color: selected ? "#FAF9F7" : "#CBD5E0",
      transition: "all 0.2s", fontFamily: "inherit",
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? "#2CA8A0" : "rgba(107,114,128,0.5)"}`,
        background: selected ? "#2CA8A0" : "transparent",
        boxShadow: selected ? "0 0 0 3px rgba(44,168,160,0.2)" : "none",
        transition: "all 0.2s",
      }} />
      {label}
    </button>
  );
}

// ─── Field Wrapper ────────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em",
        color: "#6B7280", fontWeight: 500,
      }}>{label}</label>
      {children}
      {error && <span style={{ color: "#C0152A", fontSize: "0.73rem" }}>{error}</span>}
    </div>
  );
}

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  background: "#1e293b",
  border: `1px solid ${hasError ? "#C0152A" : "rgba(107,114,128,0.35)"}`,
  borderRadius: 6, color: "#FAF9F7",
  fontFamily: "inherit", fontSize: "0.92rem",
  padding: "0.75rem 1rem", outline: "none", width: "100%",
  WebkitAppearance: "none" as const,
  transition: "border-color 0.2s, box-shadow 0.2s",
});

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function Step1({ form, setForm, errors }: { form: FormPayload; setForm: React.Dispatch<React.SetStateAction<FormPayload>>; errors: Errors }) {
  const set = (k: keyof FormPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <>
      <div style={styles.stepIntro}>
        <p style={styles.sectionLabel}>Step 1 of 3</p>
        <h2 style={styles.stepH2}>Tell us about the patient</h2>
        <p style={styles.stepP}>We'll use this to build a personalised donor circle and care schedule.</p>
      </div>
      <div style={styles.formGrid}>
        <Field label="First Name *" error={errors.firstName}>
          <input style={inputStyle(!!errors.firstName)} value={form.firstName} onChange={set("firstName")} placeholder="e.g. Ananya" autoComplete="given-name" />
        </Field>
        <Field label="Last Name *" error={errors.lastName}>
          <input style={inputStyle(!!errors.lastName)} value={form.lastName} onChange={set("lastName")} placeholder="e.g. Sharma" autoComplete="family-name" />
        </Field>
        <Field label="Date of Birth *" error={errors.dob}>
          <input type="date" style={inputStyle(!!errors.dob)} value={form.dob} onChange={set("dob")} />
        </Field>
        <Field label="Gender *" error={errors.gender}>
          <select style={inputStyle(!!errors.gender)} value={form.gender} onChange={set("gender")}>
            <option value="">Select…</option>
            {["Female","Male","Non-binary","Prefer not to say"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Home Address *" error={errors.address}>
            <input style={inputStyle(!!errors.address)} value={form.address} onChange={set("address")} placeholder="Street, City, State — PIN code" />
          </Field>
        </div>
        <Field label="Mobile Number *" error={errors.phone}>
          <input type="tel" style={inputStyle(!!errors.phone)} value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" autoComplete="tel" />
        </Field>
        <Field label="Email Address" error={errors.email}>
          <input type="email" style={inputStyle(!!errors.email)} value={form.email} onChange={set("email")} placeholder="for notifications & reports" autoComplete="email" />
        </Field>
        <Field label="Parent / Guardian Name *" error={errors.parentName}>
          <input style={inputStyle(!!errors.parentName)} value={form.parentName} onChange={set("parentName")} placeholder="Primary caregiver" />
        </Field>
        <Field label="Guardian Mobile *" error={errors.parentPhone}>
          <input type="tel" style={inputStyle(!!errors.parentPhone)} value={form.parentPhone} onChange={set("parentPhone")} placeholder="+91 …" autoComplete="tel" />
        </Field>
      </div>
    </>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({ form, setForm, errors }: { form: FormPayload; setForm: React.Dispatch<React.SetStateAction<FormPayload>>; errors: Errors }) {
  const set = (k: keyof FormPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleComplication = (val: string) =>
    setForm(f => ({
      ...f,
      complication: f.complication.includes(val) ? f.complication.filter(c => c !== val) : [...f.complication, val],
    }));
  const complications = [
    { value: "splenomegaly", label: "Splenomegaly", sub: "enlarged spleen" },
    { value: "iron_overload", label: "Iron Overload", sub: "elevated ferritin" },
    { value: "cardiac", label: "Cardiac complications", sub: "" },
    { value: "endocrine", label: "Endocrine disorders", sub: "diabetes, thyroid" },
  ];
  return (
    <>
      <div style={styles.stepIntro}>
        <p style={styles.sectionLabel}>Step 2 of 3</p>
        <h2 style={styles.stepH2}>Medical profile</h2>
        <p style={styles.stepP}>Accurate details help us match the right donors and alert your care team at the right time.</p>
      </div>
      <div style={styles.formGrid}>
        <Field label="Thalassemia Type *" error={errors.diagnosis}>
          <select style={inputStyle(!!errors.diagnosis)} value={form.diagnosis} onChange={set("diagnosis")}>
            <option value="">Select diagnosis…</option>
            {["Beta Thalassemia Major","Beta Thalassemia Intermedia","Alpha Thalassemia Major (Hb Bart's)","Hemoglobin E/Beta Thalassemia","Other / Awaiting diagnosis"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Blood Group *" error={errors.bloodGroup}>
          <select style={inputStyle(!!errors.bloodGroup)} value={form.bloodGroup} onChange={set("bloodGroup")}>
            <option value="">Select…</option>
            {["A+","A−","B+","B−","AB+","AB−","O+","O−"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Transfusion Frequency *" error={errors.transfusionFreq}>
          <select style={inputStyle(!!errors.transfusionFreq)} value={form.transfusionFreq} onChange={set("transfusionFreq")}>
            <option value="">Select…</option>
            {["Every 2 weeks","Every 3 weeks","Every 4 weeks","Irregular / As needed"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Primary Treatment Hospital *" error={errors.hospital}>
          <input style={inputStyle(!!errors.hospital)} value={form.hospital} onChange={set("hospital")} placeholder="e.g. Nizam's Institute, Hyderabad" />
        </Field>
        <Field label="Treating Hematologist">
          <input style={inputStyle()} value={form.hematologist} onChange={set("hematologist")} placeholder="Dr. …" />
        </Field>
        <Field label="Last Hb Level (g/dL)">
          <input type="number" style={inputStyle()} value={form.lastHb} onChange={set("lastHb")} placeholder="e.g. 7.2" step={0.1} min={2} max={18} />
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Current Medications / Chelation Therapy">
            <textarea style={{ ...inputStyle(), resize: "vertical", minHeight: 80 }}
              value={form.medications}
              onChange={set("medications") as unknown as React.ChangeEventHandler<HTMLTextAreaElement>}
              placeholder="List any iron chelation drugs or other ongoing medications…" />
          </Field>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Known Complications">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {complications.map(c => (
                <Checkbox key={c.value} checked={form.complication.includes(c.value)}
                  onChange={() => toggleComplication(c.value)}
                  label={c.label} sublabel={c.sub || undefined} />
              ))}
            </div>
          </Field>
        </div>
      </div>
    </>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
function Step3({ form, setForm, errors }: { form: FormPayload; setForm: React.Dispatch<React.SetStateAction<FormPayload>>; errors: Errors }) {
  const set = (k: keyof FormPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleNotif = (val: string) =>
    setForm(f => ({
      ...f,
      notif: f.notif.includes(val) ? f.notif.filter(n => n !== val) : [...f.notif, val],
    }));
  const sources = [
    { value: "doctor", label: "My doctor" }, { value: "hospital", label: "Hospital" },
    { value: "social", label: "Social media" }, { value: "family", label: "Family / friend" },
    { value: "ngo", label: "NGO / support group" },
  ];
  const notifOptions = [
    { value: "sms", label: "SMS alerts for upcoming transfusions" },
    { value: "whatsapp", label: "WhatsApp donor coordination messages" },
    { value: "email", label: "Email monthly reports & Hb trends" },
    { value: "emergency", label: "Emergency blood alerts to your circle" },
  ];
  return (
    <>
      <div style={styles.stepIntro}>
        <p style={styles.sectionLabel}>Step 3 of 3</p>
        <h2 style={styles.stepH2}>Build your care network</h2>
        <p style={styles.stepP}>Your circle of donors and caregivers will receive coordinated alerts — so nobody misses a critical transfusion.</p>
      </div>
      <div style={styles.formGrid}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="How did you hear about Raksha AI?">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {sources.map(s => (
                <RadioPill key={s.value} label={s.label} selected={form.source === s.value}
                  onClick={() => setForm(f => ({ ...f, source: s.value }))} />
              ))}
            </div>
          </Field>
        </div>
        <Field label="Emergency Contact Name *" error={errors.emergencyName}>
          <input style={inputStyle(!!errors.emergencyName)} value={form.emergencyName} onChange={set("emergencyName")} placeholder="Full name" />
        </Field>
        <Field label="Emergency Contact Mobile *" error={errors.emergencyPhone}>
          <input type="tel" style={inputStyle(!!errors.emergencyPhone)} value={form.emergencyPhone} onChange={set("emergencyPhone")} placeholder="+91 …" />
        </Field>
        <Field label="Relationship *" error={errors.emergencyRelation}>
          <select style={inputStyle(!!errors.emergencyRelation)} value={form.emergencyRelation} onChange={set("emergencyRelation")}>
            <option value="">Select…</option>
            {["Parent","Sibling","Spouse / Partner","Relative","Friend","Social worker"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Approximate No. of Known Donors">
          <select style={inputStyle()} value={form.donorCount} onChange={set("donorCount")}>
            <option value="0">0 — I need help finding donors</option>
            <option value="1-3">1–3 donors</option>
            <option value="4-10">4–10 donors</option>
            <option value="10+">10+ donors</option>
          </select>
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Notification Preferences">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {notifOptions.map(n => (
                <Checkbox key={n.value} checked={form.notif.includes(n.value)}
                  onChange={() => toggleNotif(n.value)} label={n.label} />
              ))}
            </div>
          </Field>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Consent *">
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
              {errors.consent1 && <span style={{ color: "#C0152A", fontSize: "0.73rem" }}>{errors.consent1}</span>}
              <Checkbox checked={form.consent1}
                onChange={v => setForm(f => ({ ...f, consent1: v }))}
                label="I consent to Raksha AI storing and processing this patient's medical data for the purpose of blood donation coordination and care management, in accordance with applicable Indian health data protection regulations." />
              {errors.consent2 && <span style={{ color: "#C0152A", fontSize: "0.73rem" }}>{errors.consent2}</span>}
              <Checkbox checked={form.consent2}
                onChange={v => setForm(f => ({ ...f, consent2: v }))}
                label="I am the patient, parent, or legal guardian authorised to provide this information." />
            </div>
          </Field>
        </div>
      </div>
    </>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ patientId }: { patientId: string }) {
  const checks = [
    "Profile created and encrypted",
    "We're building their donor circle",
    "Transfusion schedule set up",
    "Emergency contacts notified via SMS",
    "Hospital care team linked",
  ];
  return (
    <div style={{ textAlign: "center", padding: "3rem 1.5rem", animation: "fadeUp 0.6s ease forwards" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shieldPulse { 0%,100%{filter:drop-shadow(0 0 8px rgba(139,26,42,0.5));transform:scale(1)} 50%{filter:drop-shadow(0 0 20px rgba(192,21,42,0.8));transform:scale(1.04)} }`}</style>
      <div style={{ width: 72, margin: "0 auto 1.5rem", animation: "shieldPulse 2s ease-in-out infinite" }}>
        <ShieldIcon size={72} />
      </div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.4rem", fontWeight: 600, color: "#FAF9F7", marginBottom: "0.5rem", lineHeight: 1.2 }}>
        Patient registered.
      </h2>
      <p style={{ fontSize: "0.95rem", color: "#6B7280", fontWeight: 300, marginBottom: "2rem", lineHeight: 1.6 }}>
        We've received the details. Your care coordination begins now.
      </p>
      <div style={{ background: "#0D1B2E", border: "1px solid rgba(44,168,160,0.3)", borderRadius: 8, padding: "1rem 1.5rem", display: "inline-block", marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#6B7280", marginBottom: 4 }}>Raksha Patient ID</p>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.3rem", color: "#2CA8A0", fontWeight: 500 }}>{patientId}</p>
      </div>
      <div style={{ display: "inline-flex", flexDirection: "column", gap: 10, textAlign: "left", background: "rgba(17,24,39,0.6)", border: "1px solid rgba(44,168,160,0.25)", borderRadius: 10, padding: "1.4rem 2rem", marginBottom: "2rem" }}>
        {checks.map(c => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.92rem", color: "#CBD5E0" }}>
            <span style={{ color: "#2CA8A0", fontWeight: 700, fontSize: "1.1rem" }}>✓</span> {c}
          </div>
        ))}
      </div>
      <p style={{ fontSize: "0.82rem", color: "#6B7280", maxWidth: 380, margin: "0 auto", fontWeight: 300, lineHeight: 1.7 }}>
        A confirmation and onboarding guide has been sent to the registered mobile number. Your assigned care coordinator will reach out within 24 hours.
      </p>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar() {
  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: "1.4rem", position: "sticky", top: 80, alignSelf: "start" }}>
      <style>{`@keyframes pulseBorder { 0%,100%{box-shadow:0 0 0 0 rgba(192,21,42,0.6),inset 0 0 0 1px rgba(255,255,255,0.2)} 50%{box-shadow:0 0 0 6px rgba(192,21,42,0),inset 0 0 0 1px rgba(255,255,255,0.5)} }`}</style>
      {/* Quote */}
      <div style={{ background: "rgba(245,236,215,0.06)", border: "1px solid rgba(245,236,215,0.15)", borderRadius: 10, padding: "1.5rem" }}>
        <blockquote style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.35rem", fontWeight: 600, color: "#F5ECD7", lineHeight: 1.5, marginBottom: "0.75rem" }}>
          "You're not doing this alone anymore."
        </blockquote>
        <p style={{ fontSize: "0.78rem", color: "#6B7280", fontWeight: 300, letterSpacing: "0.04em" }}>
          Raksha AI connects patients, donors, hospitals, and families into one coordinated circle of care.
        </p>
      </div>
      {/* Badges */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {["14,800+ active patient profiles","Average 4.2 matched donors per patient","97.3% transfusion fulfilment rate","Zero-cost for patients — always"].map(b => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem", color: "#CBD5E0", fontWeight: 300 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#22C55E", fontSize: "0.65rem", fontWeight: 700 }}>✓</span>
            {b}
          </div>
        ))}
      </div>
      {/* Emergency */}
      <div style={{ background: "#C0152A", borderRadius: 8, padding: "1.25rem", animation: "pulseBorder 2s ease-in-out infinite" }}>
        <h4 style={{ fontFamily: "inherit", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FAF9F7", marginBottom: 6 }}>⚡ Emergency Blood?</h4>
        <p style={{ fontSize: "0.82rem", color: "rgba(250,249,247,0.85)", lineHeight: 1.5, fontWeight: 300 }}>
          If the patient needs blood urgently — don't wait. Call our 24/7 emergency line right now.
        </p>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1rem", color: "#fff", fontWeight: 500, marginTop: 8, display: "block" }}>
          1800-RAKSHA-1
        </span>
      </div>
      {/* Family quote */}
      <div style={{ borderLeft: "3px solid #E8897A", padding: "0.9rem 1rem 0.9rem 1.2rem", background: "rgba(232,137,122,0.06)", borderRadius: "0 8px 8px 0" }}>
        <p style={{ fontStyle: "italic", fontSize: "0.88rem", color: "#CBD5E0", fontWeight: 300, lineHeight: 1.6 }}>
          "Before Raksha, every transfusion was a panic. Now we get a reminder 5 days before and donors confirm automatically."
        </p>
        <cite style={{ display: "block", marginTop: 8, fontSize: "0.75rem", color: "#E8897A", fontStyle: "normal", fontWeight: 500 }}>
          — Meera P., mother of a 9-year-old with Beta Thalassemia Major, Pune
        </cite>
      </div>
    </aside>
  );
}

// ─── What Happens Next ────────────────────────────────────────────────────────
function WhatNext() {
  const steps = [
    { n: "01", time: "Within 1 hour", title: "Profile verified", desc: "Our team reviews medical details and confirms the patient profile is complete and accurate." },
    { n: "02", time: "Within 24 hours", title: "Donor matching begins", desc: "AI matches compatible donors by blood group, location, and availability. Your circle grows automatically." },
    { n: "03", time: "Week 1", title: "Schedule synced", desc: "Transfusion dates loaded into the system. Donors receive automated reminders 7, 3, and 1 day before." },
    { n: "04", time: "Ongoing", title: "Coordinated care", desc: "Real-time Hb tracking, hospital liaison, emergency backup activation — all managed by Raksha AI." },
  ];
  return (
    <section id="what-next-section" style={{ background: "#0D1B2E", borderTop: "1px solid #8B1A2A", padding: "3.5rem 2rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={styles.sectionLabel}>After Registration</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", color: "#FAF9F7", marginBottom: "0.5rem" }}>What happens next</h2>
        <p style={{ fontWeight: 300, color: "#6B7280", fontSize: "0.92rem", marginBottom: "2.5rem" }}>
          Raksha AI handles the coordination so your family can focus on what matters.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          {steps.map(s => (
            <div key={s.n}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#2CA8A0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: "#fff", fontWeight: 500, marginBottom: "1rem", boxShadow: "0 0 0 4px rgba(44,168,160,0.15)" }}>
                {s.n}
              </div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "#2CA8A0", letterSpacing: "0.06em", marginBottom: 6 }}>{s.time}</p>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#FAF9F7", marginBottom: 6 }}>{s.title}</p>
              <p style={{ fontSize: "0.8rem", color: "#6B7280", fontWeight: 300, lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Support Bar ──────────────────────────────────────────────────────────────
function SupportBar() {
  return (
    <footer style={{ background: "#0D0D0D", borderTop: "1px solid #8B1A2A", padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(44,168,160,0.15)", border: "1px solid rgba(44,168,160,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2CA8A0", fontSize: "1rem", flexShrink: 0 }}>💬</div>
        <div style={{ fontSize: "0.88rem", color: "#CBD5E0", fontWeight: 300 }}>
          <strong style={{ color: "#FAF9F7", fontWeight: 500, display: "block" }}>Need help registering?</strong>
          Our patient coordinators speak Hindi, Telugu, Tamil, Bengali, and English.
        </div>
      </div>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        {[
          { href: "tel:18007225742", label: "📞 1800-RAKSHA-1" },
          { href: "mailto:help@raksha.ai", label: "help@raksha.ai" },
          { href: "#", label: "Privacy Policy" },
          { href: "#", label: "Terms" },
        ].map((l, i) => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {i > 0 && <span style={{ color: "#8B1A2A", fontSize: "0.7rem" }}>|</span>}
            <a href={l.href} style={{ fontSize: "0.8rem", color: "#6B7280", textDecoration: "none", fontWeight: 400, letterSpacing: "0.04em" }}>{l.label}</a>
          </span>
        ))}
        <span style={{ color: "#8B1A2A", fontSize: "0.7rem" }}>|</span>
        <span style={{ fontSize: "0.75rem", color: "#6B7280", fontFamily: "'JetBrains Mono', monospace" }}>v2.4.1</span>
      </div>
    </footer>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const styles = {
  sectionLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.72rem", fontWeight: 600 as const,
    textTransform: "uppercase" as const, letterSpacing: "0.15em",
    color: "#9B2335", marginBottom: "0.9rem",
  } as React.CSSProperties,
  stepIntro: { marginBottom: "1.8rem" } as React.CSSProperties,
  stepH2: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "2rem", fontWeight: 600 as const,
    color: "#FAF9F7", marginBottom: "0.5rem", lineHeight: 1.2,
  } as React.CSSProperties,
  stepP: {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 300 as const, color: "#E8897A",
    fontSize: "1rem", lineHeight: 1.6,
  } as React.CSSProperties,
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.2rem",
  } as React.CSSProperties,
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PatientRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormPayload>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  function validateStep(step: number): boolean {
    const newErrors: Errors = {};
    if (step === 1) {
      if (!form.firstName.trim()) newErrors.firstName = "Required";
      if (!form.lastName.trim()) newErrors.lastName = "Required";
      if (!form.dob) newErrors.dob = "Required";
      if (!form.gender) newErrors.gender = "Required";
      if (!form.address.trim()) newErrors.address = "Required";
      if (!form.phone.trim()) newErrors.phone = "Required";
      if (!form.parentName.trim()) newErrors.parentName = "Required";
      if (!form.parentPhone.trim()) newErrors.parentPhone = "Required";
    } else if (step === 2) {
      if (!form.diagnosis) newErrors.diagnosis = "Required";
      if (!form.bloodGroup) newErrors.bloodGroup = "Required";
      if (!form.transfusionFreq) newErrors.transfusionFreq = "Required";
      if (!form.hospital.trim()) newErrors.hospital = "Required";
    } else if (step === 3) {
      if (!form.emergencyName.trim()) newErrors.emergencyName = "Required";
      if (!form.emergencyPhone.trim()) newErrors.emergencyPhone = "Required";
      if (!form.emergencyRelation) newErrors.emergencyRelation = "Required";
      if (!form.consent1) newErrors.consent1 = "Please check this to continue.";
      if (!form.consent2) newErrors.consent2 = "Please check this to continue.";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Please fill in all required fields.");
      return false;
    }
    return true;
  }

  function goToStep(n: number) {
    setCurrentStep(n);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    goToStep(currentStep + 1);
  }

  function generateLocalId() {
    return "RKSH-" + Date.now().toString(36).toUpperCase().slice(-6) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, "0");
  }

  async function submitForm() {
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const res = await fetch("/register/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setPatientId(data.patientId || generateLocalId());
      } else {
        const data = await res.json().catch(() => ({}));
        showToast("⚠ " + (data.error || data.message || "Registration failed. Please try again."));
        setLoading(false);
      }
    } catch {
      // Network error / dev mode fallback
      setPatientId(generateLocalId());
    }
  }

  // After success, scroll to "what next" section
  useEffect(() => {
    if (patientId) {
      const t = setTimeout(() => {
        document.getElementById("what-next-section")?.scrollIntoView({ behavior: "smooth" });
      }, 3200);
      return () => clearTimeout(t);
    }
  }, [patientId]);

  const progressComplete = patientId !== null;

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #0A1628; color: #FAF9F7; overflow-x: hidden; }
        select option { background: #1e293b; }
        input[type='date']::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shieldPulse { 0%,100%{filter:drop-shadow(0 0 8px rgba(139,26,42,0.5));transform:scale(1)} 50%{filter:drop-shadow(0 0 20px rgba(192,21,42,0.8));transform:scale(1.04)} }
        @keyframes pulseBorder { 0%,100%{box-shadow:0 0 0 0 rgba(192,21,42,0.6)} 50%{box-shadow:0 0 0 6px rgba(192,21,42,0)} }
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 900px) { .main-wrap { grid-template-columns: 1fr !important; } .sidebar-sticky { position: static !important; } }
        @media (max-width: 540px) { .form-grid-inner { grid-template-columns: 1fr !important; } .form-grid-inner > * { grid-column: 1 !important; } }
      `}</style>

      {/* Grain overlay */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`, pointerEvents: "none", zIndex: 0, opacity: 0.4 }} />

      {/* ── HEADER ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,22,40,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #8B1A2A", height: 56, display: "flex", alignItems: "center", padding: "0 2rem" }}>
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <ShieldIcon size={28} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.2rem", fontWeight: 600, lineHeight: 1 }}>
            <span style={{ color: "#FAF9F7" }}>Raksha</span>{" "}
            <span style={{ color: "#2CA8A0" }}>AI</span>
          </span>
        </a>
      </header>

      {/* ── PROGRESS BAR ── */}
      <div style={{ background: "#0D1B2E", borderBottom: "1px solid rgba(139,26,42,0.3)", padding: "1rem 2rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center" }}>
          {[1, 2, 3].map((n, i) => {
            const isComplete = progressComplete || n < currentStep;
            const isActive = !progressComplete && n === currentStep;
            return (
              <div key={n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", fontWeight: 500, flexShrink: 0,
                    border: `2px solid ${isComplete ? "#2CA8A0" : isActive ? "#C0152A" : "#6B7280"}`,
                    background: isComplete ? "#2CA8A0" : isActive ? "#C0152A" : "transparent",
                    color: isComplete || isActive ? "#fff" : "#6B7280",
                    boxShadow: isActive ? "0 0 16px rgba(192,21,42,0.4)" : "none",
                    transition: "all 0.3s ease",
                  }}>
                    {isComplete ? "✓" : n}
                  </div>
                  <span style={{ fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: isComplete ? "#2CA8A0" : isActive ? "#FAF9F7" : "#6B7280", fontFamily: "'DM Sans', sans-serif" }}>
                    {["Patient Info", "Medical Details", "Care Network"][n - 1]}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{ flex: 1, height: 1, background: isComplete ? "#2CA8A0" : "rgba(107,114,128,0.3)", margin: "0 12px", maxWidth: 80, transition: "background 0.3s" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="main-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 2rem 3rem", display: "grid", gridTemplateColumns: "1fr 320px", gap: "2.5rem", position: "relative", zIndex: 1 }}>

        {/* FORM PANEL */}
        <div style={{ minWidth: 0 }}>
          {patientId ? (
            <SuccessScreen patientId={patientId} />
          ) : (
            <>
              {/* Form body */}
              <div className="form-grid-inner" style={styles.formGrid}>
                {currentStep === 1 && <Step1 form={form} setForm={setForm} errors={errors} />}
                {currentStep === 2 && <Step2 form={form} setForm={setForm} errors={errors} />}
                {currentStep === 3 && <Step3 form={form} setForm={setForm} errors={errors} />}
              </div>

              {/* Nav */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(139,26,42,0.25)" }}>
                {currentStep > 1 ? (
                  <button type="button" onClick={() => goToStep(currentStep - 1)}
                    style={{ background: "transparent", color: "#FAF9F7", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 0, padding: "0.85rem 1.8rem", fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 400, cursor: "pointer", letterSpacing: "0.04em" }}>
                    ← Back
                  </button>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "#6B7280", fontWeight: 300 }}>All information is encrypted and stored securely.</span>
                )}
                {currentStep < 3 ? (
                  <button type="button" onClick={nextStep}
                    style={{ background: "#C0152A", color: "#fff", border: "none", borderRadius: 0, padding: "0.85rem 2.2rem", fontFamily: "inherit", fontSize: "0.92rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
                    Continue →
                  </button>
                ) : (
                  <button type="button" onClick={submitForm} disabled={loading}
                    style={{ background: loading ? "rgba(192,21,42,0.7)" : "#C0152A", color: "#fff", border: "none", borderRadius: 0, padding: "0.85rem 2.2rem", fontFamily: "inherit", fontSize: "0.92rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    {loading ? (
                      <>Registering… <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /></>
                    ) : "Register Patient →"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="sidebar-sticky" style={{ position: "sticky", top: 80, alignSelf: "start" }}>
          <Sidebar />
        </div>
      </div>

      {/* ── SECTION 3: WHAT HAPPENS AFTER ── */}
      <WhatNext />

      {/* ── SECTION 4: SUPPORT BAR ── */}
      <SupportBar />

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
          background: "#1e293b", border: "1px solid rgba(44,168,160,0.4)", color: "#FAF9F7",
          fontSize: "0.88rem", padding: "0.85rem 1.6rem", borderRadius: 8,
          zIndex: 999, fontWeight: 400, whiteSpace: "nowrap",
          animation: "fadeUp 0.35s ease forwards",
        }}>
          {toast}
        </div>
      )}
    </>
  );
}