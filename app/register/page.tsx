"use client";

import { useState, useEffect, useRef } from "react";

// ── FONTS ─────────────────────────────────────────────────────────────────────
const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface FormData {
  // Personal
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  // Contact
  phone: string;
  email: string;
  city: string;
  area: string;
  // Medical
  bloodGroup: string;
  lastDonation: string;
  hasThalassemiaDonation: boolean;
  medicalConditions: string;
  medications: string;
  // Availability
  availability: string[];
  travelRadius: string;
  emergencyAvailable: boolean;
  // Consent
  consentData: boolean;
  consentContact: boolean;
}

type StepKey = "personal" | "contact" | "medical" | "availability" | "consent";

interface Step {
  id: StepKey;
  label: string;
  icon: string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const STEPS: Step[] = [
  { id: "personal", label: "Personal", icon: "◈" },
  { id: "contact", label: "Contact", icon: "◉" },
  { id: "medical", label: "Medical", icon: "◆" },
  { id: "availability", label: "Availability", icon: "⊞" },
  { id: "consent", label: "Consent", icon: "▤" },
];

const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

const CITIES = [
  "Hyderabad", "Secunderabad", "Warangal", "Nizamabad",
  "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar",
];

const AVAILABILITY_OPTIONS = [
  "Weekday mornings",
  "Weekday evenings",
  "Weekend mornings",
  "Weekend evenings",
  "Flexible / On-call",
];

const TRAVEL_OPTIONS = ["< 5 km", "5–15 km", "15–30 km", "30+ km / Citywide"];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg
        viewBox="0 0 48 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="38"
        style={{ flexShrink: 0 }}
      >
        <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
        <path
          d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z"
          fill="white"
          opacity="0.95"
        />
        <path
          d="M16 39Q20 36 24 39Q28 42 32 39"
          stroke="#2CA8A0"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 20,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        <span style={{ color: "#FAF9F7" }}>Raksha</span>
        <span style={{ color: "#2CA8A0" }}>AI</span>
      </span>
    </div>
  );
}

// ── FIELD COMPONENT ───────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, error, required, children }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: "#9CA3AF",
          letterSpacing: "1.2px",
          textTransform: "uppercase",
        }}
      >
        {label}
        {required && <span style={{ color: "#C0152A", marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {error && (
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: "#C0152A",
          }}
        >
          ⚠ {error}
        </span>
      )}
    </div>
  );
}

// ── INPUT STYLE ───────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  background: "#0A1628",
  border: "1px solid #1e293b",
  borderRadius: 0,
  color: "#FAF9F7",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  padding: "12px 14px",
  outline: "none",
  width: "100%",
  transition: "border-color 0.2s",
};

const inputFocusStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: "#2CA8A0",
};

// ── FOCUSED INPUT ─────────────────────────────────────────────────────────────
interface FocusInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

function FocusInput({ hasError, style: _style, ...props }: FocusInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        borderColor: hasError ? "#C0152A" : focused ? "#2CA8A0" : "#1e293b",
      }}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
}

interface FocusSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

function FocusSelect({ hasError, children, style: _style, ...props }: FocusSelectProps) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...inputStyle,
        borderColor: hasError ? "#C0152A" : focused ? "#2CA8A0" : "#1e293b",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
        paddingRight: 36,
        cursor: "pointer",
      }}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
    >
      {children}
    </select>
  );
}

interface FocusTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

function FocusTextarea({ hasError, style: _style, ...props }: FocusTextareaProps) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...inputStyle,
        borderColor: hasError ? "#C0152A" : focused ? "#2CA8A0" : "#1e293b",
        resize: "vertical",
        minHeight: 80,
      }}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
}

// ── TOGGLE ────────────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  sublabel?: string;
}

function Toggle({ checked, onChange, label, sublabel }: ToggleProps) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        padding: "14px 16px",
        background: checked ? "rgba(44,168,160,0.08)" : "#0A1628",
        border: `1px solid ${checked ? "#2CA8A0" : "#1e293b"}`,
        borderRadius: 8,
        transition: "all 0.2s",
      }}
    >
      <div
        style={{
          width: 42,
          height: 24,
          borderRadius: 12,
          background: checked ? "#2CA8A0" : "#1e293b",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#FAF9F7",
            transition: "left 0.2s",
          }}
        />
      </div>
      <div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: checked ? "#FAF9F7" : "#9CA3AF",
            fontWeight: checked ? 500 : 400,
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: "#6B7280",
              marginTop: 2,
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

// ── CHIP MULTI-SELECT ─────────────────────────────────────────────────────────
interface ChipSelectProps {
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}

function ChipSelect({ options, selected, onChange }: ChipSelectProps) {
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]
    );
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              background: active ? "#2CA8A0" : "transparent",
              color: active ? "#fff" : "#9CA3AF",
              border: `1px solid ${active ? "#2CA8A0" : "#1e293b"}`,
              padding: "8px 16px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
              borderRadius: 0,
              transition: "all 0.15s",
              letterSpacing: "0.3px",
            }}
          >
            {active ? "✓ " : ""}{opt}
          </button>
        );
      })}
    </div>
  );
}

// ── PROGRESS BAR ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const pct = ((current) / total) * 100;
    const t = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(t);
  }, [current, total]);
  return (
    <div
      style={{
        background: "#1e293b",
        height: 3,
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 32,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: "linear-gradient(90deg, #8B1A2A, #C0152A)",
          borderRadius: 2,
          transition: "width 0.5s cubic-bezier(.34,1.56,.64,1)",
        }}
      />
    </div>
  );
}

// ── STEP INDICATOR ─────────────────────────────────────────────────────────────
function StepIndicator({
  steps,
  currentIndex,
}: {
  steps: Step[];
  currentIndex: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 32,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div
            key={step.id}
            style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: done ? "#2CA8A0" : active ? "#C0152A" : "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: done ? 14 : 13,
                  color: done || active ? "#fff" : "#6B7280",
                  border: active ? "2px solid #C0152A" : "none",
                  transition: "all 0.3s",
                  boxShadow: active
                    ? "0 0 12px rgba(192,21,42,0.4)"
                    : "none",
                }}
              >
                {done ? "✓" : step.icon}
              </div>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  color: active ? "#FAF9F7" : done ? "#2CA8A0" : "#6B7280",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  width: 40,
                  height: 1,
                  background: done ? "#2CA8A0" : "#1e293b",
                  marginBottom: 18,
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── VALIDATE ──────────────────────────────────────────────────────────────────
function validateStep(step: StepKey, data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (step === "personal") {
    if (!data.firstName.trim()) errors.firstName = "First name is required";
    if (!data.lastName.trim()) errors.lastName = "Last name is required";
    if (!data.dob) errors.dob = "Date of birth is required";
    else {
      const age = Math.floor(
        (Date.now() - new Date(data.dob).getTime()) / (365.25 * 24 * 3600 * 1000)
      );
      if (age < 18) errors.dob = "Donor must be at least 18 years old";
      if (age > 65) errors.dob = "Donor must be under 65 years old";
    }
    if (!data.gender) errors.gender = "Please select a gender";
  }
  if (step === "contact") {
    if (!data.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\s/g, "")))
      errors.phone = "Enter a valid 10-digit Indian mobile number";
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errors.email = "Enter a valid email address";
    if (!data.city) errors.city = "Please select your city";
  }
  if (step === "medical") {
    if (!data.bloodGroup) errors.bloodGroup = "Blood group is required";
  }
  if (step === "availability") {
    if (data.availability.length === 0)
      errors.availability = "Please select at least one availability slot";
    if (!data.travelRadius) errors.travelRadius = "Please select travel radius";
  }
  if (step === "consent") {
    if (!data.consentData) errors.consentData = "You must agree to data processing";
    if (!data.consentContact)
      errors.consentContact = "You must agree to be contacted for donations";
  }
  return errors;
}

// ── SUCCESS SCREEN ─────────────────────────────────────────────────────────────
function SuccessScreen({ name, blood }: { name: string; blood: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        gap: 24,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s ease",
      }}
    >
      <div style={{ fontSize: 64 }}>🩸</div>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 38,
          fontWeight: 700,
          color: "#FAF9F7",
          lineHeight: 1.2,
        }}
      >
        Welcome to the Circle,
        <br />
        <span style={{ color: "#2CA8A0" }}>{name}.</span>
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          color: "#9CA3AF",
          maxWidth: 420,
          lineHeight: 1.7,
        }}
      >
        Your{" "}
        <span
          style={{
            color: "#C0152A",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
          }}
        >
          {blood}
        </span>{" "}
        donation commitment is now part of Arjun's care network. Dr. Meera Iyer
        will reach out to verify and onboard you within 48 hours.
      </div>
      <div
        style={{
          background: "#111827",
          borderTop: "2px solid #2CA8A0",
          borderRadius: "0 0 10px 10px",
          padding: "18px 28px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: "#6B7280",
          lineHeight: 1.6,
          maxWidth: 420,
          width: "100%",
        }}
      >
        <span style={{ color: "#2CA8A0" }}>◈ What happens next</span>
        <br />
        Coordinator review → Background health check → Donor ID issued → Added
        to patient's circle
      </div>
      <a
        href="/"
        style={{
          background: "transparent",
          color: "#C0152A",
          border: "1px solid #C0152A",
          padding: "12px 32px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          textDecoration: "none",
          letterSpacing: "0.5px",
          display: "inline-block",
        }}
      >
        Return to Dashboard →
      </a>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function DonorRegisterPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const topRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
    city: "",
    area: "",
    bloodGroup: "",
    lastDonation: "",
    hasThalassemiaDonation: false,
    medicalConditions: "",
    medications: "",
    availability: [],
    travelRadius: "",
    emergencyAvailable: false,
    consentData: false,
    consentContact: false,
  });

  const currentStep = STEPS[stepIndex];

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleNext = () => {
    const errs = validateStep(currentStep.id, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setErrors({});
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setSubmitted(true);
    }
  };

  const handleBack = () => {
    setErrors({});
    setStepIndex((i) => Math.max(0, i - 1));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ── STEP PANELS ──────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep.id) {
      case "personal":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionTitle>Personal Information</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="First Name" required error={errors.firstName}>
                <FocusInput
                  type="text"
                  placeholder="Ramesh"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  hasError={!!errors.firstName}
                />
              </Field>
              <Field label="Last Name" required error={errors.lastName}>
                <FocusInput
                  type="text"
                  placeholder="Kumar"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  hasError={!!errors.lastName}
                />
              </Field>
            </div>
            <Field label="Date of Birth" required error={errors.dob}>
              <FocusInput
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
                hasError={!!errors.dob}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000)
                  .toISOString()
                  .split("T")[0]}
              />
            </Field>
            <Field label="Gender" required error={errors.gender}>
              <FocusSelect
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                hasError={!!errors.gender}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Prefer not to say</option>
              </FocusSelect>
            </Field>
            <InfoNote>
              Donors must be between 18 and 65 years of age and in general good health. Age is verified at the time of donation.
            </InfoNote>
          </div>
        );

      case "contact":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionTitle>Contact Details</SectionTitle>
            <Field label="Mobile Number" required error={errors.phone}>
              <FocusInput
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                hasError={!!errors.phone}
                maxLength={10}
              />
            </Field>
            <Field label="Email Address" error={errors.email}>
              <FocusInput
                type="email"
                placeholder="ramesh@example.com (optional)"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                hasError={!!errors.email}
              />
            </Field>
            <Field label="City" required error={errors.city}>
              <FocusSelect
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                hasError={!!errors.city}
              >
                <option value="">Select city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </FocusSelect>
            </Field>
            <Field label="Locality / Area">
              <FocusInput
                type="text"
                placeholder="e.g. Banjara Hills, Ameerpet…"
                value={form.area}
                onChange={(e) => set("area", e.target.value)}
              />
            </Field>
            <InfoNote>
              Your contact details are shared only with the Raksha AI care coordinator and never with patients or third parties directly.
            </InfoNote>
          </div>
        );

      case "medical":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionTitle>Medical Information</SectionTitle>
            <Field label="Blood Group" required error={errors.bloodGroup}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {BLOOD_GROUPS.map((bg) => {
                  const active = form.bloodGroup === bg;
                  return (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => set("bloodGroup", bg)}
                      style={{
                        background: active ? "#C0152A" : "transparent",
                        color: active ? "#fff" : "#9CA3AF",
                        border: `1px solid ${active ? "#C0152A" : errors.bloodGroup ? "#C0152A" : "#1e293b"}`,
                        padding: "10px 18px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        borderRadius: 0,
                        transition: "all 0.15s",
                        minWidth: 56,
                      }}
                    >
                      {bg}
                    </button>
                  );
                })}
              </div>
              {errors.bloodGroup && (
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    color: "#C0152A",
                  }}
                >
                  ⚠ {errors.bloodGroup}
                </span>
              )}
            </Field>
            <Field label="Date of Last Donation">
              <FocusInput
                type="date"
                value={form.lastDonation}
                onChange={(e) => set("lastDonation", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </Field>
            <Toggle
              checked={form.hasThalassemiaDonation}
              onChange={(v) => set("hasThalassemiaDonation", v)}
              label="I have donated for thalassemia patients before"
              sublabel="Experienced donors are prioritised in the matching algorithm"
            />
            <Field label="Existing Medical Conditions">
              <FocusTextarea
                placeholder="List any chronic conditions, surgeries, or health issues (leave blank if none)"
                value={form.medicalConditions}
                onChange={(e) => set("medicalConditions", e.target.value)}
                rows={3}
              />
            </Field>
            <Field label="Current Medications">
              <FocusTextarea
                placeholder="List any medications you are currently taking (leave blank if none)"
                value={form.medications}
                onChange={(e) => set("medications", e.target.value)}
                rows={2}
              />
            </Field>
            <InfoNote>
              Medical information is reviewed by our care coordinator. Certain medications or conditions may temporarily defer eligibility — this is assessed individually.
            </InfoNote>
          </div>
        );

      case "availability":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionTitle>Availability &amp; Commitment</SectionTitle>
            <Field
              label="When are you available to donate?"
              required
              error={errors.availability}
            >
              <ChipSelect
                options={AVAILABILITY_OPTIONS}
                selected={form.availability}
                onChange={(v) => set("availability", v)}
              />
            </Field>
            <Field label="Willing to travel up to" required error={errors.travelRadius}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TRAVEL_OPTIONS.map((opt) => {
                  const active = form.travelRadius === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set("travelRadius", opt)}
                      style={{
                        background: active ? "#2CA8A0" : "transparent",
                        color: active ? "#fff" : "#9CA3AF",
                        border: `1px solid ${active ? "#2CA8A0" : errors.travelRadius ? "#C0152A" : "#1e293b"}`,
                        padding: "9px 16px",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12,
                        fontWeight: active ? 600 : 400,
                        cursor: "pointer",
                        borderRadius: 0,
                        transition: "all 0.15s",
                      }}
                    >
                      {active ? "✓ " : ""}
                      {opt}
                    </button>
                  );
                })}
              </div>
              {errors.travelRadius && (
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    color: "#C0152A",
                  }}
                >
                  ⚠ {errors.travelRadius}
                </span>
              )}
            </Field>
            <Toggle
              checked={form.emergencyAvailable}
              onChange={(v) => set("emergencyAvailable", v)}
              label="Available for emergency requests"
              sublabel="You may be contacted with little notice in critical situations"
            />
            <div
              style={{
                background: "rgba(192,21,42,0.08)",
                border: "1px solid rgba(192,21,42,0.3)",
                borderRadius: 8,
                padding: "14px 18px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#9CA3AF",
                lineHeight: 1.7,
              }}
            >
              <span style={{ color: "#C0152A", fontWeight: 600 }}>
                ◆ What this means:
              </span>{" "}
              You are committing to be available for Arjun's transfusion schedule,
              approximately every 45–60 days. You will always be contacted at least
              7 days in advance for planned donations.
            </div>
          </div>
        );

      case "consent":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionTitle>Consent &amp; Declaration</SectionTitle>

            <div
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: "16px 20px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#9CA3AF",
                lineHeight: 1.8,
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: "#6B7280",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Donor Agreement — Please Read
              </div>
              By registering as a donor on Raksha AI, you acknowledge that:{" "}
              <strong style={{ color: "#FAF9F7" }}>
                (1) Your personal and medical data will be stored securely and used
                solely to match you with patients requiring blood transfusions.
              </strong>{" "}
              (2) Your identity is protected and will not be shared directly with
              patients. All communication is mediated by a certified care
              coordinator.{" "}
              <strong style={{ color: "#FAF9F7" }}>
                (3) Donation is entirely voluntary. You may withdraw from the circle
                at any time by contacting your coordinator.
              </strong>{" "}
              (4) Raksha AI is a coordination platform and does not conduct blood
              collection directly. All donations occur at certified centres. (5) You
              confirm that the information provided is accurate to the best of your
              knowledge.
            </div>

            <Toggle
              checked={form.consentData}
              onChange={(v) => set("consentData", v)}
              label="I agree to the data processing terms above"
              sublabel="Required to proceed"
            />
            {errors.consentData && (
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: "#C0152A",
                  marginTop: -8,
                }}
              >
                ⚠ {errors.consentData}
              </span>
            )}

            <Toggle
              checked={form.consentContact}
              onChange={(v) => set("consentContact", v)}
              label="I consent to being contacted for donation appointments"
              sublabel="Via phone call or SMS from the care coordinator"
            />
            {errors.consentContact && (
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: "#C0152A",
                  marginTop: -8,
                }}
              >
                ⚠ {errors.consentContact}
              </span>
            )}

            {/* Summary card */}
            <div
              style={{
                background: "#111827",
                borderTop: "2px solid #C0152A",
                borderRadius: "0 0 10px 10px",
                padding: "18px 20px",
                marginTop: 8,
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: "#C0152A",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Registration Summary
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px 20px",
                }}
              >
                {[
                  ["Name", `${form.firstName} ${form.lastName}`],
                  ["Blood Group", form.bloodGroup || "—"],
                  ["City", form.city || "—"],
                  ["Phone", form.phone || "—"],
                  ["Availability", form.availability.length > 0 ? `${form.availability.length} slots` : "—"],
                  ["Emergency", form.emergencyAvailable ? "Yes ✓" : "No"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 10,
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                      }}
                    >
                      {k}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        color: "#FAF9F7",
                        marginTop: 2,
                      }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <PageShell>
        <SuccessScreen
          name={form.firstName}
          blood={form.bloodGroup}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div ref={topRef} />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: "#C0152A",
            letterSpacing: "1.8px",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Join the Network
        </div>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 34,
            fontWeight: 700,
            color: "#FAF9F7",
            lineHeight: 1.2,
          }}
        >
          Become a Donor.
          <br />
          <span
            style={{
              color: "#9CA3AF",
              fontSize: 22,
              fontWeight: 600,
              fontStyle: "italic",
            }}
          >
            Save a life, one cycle at a time.
          </span>
        </div>
      </div>

      <StepIndicator steps={STEPS} currentIndex={stepIndex} />
      <ProgressBar current={stepIndex + 1} total={STEPS.length} />

      {/* Form body */}
      <div
        style={{
          background: "#111827",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: "28px 28px",
        }}
      >
        {renderStep()}
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 24,
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          disabled={stepIndex === 0}
          style={{
            background: "transparent",
            color: stepIndex === 0 ? "#1e293b" : "#9CA3AF",
            border: `1px solid ${stepIndex === 0 ? "#1e293b" : "#6B7280"}`,
            padding: "12px 24px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            cursor: stepIndex === 0 ? "not-allowed" : "pointer",
            borderRadius: 0,
          }}
        >
          ← Back
        </button>

        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "#6B7280",
          }}
        >
          {stepIndex + 1} / {STEPS.length}
        </div>

        <button
          type="button"
          onClick={handleNext}
          style={{
            background: "#C0152A",
            color: "#fff",
            border: "none",
            padding: "13px 28px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            borderRadius: 0,
            letterSpacing: "0.5px",
            minWidth: 160,
          }}
        >
          {stepIndex === STEPS.length - 1
            ? "COMPLETE REGISTRATION →"
            : `NEXT: ${STEPS[stepIndex + 1]?.label?.toUpperCase()} →`}
        </button>
      </div>

      {/* Privacy footer */}
      <div
        style={{
          marginTop: 24,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: "#6B7280",
          textAlign: "center",
          lineHeight: 1.7,
          fontStyle: "italic",
        }}
      >
        Your data is encrypted and never shared with third parties.
        <br />
        Donor identities are protected under Raksha AI's privacy protocol.
      </div>
    </PageShell>
  );
}

// ── LAYOUT HELPERS ─────────────────────────────────────────────────────────────
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D0D0D",
        color: "#FAF9F7",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('${FONT_URL}');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A1628; }
        ::-webkit-scrollbar-thumb { background: #C0152A; border-radius: 2px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        select option { background: #0A1628; color: #FAF9F7; }
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Top nav bar */}
      <div
        style={{
          borderBottom: "1px solid #1e293b",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "sticky",
          top: 0,
          background: "rgba(13,13,13,0.95)",
          backdropFilter: "blur(8px)",
          zIndex: 50,
        }}
      >
        <Logo />
        <div
          style={{
            width: 1,
            height: 24,
            background: "#1e293b",
            marginLeft: 8,
          }}
        />
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "#6B7280",
          }}
        >
          Donor Registration
        </span>
      </div>

      {/* Page content */}
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 22,
        fontWeight: 700,
        color: "#FAF9F7",
        paddingBottom: 12,
        borderBottom: "1px solid #1e293b",
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(44,168,160,0.07)",
        borderLeft: "2px solid #2CA8A0",
        padding: "12px 16px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        color: "#9CA3AF",
        lineHeight: 1.7,
        borderRadius: "0 6px 6px 0",
      }}
    >
      {children}
    </div>
  );
}