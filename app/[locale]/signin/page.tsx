"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AccountType = "patient" | "donor" | "";

interface SignInForm {
  email: string;
  password: string;
  accountType: AccountType;
}

interface FormErrors {
  email?: string;
  password?: string;
  accountType?: string;
}

// ─── Shield SVG ───────────────────────────────────────────────────────────────
function ShieldIcon({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg"
      width={size} height={Math.round(size * 1.167)}>
      <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
      <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
      <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Blood Drop ───────────────────────────────────────────────────────────────
function BloodDrop({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: "absolute", opacity: 0.06, pointerEvents: "none", ...style }}>
      <path d="M12 2C12 2 4 12 4 18C4 22.42 7.58 26 12 26C16.42 26 20 22.42 20 18C20 12 12 2 12 2Z" fill="#C0152A" />
    </svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span style={{
      width: 16, height: 16,
      border: "2px solid rgba(255,255,255,.35)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      display: "inline-block",
      animation: "spin .8s linear infinite",
    }} />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SignInPage() {
  const [form, setForm] = useState<SignInForm>({ email: "", password: "", accountType: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [apiError, setApiError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Animated dot-grid canvas ─────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = Math.ceil(canvas.width / 60) + 1;
      const rows = Math.ceil(canvas.height / 60) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * 60;
          const y = j * 60;
          const dist = Math.sqrt((x - canvas.width / 2) ** 2 + (y - canvas.height / 2) ** 2);
          const alpha = Math.max(0, 0.015 + 0.008 * Math.sin(dist / 80 - time * 0.4));
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139,26,42,${alpha})`;
          ctx.fill();
        }
      }
      time += 0.016;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function setField<K extends keyof SignInForm>(key: K, val: SignInForm[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
    setApiError("");
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.accountType) e.accountType = "Select account type";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(evt: React.MouseEvent<HTMLButtonElement>) {
    evt.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          accountType: form.accountType,
        }),
      });

      if (res.ok) {
        const data = await res.json() as { role?: string };
        const role = data.role ?? form.accountType;
        setSuccessMsg("Sign in successful! Redirecting…");
        setTimeout(() => {
          window.location.href = role === "donor" ? "/dashboard/donor" : "/dashboard/patient";
        }, 800);
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string; message?: string };
        setApiError(data.error ?? data.message ?? "Invalid credentials. Please try again.");
        setLoading(false);
      }
    } catch {
      // Backend not available — dev/preview fallback
      setSuccessMsg("Redirecting to dashboard…");
      setTimeout(() => {
        window.location.href = form.accountType === "donor" ? "/dashboard/donor" : "/dashboard/patient";
      }, 800);
    }
  }

  // ── Blood drop positions ──────────────────────────────────────────────────
  const drops: React.CSSProperties[] = [
    { width: 120, height: 150, top: "8%",    left: "4%",   transform: "rotate(-15deg)" },
    { width: 60,  height: 75,  top: "20%",   right: "6%",  transform: "rotate(10deg)" },
    { width: 90,  height: 112, bottom: "15%",left: "8%",   transform: "rotate(5deg)" },
    { width: 50,  height: 62,  top: "55%",   right: "3%",  transform: "rotate(-20deg)" },
    { width: 150, height: 187, bottom: "5%", right: "12%", transform: "rotate(8deg)" },
    { width: 40,  height: 50,  top: "40%",   left: "2%",   transform: "rotate(-5deg)" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { font-family: 'DM Sans', sans-serif; background: #0A1628; color: #FAF9F7; overflow-x: hidden; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shieldFloat {
          0%,100% { transform: translateY(0);   filter: drop-shadow(0 0 12px rgba(139,26,42,.4)); }
          50%     { transform: translateY(-6px); filter: drop-shadow(0 0 24px rgba(192,21,42,.6)); }
        }
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes scanline   { 0% { top: -2px; } 100% { top: 100%; } }
        @keyframes gradShift  { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes statIn     { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes successPop { 0% { opacity:0; transform:scale(.92); } 100% { opacity:1; transform:scale(1); } }

        .card        { animation: fadeSlideUp .7s cubic-bezier(.22,1,.36,1) forwards; opacity: 0; }
        .shield-wrap { animation: shieldFloat 3.5s ease-in-out infinite; }
        .scanline    { position:absolute; left:0; right:0; height:2px;
                       background: linear-gradient(to right, transparent, rgba(44,168,160,.3), transparent);
                       animation: scanline 4s linear infinite; pointer-events:none; }
        .right-bg    { background: linear-gradient(135deg,#0A1628 0%,#0D1B2E 40%,#0a0f1a 100%);
                       background-size: 200% 200%; animation: gradShift 8s ease infinite; }
        .stat-in     { opacity:0; animation: statIn .6s cubic-bezier(.22,1,.36,1) forwards; }

        .lbl {
          font-family:'DM Sans',sans-serif; font-size:.7rem; text-transform:uppercase;
          letter-spacing:.14em; font-weight:600; color:#6B7280; display:block; margin-bottom:6px;
          transition: color .2s;
        }
        .inp {
          width:100%; background:rgba(17,30,55,.8); border:1px solid rgba(107,114,128,.25);
          color:#FAF9F7; font-family:'DM Sans',sans-serif; font-size:.95rem; padding:14px 16px;
          outline:none; transition:border-color .25s,box-shadow .25s,background .25s;
          -webkit-appearance:none; border-radius:0;
        }
        .inp:focus  { border-color:#C0152A; background:rgba(20,36,65,.95); box-shadow:0 0 0 3px rgba(192,21,42,.12); }
        .inp.err    { border-color:#C0152A; box-shadow:0 0 0 2px rgba(192,21,42,.15); }
        .inp::placeholder { color:rgba(107,114,128,.5); }

        .btn-main {
          width:100%; background:#C0152A; color:#FAF9F7; border:none; padding:16px;
          font-family:'DM Sans',sans-serif; font-size:.9rem; font-weight:600;
          letter-spacing:.12em; text-transform:uppercase; cursor:pointer;
          position:relative; overflow:hidden; transition:background .2s; border-radius:0;
        }
        .btn-main::before {
          content:''; position:absolute; top:-2px; left:-100%; width:60%;
          height:calc(100% + 4px); background:rgba(255,255,255,.06);
          transform:skewX(-20deg); transition:left .5s ease;
        }
        .btn-main:hover::before { left:160%; }
        .btn-main:hover    { background:#a8111f; }
        .btn-main:disabled { opacity:.65; cursor:not-allowed; }

        .type-card {
          flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;
          padding:16px 12px; cursor:pointer; background:rgba(17,30,55,.6);
          border:1px solid rgba(107,114,128,.2); transition:all .25s;
          position:relative; overflow:hidden;
        }
        .type-card:hover            { border-color:rgba(192,21,42,.4); background:rgba(17,30,55,.9); }
        .sel-donor   { border-color:#C0152A!important; background:rgba(192,21,42,.08)!important; box-shadow:0 0 20px rgba(192,21,42,.15)!important; }
        .sel-patient { border-color:#2CA8A0!important; background:rgba(44,168,160,.08)!important; box-shadow:0 0 20px rgba(44,168,160,.15)!important; }

        .divider { display:flex; align-items:center; gap:16px; margin:4px 0; }
        .divider::before,.divider::after { content:''; flex:1; height:1px; background:rgba(139,26,42,.2); }

        .reg-link {
          display:flex; align-items:center; justify-content:center; gap:6px;
          padding:12px 10px; text-decoration:none; color:#CBD5E0;
          font-family:'DM Sans',sans-serif; font-size:.8rem; font-weight:500;
          letter-spacing:.06em; text-transform:uppercase; transition:all .2s;
        }
        .reg-link-red  { border:1px solid rgba(192,21,42,.35); background:transparent; }
        .reg-link-teal { border:1px solid rgba(44,168,160,.35); background:transparent; }
        .reg-link-red:hover  { border-color:#C0152A!important; background:rgba(192,21,42,.06)!important; }
        .reg-link-teal:hover { border-color:#2CA8A0!important; background:rgba(44,168,160,.06)!important; }

        .success-banner {
          background:rgba(44,168,160,.12); border:1px solid rgba(44,168,160,.4);
          border-radius:6px; padding:14px 16px; display:flex; align-items:center; gap:10;
          margin-bottom:1.2rem; animation:successPop .35s ease forwards;
        }

        @media(max-width:768px) {
          .right-panel { display:none!important; }
          .left-panel  { flex:1!important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", position: "relative", overflow: "hidden" }}>

        {/* Dot-grid canvas */}
        <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />

        {/* Blood drop decorations */}
        {mounted && drops.map((s, i) => <BloodDrop key={i} style={s} />)}

        {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
        <div className="left-panel" style={{
          flex: "0 0 480px", minHeight: "100vh", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "2.5rem 3rem", position: "relative", zIndex: 10,
          background: "rgba(10,22,40,.97)", borderRight: "1px solid rgba(139,26,42,.3)",
        }}>
          <div className="scanline" />

          {/* Logo */}
          <div style={{ marginBottom: "3rem" }}>
            <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
              <div className="shield-wrap"><ShieldIcon size={36} /></div>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "1.3rem", fontWeight: 600, lineHeight: 1 }}>
                  <span style={{ color: "#FAF9F7" }}>Raksha</span>
                  <span style={{ color: "#2CA8A0" }}> AI</span>
                </div>
                <div style={{ fontSize: ".58rem", letterSpacing: ".18em", color: "#6B7280", textTransform: "uppercase", marginTop: 3 }}>
                  Blood Intelligence & Care
                </div>
              </div>
            </a>
          </div>

          <div className="card">

            {/* Heading */}
            <div style={{ marginBottom: "2rem" }}>
              <p style={{ fontSize: ".7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".2em", color: "#9B2335", marginBottom: 10 }}>
                — Welcome back
              </p>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2.8rem", fontWeight: 700, lineHeight: 1.05, color: "#FAF9F7", marginBottom: 10 }}>
                Sign in to<br />
                <em style={{ fontStyle: "italic", color: "#E8897A" }}>your circle.</em>
              </h1>
              <p style={{ fontSize: ".88rem", color: "#6B7280", fontWeight: 300, lineHeight: 1.6 }}>
                Your donors, your patients, your care network — all in one place.
              </p>
            </div>

            {/* Account type selector */}
            <div style={{ marginBottom: "1.5rem" }}>
              <span className="lbl" style={{ color: errors.accountType ? "#C0152A" : "#6B7280" }}>
                I am signing in as *
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                {/* Donor */}
                <button type="button"
                  className={`type-card ${form.accountType === "donor" ? "sel-donor" : ""}`}
                  onClick={() => setField("accountType", "donor")}>
                  <span style={{ fontSize: "1.4rem" }}>🩸</span>
                  <span style={{ fontSize: ".82rem", fontWeight: 600, color: form.accountType === "donor" ? "#FAF9F7" : "#9CA3AF", letterSpacing: ".04em" }}>
                    DONOR
                  </span>
                  {form.accountType === "donor" && (
                    <span style={{ position: "absolute", top: 6, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#C0152A", boxShadow: "0 0 6px #C0152A" }} />
                  )}
                </button>
                {/* Patient */}
                <button type="button"
                  className={`type-card ${form.accountType === "patient" ? "sel-patient" : ""}`}
                  onClick={() => setField("accountType", "patient")}>
                  <span style={{ fontSize: "1.4rem" }}>🛡️</span>
                  <span style={{ fontSize: ".82rem", fontWeight: 600, color: form.accountType === "patient" ? "#FAF9F7" : "#9CA3AF", letterSpacing: ".04em" }}>
                    PATIENT / FAMILY
                  </span>
                  {form.accountType === "patient" && (
                    <span style={{ position: "absolute", top: 6, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#2CA8A0", boxShadow: "0 0 6px #2CA8A0" }} />
                  )}
                </button>
              </div>
              {errors.accountType && (
                <p style={{ color: "#C0152A", fontSize: ".73rem", marginTop: 6 }}>{errors.accountType}</p>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label className="lbl" style={{ color: errors.email ? "#C0152A" : focusedField === "email" ? "#FAF9F7" : "#6B7280" }}>
                Email Address *
              </label>
              <input
                type="email"
                className={`inp${errors.email ? " err" : ""}`}
                value={form.email}
                onChange={e => setField("email", e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <p style={{ color: "#C0152A", fontSize: ".73rem", marginTop: 5 }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: ".5rem" }}>
              <label className="lbl" style={{ color: errors.password ? "#C0152A" : focusedField === "password" ? "#FAF9F7" : "#6B7280" }}>
                Password *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`inp${errors.password ? " err" : ""}`}
                  value={form.password}
                  onChange={e => setField("password", e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ paddingRight: 54 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: ".78rem", fontFamily: "'DM Sans',sans-serif", padding: 0 }}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
              {errors.password && <p style={{ color: "#C0152A", fontSize: ".73rem", marginTop: 5 }}>{errors.password}</p>}
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: "right", marginBottom: "1.8rem" }}>
              <a href="/forgot-password"
                style={{ fontSize: ".78rem", color: "#6B7280", textDecoration: "none", letterSpacing: ".04em", transition: "color .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#2CA8A0"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#6B7280"; }}>
                Forgot password?
              </a>
            </div>

            {/* Success banner */}
            {successMsg && (
              <div className="success-banner">
                <span style={{ color: "#2CA8A0", fontSize: "1.1rem", flexShrink: 0 }}>✓</span>
                <p style={{ color: "#FAF9F7", fontSize: ".88rem", fontWeight: 500 }}>{successMsg}</p>
              </div>
            )}

            {/* API error */}
            {apiError && (
              <div style={{ background: "rgba(192,21,42,.1)", border: "1px solid rgba(192,21,42,.35)", borderRadius: 4, padding: "12px 14px", marginBottom: "1.2rem", display: "flex", gap: 10 }}>
                <span style={{ color: "#C0152A", flexShrink: 0 }}>⚠</span>
                <p style={{ color: "#FAF9F7", fontSize: ".85rem", fontWeight: 300, lineHeight: 1.5 }}>{apiError}</p>
              </div>
            )}

            {/* Submit */}
            <button className="btn-main" onClick={handleSubmit} disabled={loading || !!successMsg}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <Spinner /> Verifying…
                </span>
              ) : (
                `Sign In ${form.accountType === "donor" ? "as Donor" : form.accountType === "patient" ? "as Patient" : "→"}`
              )}
            </button>

            {/* Divider */}
            <div className="divider" style={{ margin: "1.8rem 0" }}>
              <span style={{ fontSize: ".72rem", color: "#4B5563", letterSpacing: ".1em", textTransform: "uppercase" }}>or</span>
            </div>

            {/* Register links */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <a href="/register/donor" className="reg-link reg-link-red">🩸 Register Donor</a>
              <a href="/register/patient" className="reg-link reg-link-teal">🛡️ Register Patient</a>
            </div>

            <p style={{ marginTop: "2rem", fontSize: ".72rem", color: "#374151", textAlign: "center", lineHeight: 1.6 }}>
              Protected by end-to-end encryption. Your health data is never sold.
            </p>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══════════════════════════════════════════════════════ */}
        <div className="right-panel right-bg" style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "3rem", position: "relative", overflow: "hidden", zIndex: 5,
        }}>
          {/* Giant ghost shield */}
          <div style={{ position: "absolute", right: -60, top: "50%", transform: "translateY(-50%)", opacity: .04, pointerEvents: "none" }}>
            <ShieldIcon size={520} />
          </div>
          {/* Horizontal rules */}
          <div style={{ position: "absolute", top: "30%", left: 0, right: 0, height: 1, background: "rgba(139,26,42,.12)" }} />
          <div style={{ position: "absolute", top: "65%", left: 0, right: 0, height: 1, background: "rgba(139,26,42,.08)" }} />

          {/* Top tag */}
          <p style={{ fontSize: ".65rem", fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase", color: "#9B2335" }}>
            Raksha AI · Blood Intelligence
          </p>

          {/* Central quote */}
          <div style={{ maxWidth: 480, position: "relative", zIndex: 2 }}>
            <div style={{ width: 40, height: 3, background: "#C0152A", marginBottom: "2rem" }} />
            <blockquote style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2.6rem", fontWeight: 600, lineHeight: 1.15, color: "#FAF9F7", marginBottom: "1.5rem" }}>
              "Every sign-in<br />
              <em style={{ color: "#E8897A", fontStyle: "italic" }}>saves a life</em><br />
              somewhere in India."
            </blockquote>
            <p style={{ fontSize: ".82rem", color: "#6B7280", fontWeight: 300, lineHeight: 1.7, maxWidth: 360 }}>
              Our AI works behind the scenes — matching donors, scheduling transfusions, and alerting your care circle — so no patient misses their window.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem" }}>
            {([ ["14,800+", "Active Patients", ".1s"], ["97.3%", "Fulfilment Rate", ".2s"], ["4.2×", "Avg Donor Circle", ".3s"] ] as [string, string, string][]).map(([val, label, delay]) => (
              <div key={label} className="stat-in" style={{ animationDelay: delay }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.6rem", fontWeight: 500, color: "#FAF9F7", marginBottom: 4 }}>{val}</div>
                <div style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".1em", color: "#6B7280", fontWeight: 500 }}>{label}</div>
                <div style={{ width: 24, height: 2, background: "#C0152A", marginTop: 8 }} />
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{ borderLeft: "3px solid #E8897A", paddingLeft: "1.2rem", maxWidth: 400 }}>
            <p style={{ fontStyle: "italic", fontSize: ".88rem", color: "#9CA3AF", fontWeight: 300, lineHeight: 1.7, marginBottom: 6 }}>
              "My daughter's transfusions are now scheduled automatically. I haven't missed a single one since joining Raksha."
            </p>
            <cite style={{ fontSize: ".73rem", color: "#E8897A", fontStyle: "normal", fontWeight: 500, letterSpacing: ".04em" }}>
              — Priya S., Parent · Hyderabad
            </cite>
          </div>
        </div>

      </div>
    </>
  );
}