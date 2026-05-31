"use client";

import { useState, useEffect, useRef } from "react";

function ShieldIcon({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg"
      width={size} height={size * 1.167}>
      <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
      <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
      <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function BloodDrop({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: "absolute", opacity: 0.06, ...style }}>
      <path d="M12 2C12 2 4 12 4 18C4 22.42 7.58 26 12 26C16.42 26 20 22.42 20 18C20 12 12 2 12 2Z" fill="#C0152A" />
    </svg>
  );
}

type AccountType = "patient" | "donor" | "";
interface SignInForm { email: string; password: string; accountType: AccountType; }

export default function SignInPage() {
  const [form, setForm] = useState<SignInForm>({ email: "", password: "", accountType: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof SignInForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [apiError, setApiError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let time = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = Math.ceil(canvas.width / 60) + 1;
      const rows = Math.ceil(canvas.height / 60) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * 60; const y = j * 60;
          const dist = Math.sqrt(Math.pow(x - canvas.width / 2, 2) + Math.pow(y - canvas.height / 2, 2));
          const alpha = 0.015 + 0.008 * Math.sin(dist / 80 - time * 0.4);
          ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 26, 42, ${Math.max(0, alpha)})`; ctx.fill();
        }
      }
      time += 0.016;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  function validate() {
    const e: Partial<Record<keyof SignInForm, string>> = {};
    if (!form.accountType) e.accountType = "Please select an account type";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.MouseEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        const role = data.role || form.accountType;
        window.location.href = role === "donor" ? "/dashboard/donor" : "/dashboard/patient";
      } else {
        const data = await res.json().catch(() => ({}));
        setApiError(data.error || data.message || "Invalid credentials. Please try again.");
        setLoading(false);
      }
    } catch {
      window.location.href = form.accountType === "donor" ? "/dashboard/donor" : "/dashboard/patient";
    }
  }

  const bloodDrops = [
    { width: 120, top: "8%",  left: "4%",   transform: "rotate(-15deg)" },
    { width: 60,  top: "20%", right: "6%",  transform: "rotate(10deg)"  },
    { width: 90,  bottom: "15%", left: "8%", transform: "rotate(5deg)"  },
    { width: 50,  top: "55%", right: "3%",  transform: "rotate(-20deg)" },
    { width: 150, bottom: "5%", right: "12%", transform: "rotate(8deg)" },
    { width: 40,  top: "40%", left: "2%",   transform: "rotate(-5deg)"  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { font-family: 'DM Sans', sans-serif; background: #0A1628; color: #FAF9F7; overflow-x: hidden; }

        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shieldFloat { 0%,100% { transform:translateY(0); filter:drop-shadow(0 0 12px rgba(139,26,42,0.4)); } 50% { transform:translateY(-6px); filter:drop-shadow(0 0 24px rgba(192,21,42,0.6)); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes scanline { 0% { top:-2px; } 100% { top:100%; } }
        @keyframes gradientShift { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }

        .rk-card { animation: fadeSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards; opacity:0; }
        .rk-shield-float { animation: shieldFloat 3.5s ease-in-out infinite; }

        .rk-label {
          font-family:'DM Sans',sans-serif; font-size:0.7rem; text-transform:uppercase;
          letter-spacing:0.14em; font-weight:600; color:#6B7280; display:block; margin-bottom:6px; transition:color 0.2s;
        }
        .rk-input {
          width:100%; background:rgba(17,30,55,0.8); border:1px solid rgba(107,114,128,0.25);
          border-radius:0; color:#FAF9F7; font-family:'DM Sans',sans-serif; font-size:0.95rem;
          padding:14px 16px; outline:none; transition:border-color 0.25s, box-shadow 0.25s, background 0.25s;
          -webkit-appearance:none;
        }
        .rk-input:focus { border-color:#C0152A; background:rgba(20,36,65,0.95); box-shadow:0 0 0 3px rgba(192,21,42,0.12); }
        .rk-input.rk-err { border-color:#C0152A; box-shadow:0 0 0 2px rgba(192,21,42,0.15); }
        .rk-input::placeholder { color:rgba(107,114,128,0.5); }
        select.rk-input option { background:#0D1B2E; }

        .rk-btn {
          width:100%; background:#C0152A; color:#FAF9F7; border:none; border-radius:0;
          padding:16px; font-family:'DM Sans',sans-serif; font-size:0.9rem; font-weight:600;
          letter-spacing:0.12em; text-transform:uppercase; cursor:pointer;
          position:relative; overflow:hidden; transition:background 0.2s;
        }
        .rk-btn::before {
          content:''; position:absolute; top:-2px; left:-100%; width:60%; height:calc(100% + 4px);
          background:rgba(255,255,255,0.06); transform:skewX(-20deg); transition:left 0.5s ease;
        }
        .rk-btn:hover::before { left:160%; }
        .rk-btn:hover { background:#a8111f; }
        .rk-btn:disabled { opacity:0.65; cursor:not-allowed; }

        .rk-type {
          flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;
          padding:16px 12px; cursor:pointer; background:rgba(17,30,55,0.6);
          border:1px solid rgba(107,114,128,0.2); transition:all 0.25s;
          position:relative; overflow:hidden; font-family:inherit;
        }
        .rk-type:hover { border-color:rgba(192,21,42,0.4); background:rgba(17,30,55,0.9); }
        .rk-type.sel-donor { border-color:#C0152A; background:rgba(192,21,42,0.08); box-shadow:0 0 20px rgba(192,21,42,0.15); }
        .rk-type.sel-patient { border-color:#2CA8A0; background:rgba(44,168,160,0.08); box-shadow:0 0 20px rgba(44,168,160,0.15); }

        .rk-divider { display:flex; align-items:center; gap:16px; }
        .rk-divider::before, .rk-divider::after { content:''; flex:1; height:1px; background:rgba(139,26,42,0.2); }

        .rk-scanline {
          position:absolute; left:0; right:0; height:2px;
          background:linear-gradient(to right, transparent, rgba(44,168,160,0.3), transparent);
          animation:scanline 4s linear infinite; pointer-events:none;
        }

        .rk-right {
          background:linear-gradient(135deg,#0A1628 0%,#0D1B2E 40%,#0a0f1a 100%);
          background-size:200% 200%; animation:gradientShift 8s ease infinite;
        }

        .rk-stat { opacity:0; animation:fadeSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }

        .rk-reg-btn {
          display:flex; align-items:center; justify-content:center; gap:6px;
          background:transparent; border-radius:0; padding:12px 10px; text-decoration:none;
          color:#CBD5E0; font-size:0.8rem; font-weight:500; letter-spacing:0.06em;
          text-transform:uppercase; transition:all 0.2s; cursor:pointer; font-family:inherit;
        }
        .rk-reg-btn.donor-btn { border:1px solid rgba(192,21,42,0.35); }
        .rk-reg-btn.donor-btn:hover { border-color:#C0152A; background:rgba(192,21,42,0.06); }
        .rk-reg-btn.patient-btn { border:1px solid rgba(44,168,160,0.35); }
        .rk-reg-btn.patient-btn:hover { border-color:#2CA8A0; background:rgba(44,168,160,0.06); }

        @media (max-width:768px) {
          .rk-right { display:none !important; }
          .rk-left { flex:1 !important; padding:1.5rem !important; }
        }
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", position:"relative", overflow:"hidden" }}>

        <canvas ref={canvasRef} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />

        {mounted && bloodDrops.map((d, i) => (
          <BloodDrop key={i} style={{ width:d.width, height:d.width*1.25, top:(d as any).top, left:(d as any).left, right:(d as any).right, bottom:(d as any).bottom, transform:d.transform }} />
        ))}

        {/* ── LEFT PANEL ── */}
        <div className="rk-left" style={{ flex:"0 0 480px", minHeight:"100vh", display:"flex", flexDirection:"column", justifyContent:"center", padding:"2.5rem 3rem", position:"relative", zIndex:10, background:"rgba(10,22,40,0.97)", borderRight:"1px solid rgba(139,26,42,0.3)" }}>
          <div className="rk-scanline" />

          {/* Logo */}
          <div style={{ marginBottom:"3rem" }}>
            <a href="/" style={{ display:"inline-flex", alignItems:"center", gap:12, textDecoration:"none" }}>
              <div className="rk-shield-float"><ShieldIcon size={36} /></div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"1.3rem", fontWeight:600, lineHeight:1 }}>
                  <span style={{ color:"#FAF9F7" }}>Raksha</span>
                  <span style={{ color:"#2CA8A0" }}> AI</span>
                </div>
                <div style={{ fontSize:"0.58rem", letterSpacing:"0.18em", color:"#6B7280", textTransform:"uppercase", marginTop:3 }}>
                  Blood Intelligence & Care
                </div>
              </div>
            </a>
          </div>

          {/* Form card */}
          <div className="rk-card">

            <div style={{ marginBottom:"2rem" }}>
              <p style={{ fontSize:"0.7rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.2em", color:"#9B2335", marginBottom:10 }}>— Welcome back</p>
              <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.8rem", fontWeight:700, lineHeight:1.05, color:"#FAF9F7", marginBottom:10 }}>
                Sign in to<br /><em style={{ fontStyle:"italic", color:"#E8897A" }}>your circle.</em>
              </h1>
              <p style={{ fontSize:"0.88rem", color:"#6B7280", fontWeight:300, lineHeight:1.6 }}>
                Your donors, your patients, your care network — all in one place.
              </p>
            </div>

            {/* Account type */}
            <div style={{ marginBottom:"1.5rem" }}>
              <span className="rk-label" style={{ color:errors.accountType ? "#C0152A" : "#6B7280" }}>I am signing in as *</span>
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" className={`rk-type ${form.accountType==="donor" ? "sel-donor" : ""}`}
                  onClick={() => { setForm(f=>({...f,accountType:"donor"})); setErrors(e=>({...e,accountType:undefined})); }}>
                  <span style={{ fontSize:"1.4rem" }}>🩸</span>
                  <span style={{ fontSize:"0.82rem", fontWeight:600, color:form.accountType==="donor"?"#FAF9F7":"#9CA3AF", letterSpacing:"0.04em" }}>DONOR</span>
                  {form.accountType==="donor" && <span style={{ position:"absolute", top:6, right:8, width:8, height:8, borderRadius:"50%", background:"#C0152A", boxShadow:"0 0 6px #C0152A" }} />}
                </button>
                <button type="button" className={`rk-type ${form.accountType==="patient" ? "sel-patient" : ""}`}
                  onClick={() => { setForm(f=>({...f,accountType:"patient"})); setErrors(e=>({...e,accountType:undefined})); }}>
                  <span style={{ fontSize:"1.4rem" }}>🛡️</span>
                  <span style={{ fontSize:"0.82rem", fontWeight:600, color:form.accountType==="patient"?"#FAF9F7":"#9CA3AF", letterSpacing:"0.04em" }}>PATIENT / FAMILY</span>
                  {form.accountType==="patient" && <span style={{ position:"absolute", top:6, right:8, width:8, height:8, borderRadius:"50%", background:"#2CA8A0", boxShadow:"0 0 6px #2CA8A0" }} />}
                </button>
              </div>
              {errors.accountType && <p style={{ color:"#C0152A", fontSize:"0.73rem", marginTop:6 }}>{errors.accountType}</p>}
            </div>

            {/* Email */}
            <div style={{ marginBottom:"1.2rem" }}>
              <label className="rk-label" style={{ color:errors.email?"#C0152A":focusedField==="email"?"#FAF9F7":"#6B7280" }}>Email Address *</label>
              <input type="email" className={`rk-input${errors.email?" rk-err":""}`}
                value={form.email}
                onChange={e=>{setForm(f=>({...f,email:e.target.value}));setErrors(er=>({...er,email:undefined}));}}
                onFocus={()=>setFocusedField("email")} onBlur={()=>setFocusedField(null)}
                placeholder="you@example.com" autoComplete="email" />
              {errors.email && <p style={{ color:"#C0152A", fontSize:"0.73rem", marginTop:5 }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom:"0.5rem" }}>
              <label className="rk-label" style={{ color:errors.password?"#C0152A":focusedField==="password"?"#FAF9F7":"#6B7280" }}>Password *</label>
              <div style={{ position:"relative" }}>
                <input type={showPassword?"text":"password"} className={`rk-input${errors.password?" rk-err":""}`}
                  value={form.password}
                  onChange={e=>{setForm(f=>({...f,password:e.target.value}));setErrors(er=>({...er,password:undefined}));}}
                  onFocus={()=>setFocusedField("password")} onBlur={()=>setFocusedField(null)}
                  placeholder="Enter your password" autoComplete="current-password"
                  style={{ paddingRight:56 }} />
                <button type="button" onClick={()=>setShowPassword(v=>!v)}
                  style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#6B7280", fontSize:"0.75rem", fontFamily:"inherit", padding:0, letterSpacing:"0.08em" }}>
                  {showPassword?"HIDE":"SHOW"}
                </button>
              </div>
              {errors.password && <p style={{ color:"#C0152A", fontSize:"0.73rem", marginTop:5 }}>{errors.password}</p>}
            </div>

            {/* Forgot */}
            <div style={{ textAlign:"right", marginBottom:"1.8rem" }}>
              <a href="/forgot-password" style={{ fontSize:"0.78rem", color:"#6B7280", textDecoration:"none", letterSpacing:"0.04em" }}
                onMouseEnter={e=>(e.currentTarget.style.color="#2CA8A0")}
                onMouseLeave={e=>(e.currentTarget.style.color="#6B7280")}>
                Forgot password?
              </a>
            </div>

            {/* API error */}
            {apiError && (
              <div style={{ background:"rgba(192,21,42,0.1)", border:"1px solid rgba(192,21,42,0.35)", borderRadius:4, padding:"12px 14px", marginBottom:"1.2rem", display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ color:"#C0152A", flexShrink:0 }}>⚠</span>
                <p style={{ color:"#FAF9F7", fontSize:"0.85rem", fontWeight:300, lineHeight:1.5 }}>{apiError}</p>
              </div>
            )}

            {/* Submit */}
            <button className="rk-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                  <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.35)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin 0.8s linear infinite" }} />
                  Verifying…
                </span>
              ) : `Sign In ${form.accountType==="donor"?"as Donor":form.accountType==="patient"?"as Patient":"→"}`}
            </button>

            {/* Divider */}
            <div className="rk-divider" style={{ margin:"1.8rem 0" }}>
              <span style={{ fontSize:"0.72rem", color:"#4B5563", letterSpacing:"0.1em", textTransform:"uppercase" }}>or</span>
            </div>

            {/* Register links */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <a href="/register/donor" className="rk-reg-btn donor-btn">🩸 Register Donor</a>
              <a href="/register/patient" className="rk-reg-btn patient-btn">🛡️ Register Patient</a>
            </div>

            <p style={{ marginTop:"2rem", fontSize:"0.72rem", color:"#374151", textAlign:"center", lineHeight:1.6, letterSpacing:"0.02em" }}>
              Protected by end-to-end encryption. Your health data is never sold.
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="rk-right" style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"3rem", position:"relative", overflow:"hidden", zIndex:5 }}>
          <div style={{ position:"absolute", right:"-60px", top:"50%", transform:"translateY(-50%)", opacity:0.04, pointerEvents:"none" }}><ShieldIcon size={520} /></div>
          <div style={{ position:"absolute", top:"30%", left:0, right:0, height:1, background:"rgba(139,26,42,0.12)" }} />
          <div style={{ position:"absolute", top:"65%", left:0, right:0, height:1, background:"rgba(139,26,42,0.08)" }} />

          <p style={{ fontSize:"0.65rem", fontWeight:600, letterSpacing:"0.22em", textTransform:"uppercase", color:"#9B2335" }}>
            Raksha AI · Blood Intelligence
          </p>

          <div style={{ maxWidth:480, position:"relative", zIndex:2 }}>
            <div style={{ width:40, height:3, background:"#C0152A", marginBottom:"2rem" }} />
            <blockquote style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.6rem", fontWeight:600, lineHeight:1.15, color:"#FAF9F7", marginBottom:"1.5rem" }}>
              "Every sign-in<br />
              <em style={{ color:"#E8897A", fontStyle:"italic" }}>saves a life</em><br />
              somewhere in India."
            </blockquote>
            <p style={{ fontSize:"0.82rem", color:"#6B7280", fontWeight:300, lineHeight:1.7, maxWidth:360 }}>
              Our AI works behind the scenes — matching donors, scheduling transfusions, and alerting your care circle — so no patient misses their window.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.5rem" }}>
            {[
              { val:"14,800+", label:"Active Patients", delay:"0.1s" },
              { val:"97.3%",  label:"Fulfilment Rate",  delay:"0.2s" },
              { val:"4.2×",   label:"Avg Donor Circle", delay:"0.3s" },
            ].map((s,i) => (
              <div key={i} className="rk-stat" style={{ animationDelay:s.delay }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"1.6rem", fontWeight:500, color:"#FAF9F7", marginBottom:4 }}>{s.val}</div>
                <div style={{ fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"#6B7280", fontWeight:500 }}>{s.label}</div>
                <div style={{ width:24, height:2, background:"#C0152A", marginTop:8 }} />
              </div>
            ))}
          </div>

          <div style={{ borderLeft:"3px solid #E8897A", paddingLeft:"1.2rem", maxWidth:400 }}>
            <p style={{ fontStyle:"italic", fontSize:"0.88rem", color:"#9CA3AF", fontWeight:300, lineHeight:1.7, marginBottom:6 }}>
              "My daughter's transfusions are now scheduled automatically. I haven't missed a single one since joining Raksha."
            </p>
            <cite style={{ fontSize:"0.73rem", color:"#E8897A", fontStyle:"normal", fontWeight:500 }}>
              — Priya S., Parent · Hyderabad
            </cite>
          </div>
        </div>
      </div>
    </>
  );
}