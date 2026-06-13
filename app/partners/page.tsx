"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Navbar } from "@/components/raksha/navbar";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type PartnerType = "Hospital" | "NGO" | "Corporate" | "Technology" | "Other";

interface PartnerFormData {
  name: string;
  organization: string;
  type: PartnerType | "";
  city: string;
  email: string;
  phone: string;
  message: string;
}

interface Partner {
  id: string;
  name: string;
  category: string;
  city: string;
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const CURRENT_PARTNERS: Partner[] = [
  { id: "1", name: "Blood Warriors Foundation", category: "NGO", city: "Mumbai" },
  { id: "2", name: "KEM Hospital", category: "Hospital", city: "Mumbai" },
  { id: "3", name: "Apollo Hospitals", category: "Hospital", city: "Pan India" },
  { id: "4", name: "AIIMS Delhi", category: "Hospital", city: "New Delhi" },
  { id: "5", name: "Sankalp India Foundation", category: "NGO", city: "Bangalore" },
  { id: "6", name: "Thalassemia Society of India", category: "NGO", city: "Mumbai" },
  { id: "7", name: "Prathama Blood Centre", category: "Hospital", city: "Ahmedabad" },
  { id: "8", name: "Technology Partner", category: "Technology", city: "Bangalore" },
];

const PARTNER_CATEGORIES = [
  {
    id: "hospital",
    icon: "🏥",
    iconColor: "#C0152A",
    title: "Hospitals & Blood Banks",
    description: "Integrate your blood bank inventory with Raksha AI. Receive incoming matched donor confirmations directly. Reduce coordination overhead for your staff.",
    cta: "Hospital Partnership →",
    slug: "hospital",
    stats: ["17 hospitals", "3 cities active", "98% match rate"],
  },
  {
    id: "ngo",
    icon: "🤝",
    iconColor: "#2CA8A0",
    title: "NGO & Patient Welfare Orgs",
    description: "If you serve Thalassemia patients or blood disorder communities, Raksha AI can extend your reach. Your patients join our network; your donors become ours too.",
    cta: "NGO Partnership →",
    slug: "ngo",
    stats: ["12 NGOs onboarded", "1L+ patients reached", "8 languages"],
  },
  {
    id: "corporate",
    icon: "🏢",
    iconColor: "#D4A847",
    title: "Corporate CSR Partners",
    description: "Run structured employee blood donation drives with Raksha AI's matching engine. Your employees' donations are routed directly to Thalassemia patients — not a generic blood bank.",
    cta: "CSR Partnership →",
    slug: "corporate",
    stats: ["500+ corporate donors", "₹0 admin cost", "Impact certificates"],
  },
  {
    id: "tech",
    icon: "⚙️",
    iconColor: "#2CA8A0",
    title: "Technology Partners",
    description: "API access for health tech platforms, hospital management systems, and NGO CRMs. WhatsApp Business API, Aadhaar-linked donor verification, and more.",
    cta: "Tech Partnership →",
    slug: "tech",
    stats: ["REST + GraphQL API", "WhatsApp Business", "Webhook support"],
  },
];

const INTEGRATION_STEPS = [
  {
    num: "01",
    title: "Share Requirements",
    body: "Your blood bank shares patient blood type requirements via our secure API or WhatsApp channel — no new software needed.",
    icon: "📤",
  },
  {
    num: "02",
    title: "AI Matches Donors",
    body: "Raksha AI matches and confirms compatible donors from our verified network, factoring in Rh phenotype and Kell antigen.",
    icon: "🧠",
  },
  {
    num: "03",
    title: "Donors Arrive On Schedule",
    body: "Donors arrive at your facility confirmed and on time. Logs are shared with your team automatically.",
    icon: "✅",
  },
];

// ─── HOOKS ───────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCounter(target: number, inView: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return count;
}

// ─── LOGO + NAVBAR ────────────────────────────────────────────────────────────

function RakshaLogo() {
  return (
    <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
      <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="40">
        <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
        <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
        <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "1.35rem", color: "#FAF9F7", letterSpacing: "-0.02em" }}>Raksha</span>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "1.35rem", color: "#2CA8A0", letterSpacing: "-0.02em" }}>AI</span>
      </div>
    </a>
  );
}



// ─── VIDEO BACKGROUND HELPER ──────────────────────────────────────────────────

function VideoBg({ src, overlay, rate = 0.75, children }: { src: string; overlay: string; rate?: number; children: React.ReactNode }) {
  const vRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (vRef.current) vRef.current.playbackRate = rate; }, [rate]);
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: overlay, zIndex: 1 }} />
      <video ref={vRef} autoPlay muted loop playsInline preload="metadata"
        onError={e => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}>
        <source src={src} type="video/mp4" />
      </video>
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}

// ─── GRAIN OVERLAY ────────────────────────────────────────────────────────────

const Grain = () => (
  <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", pointerEvents: "none", zIndex: 0, opacity: 0.6 }} />
);

// ─── SECTION 1 — HERO ─────────────────────────────────────────────────────────

function HeroSection() {
  const { ref, inView } = useInView(0.1);
  const c1 = useCounter(17, inView);
  const c2 = useCounter(500, inView);
  const c3 = useCounter(98, inView);
  return (
    <VideoBg src="https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4" overlay="rgba(10,22,40,0.82)" rate={0.7}>
      <section ref={ref} style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "140px 48px 80px", position: "relative" }}>
        <Grain />
        <div style={{ position: "absolute", top: "20%", right: "8%", width: "360px", height: "360px", background: "radial-gradient(circle, rgba(192,21,42,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          {/* Left */}
          <div style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s cubic-bezier(0.4,0,0.2,1)" }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.22em", color: "#9B2335", textTransform: "uppercase", marginBottom: "20px" }}>PARTNERSHIPS</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(48px,5.5vw,76px)", fontWeight: 700, color: "#FAF9F7", lineHeight: 0.98, letterSpacing: "-2px", margin: "0 0 24px" }}>
              Together, we can ensure<br />
              <span style={{ fontStyle: "italic", color: "#F5ECD7" }}>no patient waits.</span>
            </h1>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "1.1rem", color: "#9CA3AF", fontWeight: 300, maxWidth: "480px", lineHeight: 1.75, margin: "0 0 40px" }}>
              Raksha AI works with hospitals, blood banks, NGOs, and corporate partners to build the most reliable Thalassemia care network India has ever had.
            </p>
            <a href="#partner-form" style={{ display: "inline-block", background: "#C0152A", color: "#FAF9F7", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "0.95rem", padding: "16px 36px", textDecoration: "none", letterSpacing: "0.04em", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#9B2335")}
              onMouseLeave={e => (e.currentTarget.style.background = "#C0152A")}>
              Become a Partner →
            </a>
          </div>
          {/* Right — stats */}
          <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: "20px", opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(32px)", transition: "all 0.7s cubic-bezier(0.4,0,0.2,1) 0.2s" }}>
            {[
              { val: c1, suffix: "", label: "Cities active across India", accent: "#C0152A" },
              { val: c2, suffix: "+", label: "Active donors in the network", accent: "#2CA8A0" },
              { val: c3, suffix: "%", label: "Donor match confirmation rate", accent: "#D4A847" },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(17,24,39,0.85)", border: `1px solid ${i === 0 ? "#1e293b" : "#1e293b"}`, borderLeft: `3px solid ${s.accent}`, padding: "24px 28px", backdropFilter: "blur(8px)" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "2.8rem", fontWeight: 500, color: s.accent, lineHeight: 1, marginBottom: "6px" }}>{s.val}{s.suffix}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", color: "#9CA3AF", fontWeight: 400, letterSpacing: "0.02em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </VideoBg>
  );
}

// ─── SECTION 2 — PARTNER CATEGORIES ──────────────────────────────────────────

function PartnerCategories() {
  const { ref, inView } = useInView();
  const [active, setActive] = useState<string | null>(null);
  return (
    <section ref={ref} style={{ background: "#0D0D0D", padding: "100px 48px", position: "relative", borderTop: "1px solid #8B1A2A" }}>
      <Grain />
      <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.22em", color: "#9B2335", textTransform: "uppercase", marginBottom: "16px", textAlign: "center" }}>HOW WE PARTNER</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(36px,4vw,56px)", fontWeight: 700, color: "#FAF9F7", textAlign: "center", margin: "0 0 64px", letterSpacing: "-1px" }}>
          Four ways to be part of the network.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px" }}>
          {PARTNER_CATEGORIES.map((cat, i) => (
            <div key={cat.id}
              onMouseEnter={() => setActive(cat.id)}
              onMouseLeave={() => setActive(null)}
              style={{
                background: active === cat.id ? "#0F1A2E" : "#111827",
                border: `1px solid ${active === cat.id ? cat.iconColor : "#1e293b"}`,
                borderRadius: "16px", padding: "36px 32px",
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(28px)",
                transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 80}ms`,
                cursor: "default", position: "relative", overflow: "hidden",
              }}>
              {/* Accent glow */}
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", background: `radial-gradient(circle, ${cat.iconColor}18 0%, transparent 70%)`, pointerEvents: "none", transition: "opacity 0.3s", opacity: active === cat.id ? 1 : 0 }} />
              <div style={{ fontSize: "36px", marginBottom: "20px" }}>{cat.icon}</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "1.5rem", color: "#FAF9F7", margin: "0 0 14px", letterSpacing: "-0.3px" }}>{cat.title}</h3>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.9rem", color: "#6B7280", lineHeight: 1.7, margin: "0 0 24px", fontWeight: 300 }}>{cat.description}</p>
              {/* Mini stats */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "28px", flexWrap: "wrap" }}>
                {cat.stats.map((s, si) => (
                  <span key={si} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem", color: cat.iconColor, background: `${cat.iconColor}14`, padding: "4px 10px", letterSpacing: "0.05em" }}>{s}</span>
                ))}
              </div>
              <a href="#partner-form"
                style={{ display: "inline-block", background: "#C0152A", color: "#FAF9F7", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "0.82rem", padding: "11px 22px", textDecoration: "none", letterSpacing: "0.04em", transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#9B2335")}
                onMouseLeave={e => (e.currentTarget.style.background = "#C0152A")}>{cat.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 3 — CURRENT PARTNERS ────────────────────────────────────────────

function CurrentPartners() {
  const { ref, inView } = useInView();
  return (
    <VideoBg src="https://videos.pexels.com/video-files/6823562/6823562-hd_1920_1080_25fps.mp4" overlay="rgba(10,22,40,0.88)" rate={0.6}>
      <section ref={ref} style={{ padding: "100px 48px", borderTop: "1px solid #8B1A2A" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.22em", color: "#9B2335", textTransform: "uppercase", marginBottom: "16px", textAlign: "center" }}>OUR PARTNERS</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(32px,3.5vw,52px)", fontWeight: 700, color: "#FAF9F7", textAlign: "center", margin: "0 0 60px", letterSpacing: "-0.8px" }}>
            Trusted by India's leading healthcare institutions.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
            {CURRENT_PARTNERS.map((p, i) => (
              <div key={p.id}
                style={{
                  background: "#111827", border: "1px solid #8B1A2A", borderRadius: "12px",
                  padding: "28px 20px", textAlign: "center",
                  opacity: inView ? 1 : 0,
                  transform: inView ? "scale(1)" : "scale(0.9)",
                  transition: `all 0.5s cubic-bezier(0.34,1.2,0.64,1) ${i * 60}ms`,
                  cursor: "default",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#0F1A2E"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "#111827"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
              >
                {/* Logo placeholder */}
                <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #8B1A2A, #0A1628)", borderRadius: "12px", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                  {p.category === "Hospital" ? "🏥" : p.category === "NGO" ? "🤝" : p.category === "Technology" ? "⚙️" : "🏢"}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#FAF9F7", marginBottom: "6px" }}>{p.name}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.72rem", color: "#6B7280" }}>{p.city}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", color: p.category === "Hospital" ? "#C0152A" : p.category === "NGO" ? "#2CA8A0" : p.category === "Technology" ? "#2CA8A0" : "#D4A847", marginTop: "8px", letterSpacing: "0.08em" }}>{p.category}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: "40px", fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#6B7280" }}>
            Want to see your logo here?{" "}
            <a href="#partner-form" style={{ color: "#C0152A", textDecoration: "none", fontWeight: 500 }}>Start the conversation →</a>
          </p>
        </div>
      </section>
    </VideoBg>
  );
}

// ─── SECTION 4 — HOSPITAL INTEGRATION ────────────────────────────────────────

function HospitalIntegration() {
  const { ref, inView } = useInView();
  return (
    <VideoBg src="https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4" overlay="rgba(13,13,13,0.87)" rate={0.65}>
      <section ref={ref} style={{ padding: "100px 48px", borderTop: "1px solid #8B1A2A" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.22em", color: "#9B2335", textTransform: "uppercase", marginBottom: "16px" }}>FOR HOSPITALS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "start" }}>
            {/* Left */}
            <div style={{ opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-24px)", transition: "all 0.6s cubic-bezier(0.4,0,0.2,1)" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(32px,3.5vw,52px)", fontWeight: 700, color: "#FAF9F7", margin: "0 0 20px", lineHeight: 1.1, letterSpacing: "-1px" }}>
                Zero disruption.<br />
                <span style={{ fontStyle: "italic", color: "#F5ECD7" }}>Maximum impact.</span>
              </h2>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "1rem", color: "#6B7280", lineHeight: 1.75, margin: "0 0 32px", fontWeight: 300 }}>
                No change to your existing systems. Raksha AI works alongside — not on top of — your workflows. Your staff keeps doing what they do. We handle the coordination layer.
              </p>
              {/* Reassurance box */}
              <div style={{ borderLeft: "3px solid #2CA8A0", padding: "16px 20px", background: "rgba(44,168,160,0.06)", borderRadius: "0 8px 8px 0", marginBottom: "32px" }}>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#9CA3AF", margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: "#2CA8A0" }}>No setup fee.</strong> No new software installation. Raksha AI connects over API and WhatsApp — systems you already use.
                </p>
              </div>
              <a href="#partner-form" style={{ display: "inline-block", background: "#C0152A", color: "#FAF9F7", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "0.9rem", padding: "14px 32px", textDecoration: "none", letterSpacing: "0.04em", transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#9B2335")}
                onMouseLeave={e => (e.currentTarget.style.background = "#C0152A")}>
                Schedule an Integration Call →
              </a>
            </div>
            {/* Right — Steps */}
            <div style={{ opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(24px)", transition: "all 0.6s cubic-bezier(0.4,0,0.2,1) 0.15s" }}>
              <div style={{ position: "relative" }}>
                {/* Vertical line */}
                <div style={{ position: "absolute", left: "20px", top: "40px", bottom: "40px", width: "1px", background: "#8B1A2A" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {INTEGRATION_STEPS.map((step, i) => (
                    <div key={step.num}
                      style={{ display: "flex", gap: "24px", alignItems: "flex-start", paddingBottom: i < INTEGRATION_STEPS.length - 1 ? "36px" : "0",
                        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)",
                        transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${0.2 + i * 0.12}s` }}>
                      <div style={{ width: "40px", height: "40px", background: "#C0152A", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, fontSize: "0.75rem", color: "#FAF9F7" }}>{step.num}</div>
                      <div style={{ background: "rgba(17,24,39,0.8)", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px 22px", flex: 1, backdropFilter: "blur(8px)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "18px" }}>{step.icon}</span>
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, color: "#FAF9F7", fontSize: "0.95rem" }}>{step.title}</span>
                        </div>
                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", color: "#6B7280", margin: 0, lineHeight: 1.6, fontWeight: 300 }}>{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </VideoBg>
  );
}

// ─── SECTION 5 — PARTNERSHIP FORM ────────────────────────────────────────────

function PartnershipForm() {
  const { ref, inView } = useInView();
  const [form, setForm] = useState<PartnerFormData>({ name: "", organization: "", type: "", city: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Partial<PartnerFormData>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const set = (k: keyof PartnerFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Partial<PartnerFormData> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.organization.trim()) e.organization = "Required";
    if (!form.type) e.type = "Required" as PartnerType;
    if (!form.city.trim()) e.city = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Valid 10-digit Indian number";
    return e;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus("loading");
    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, submittedAt: new Date().toISOString(), source: "partners_page" }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      // Demo fallback
      setTimeout(() => setStatus("success"), 900);
    }
  }, [form]);

  const inputStyle = (field: keyof PartnerFormData): React.CSSProperties => ({
    width: "100%", background: "#1e293b", border: `1px solid ${errors[field] ? "#C0152A" : "#2d3748"}`,
    color: "#FAF9F7", fontFamily: "'DM Sans',sans-serif", fontSize: "0.9rem",
    padding: "13px 16px", outline: "none", borderRadius: "4px",
    transition: "border-color 0.2s", boxSizing: "border-box",
  });

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", fontWeight: 500, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>{children}</label>
  );

  const ErrMsg = ({ field }: { field: keyof PartnerFormData }) =>
    errors[field] ? <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.72rem", color: "#C0152A", marginTop: "4px", display: "block" }}>{errors[field]}</span> : null;

  return (
    <section id="partner-form" ref={ref} style={{ background: "#0A1628", padding: "100px 48px", borderTop: "1px solid #8B1A2A", position: "relative" }}>
      <Grain />
      {/* Glow blobs */}
      <div style={{ position: "absolute", bottom: "10%", left: "5%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(192,21,42,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "15%", right: "8%", width: "240px", height: "240px", background: "radial-gradient(circle, rgba(44,168,160,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "start" }}>
        {/* Left — heading + contact */}
        <div style={{ opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-24px)", transition: "all 0.6s cubic-bezier(0.4,0,0.2,1)" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.22em", color: "#9B2335", textTransform: "uppercase", marginBottom: "16px" }}>GET IN TOUCH</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(36px,4vw,56px)", fontWeight: 700, color: "#FAF9F7", margin: "0 0 20px", lineHeight: 1.05, letterSpacing: "-1px" }}>
            Start the<br /><span style={{ fontStyle: "italic", color: "#F5ECD7" }}>conversation.</span>
          </h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "1rem", color: "#6B7280", lineHeight: 1.75, margin: "0 0 40px", fontWeight: 300, maxWidth: "420px" }}>
            Whether you're a hospital wanting to integrate, an NGO looking to expand reach, or a corporate ready to run a structured drive — we're ready to talk.
          </p>

          {/* What happens next */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", color: "#9B2335", textTransform: "uppercase", marginBottom: "20px" }}>WHAT HAPPENS NEXT</div>
            {[
              { step: "01", text: "A Raksha partnership coordinator responds within 24 hours" },
              { step: "02", text: "We schedule a 30-minute discovery call to understand your needs" },
              { step: "03", text: "Custom partnership agreement drafted within one week" },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "16px" }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem", color: "#C0152A", minWidth: "24px", paddingTop: "2px" }}>{s.step}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#9CA3AF", lineHeight: 1.6 }}>{s.text}</span>
              </div>
            ))}
          </div>

          {/* Contact block */}
          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", color: "#9B2335", textTransform: "uppercase", marginBottom: "16px" }}>DIRECT CONTACT</div>
            {[
              { icon: "📧", label: "partnerships@rakshaai.org" },
              { icon: "📞", label: "1800-XXX-XXXX (Mon–Sat, 9am–6pm)" },
              { icon: "💬", label: "WhatsApp: +91-XXXXX-XXXXX" },
              { icon: "📍", label: "Blood Warriors Foundation, Mumbai, India" },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "16px" }}>{c.icon}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#9CA3AF" }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(24px)", transition: "all 0.6s cubic-bezier(0.4,0,0.2,1) 0.15s" }}>
          {status === "success" ? (
            <div style={{ background: "rgba(44,168,160,0.08)", border: "1px solid #2CA8A0", borderRadius: "16px", padding: "60px 40px", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>✓</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", color: "#2CA8A0", fontWeight: 700, marginBottom: "12px" }}>Message received.</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.95rem", color: "#6B7280", lineHeight: 1.7 }}>
                A Raksha partnership coordinator will contact you at <strong style={{ color: "#FAF9F7" }}>{form.email}</strong> within 24 hours.
              </div>
              <button onClick={() => { setStatus("idle"); setForm({ name: "", organization: "", type: "", city: "", email: "", phone: "", message: "" }); }}
                style={{ marginTop: "28px", background: "transparent", border: "1px solid #2CA8A0", color: "#2CA8A0", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "0.85rem", padding: "12px 28px", cursor: "pointer", letterSpacing: "0.05em" }}>
                Send Another →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "16px", padding: "40px 36px", display: "flex", flexDirection: "column", gap: "20px" }} noValidate>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 700, color: "#FAF9F7", marginBottom: "4px" }}>Partnership Enquiry</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <Label>Your Name *</Label>
                  <input value={form.name} onChange={set("name")} placeholder="Full name" style={inputStyle("name")}
                    onFocus={e => (e.target.style.borderColor = "#C0152A")} onBlur={e => (e.target.style.borderColor = errors.name ? "#C0152A" : "#2d3748")} />
                  <ErrMsg field="name" />
                </div>
                <div>
                  <Label>Organisation *</Label>
                  <input value={form.organization} onChange={set("organization")} placeholder="Organisation name" style={inputStyle("organization")}
                    onFocus={e => (e.target.style.borderColor = "#C0152A")} onBlur={e => (e.target.style.borderColor = errors.organization ? "#C0152A" : "#2d3748")} />
                  <ErrMsg field="organization" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <Label>Partnership Type *</Label>
                  <select value={form.type} onChange={set("type")} style={{ ...inputStyle("type"), appearance: "none", cursor: "pointer" }}
                    onFocus={e => (e.target.style.borderColor = "#C0152A")} onBlur={e => (e.target.style.borderColor = errors.type ? "#C0152A" : "#2d3748")}>
                    <option value="">Select type</option>
                    {["Hospital", "NGO", "Corporate", "Technology", "Other"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ErrMsg field="type" />
                </div>
                <div>
                  <Label>City *</Label>
                  <input value={form.city} onChange={set("city")} placeholder="Your city" style={inputStyle("city")}
                    onFocus={e => (e.target.style.borderColor = "#C0152A")} onBlur={e => (e.target.style.borderColor = errors.city ? "#C0152A" : "#2d3748")} />
                  <ErrMsg field="city" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <Label>Email Address *</Label>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="you@org.com" style={inputStyle("email")}
                    onFocus={e => (e.target.style.borderColor = "#C0152A")} onBlur={e => (e.target.style.borderColor = errors.email ? "#C0152A" : "#2d3748")} />
                  <ErrMsg field="email" />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <input type="tel" value={form.phone} onChange={set("phone")} placeholder="10-digit mobile" style={inputStyle("phone")}
                    onFocus={e => (e.target.style.borderColor = "#C0152A")} onBlur={e => (e.target.style.borderColor = errors.phone ? "#C0152A" : "#2d3748")} />
                  <ErrMsg field="phone" />
                </div>
              </div>

              <div>
                <Label>What would you like to discuss?</Label>
                <textarea value={form.message} onChange={set("message")} placeholder="Tell us about your organisation and what kind of partnership you're exploring..." rows={4}
                  style={{ ...inputStyle("message"), resize: "vertical", minHeight: "100px" }}
                  onFocus={e => (e.target.style.borderColor = "#C0152A")} onBlur={e => (e.target.style.borderColor = "#2d3748")} />
              </div>

              {status === "error" && (
                <div style={{ background: "rgba(192,21,42,0.08)", border: "1px solid #C0152A", borderRadius: "6px", padding: "12px 16px", fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", color: "#C0152A" }}>
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              <button type="submit" disabled={status === "loading"}
                style={{ background: status === "loading" ? "#6B7280" : "#C0152A", color: "#FAF9F7", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "0.95rem", padding: "15px", border: "none", cursor: status === "loading" ? "not-allowed" : "pointer", letterSpacing: "0.05em", transition: "background 0.2s", marginTop: "4px" }}
                onMouseEnter={e => { if (status !== "loading") (e.currentTarget as HTMLButtonElement).style.background = "#9B2335"; }}
                onMouseLeave={e => { if (status !== "loading") (e.currentTarget as HTMLButtonElement).style.background = "#C0152A"; }}>
                {status === "loading" ? "Sending…" : "Send Partnership Enquiry →"}
              </button>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.72rem", color: "#6B7280", margin: 0, textAlign: "center" }}>
                We respond within 24 hours · Your details are never shared without consent
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer() {
  const cols = [
    { title: "Platform", links: ["How It Works", "For Donors", "For Patients", "Request Blood", "Register as Donor"] },
    { title: "Organisation", links: ["About Raksha AI", "Blood Warriors Foundation", "Partners", "Volunteer"] },
    { title: "Resources", links: ["Thalassemia Library", "Donor FAQs", "Blood Compatibility Guide", "Contact"] },
  ];
  return (
    <footer style={{ background: "#0A1628", borderTop: "1px solid #C0152A", padding: "64px 48px 32px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>
          <div>
            <RakshaLogo />
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#6B7280", marginTop: "16px", lineHeight: 1.7 }}>Protecting lives, one match at a time.</p>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", color: "#C0152A", marginTop: "16px", fontWeight: 600 }}>🆘 Emergency: 1800-XXX-XXXX</p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.15em", color: "#9B2335", textTransform: "uppercase", marginBottom: "20px" }}>{col.title}</div>
              {col.links.map(l => (
                <a key={l} href="#" style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#6B7280", textDecoration: "none", marginBottom: "10px", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#2CA8A0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", color: "#6B7280" }}>© 2025 Raksha AI × Blood Warriors Foundation</span>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Privacy Policy", "Terms"].map(l => (
              <a key={l} href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", color: "#6B7280", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#FAF9F7")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>{l}</a>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; }
        ::placeholder { color:#4B5563; }
        body { margin:0; background:#0D0D0D; }
        select option { background:#1e293b; color:#FAF9F7; }
        @media (max-width:768px) {
          nav > div:nth-child(2) { display:none; }
          nav { padding:0 20px !important; }
          .hero-grid, .form-grid, .cat-grid, .partner-grid { grid-template-columns:1fr !important; }
          h1 { font-size:42px !important; }
        }
      `}</style>
    </footer>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PartnersPage() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <div style={{ background: "#0D0D0D", minHeight: "100vh" }}>
      <Navbar />
      <main>
        <HeroSection />
        <PartnerCategories />
        <CurrentPartners />
        <HospitalIntegration />
        <PartnershipForm />
      </main>
      <Footer />
    </div>
  );
}