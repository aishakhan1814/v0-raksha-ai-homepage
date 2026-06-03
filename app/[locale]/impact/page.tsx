"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

/* ─────────────────────────────────────────
   FONTS — injected once at top level
───────────────────────────────────────── */
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const T = {
  crimson: "#9B2335",
  wine: "#8B1A2A",
  blood: "#C0152A",
  teal: "#2CA8A0",
  coral: "#E8897A",
  deep: "#0D0D0D",
  navy: "#0A1628",
  card: "#111827",
  warm: "#F5ECD7",
  white: "#FAF9F7",
  muted: "#6B7280",
  gold: "#D4A847",
  green: "#1A7A4A",
  border: "rgba(155,35,53,0.25)",
}

/* ─────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────── */
const HEALTH_DATA = [
  { age: "2", none: 55, manual: 60, raksha: 65 },
  { age: "4", none: 48, manual: 58, raksha: 67 },
  { age: "6", none: 52, manual: 62, raksha: 70 },
  { age: "8", none: 41, manual: 55, raksha: 72 },
  { age: "10", none: 38, manual: 58, raksha: 74 },
  { age: "12", none: 44, manual: 54, raksha: 73 },
  { age: "14", none: 35, manual: 57, raksha: 77 },
  { age: "16", none: 30, manual: 52, raksha: 76 },
  { age: "18", none: 33, manual: 55, raksha: 80 },
]

const CITIES = [
  { name: "Delhi", x: 232, y: 128, donors: 312, patients: 89, matches: 28 },
  { name: "Mumbai", x: 142, y: 308, donors: 247, patients: 94, matches: 34 },
  { name: "Bangalore", x: 204, y: 438, donors: 198, patients: 67, matches: 22 },
  { name: "Chennai", x: 262, y: 428, donors: 176, patients: 71, matches: 19 },
  { name: "Kolkata", x: 358, y: 238, donors: 203, patients: 88, matches: 25 },
  { name: "Hyderabad", x: 222, y: 368, donors: 189, patients: 76, matches: 21 },
  { name: "Pune", x: 154, y: 328, donors: 143, patients: 52, matches: 18 },
  { name: "Ahmedabad", x: 132, y: 238, donors: 167, patients: 61, matches: 16 },
  { name: "Nagpur", x: 238, y: 298, donors: 98, patients: 43, matches: 12 },
  { name: "Jaipur", x: 192, y: 172, donors: 124, patients: 49, matches: 14 },
]

const METRICS = [
  { value: 847, suffix: "", label: "Patients currently on platform", color: T.blood },
  { value: 2341, suffix: "", label: "Active registered donors", color: T.white },
  { value: 124, suffix: "", label: "Successful matches this month", color: T.gold },
  { value: 17, suffix: "", label: "Cities covered", color: T.white },
  { value: 4872, suffix: "", label: "Total transfusions facilitated", color: T.blood },
  { value: 98.3, suffix: "%", label: "Match confirmation rate", color: T.teal },
]

const SEED_FEED = [
  { id: 1, icon: "🩸", type: "match", time: "2 min ago", text: "Match completed: O+ donor in Pune → patient at Sassoon Hospital" },
  { id: 2, icon: "✅", type: "confirmed", time: "5 min ago", text: "Donor #1,247 confirmed for Thursday transfusion in Mumbai" },
  { id: 3, icon: "🏅", type: "badge", time: "12 min ago", text: "Ramesh R. earned 'Raksha Warrior' badge — 12th donation" },
  { id: 4, icon: "📍", type: "confirmed", time: "1 hr ago", text: "Raksha AI now active in Nagpur · 23 new registered donors" },
  { id: 5, icon: "❤️", type: "match", time: "3 hrs ago", text: "Arjun's post-transfusion hemoglobin: 10.4 g/dL — logged" },
  { id: 6, icon: "🔔", type: "confirmed", time: "6 hrs ago", text: "7-day reminders sent to 14 donors across 4 cities" },
  { id: 7, icon: "🆘", type: "match", time: "8 hrs ago", text: "Emergency broadcast triggered · 3 donors responded within 15 min" },
  { id: 8, icon: "✅", type: "badge", time: "1 day ago", text: "B+ match confirmed for patient in Chennai · 5-day advance" },
]

const LIVE_POOL = [
  { icon: "🩸", type: "match", text: "New match: A+ donor in Delhi → patient at AIIMS, 3-day advance" },
  { icon: "✅", type: "confirmed", text: "Priya S. confirmed donation for Sunday — KEM Hospital Mumbai" },
  { icon: "🏅", type: "badge", text: "Sunita K. earned '2-Year Streak' — consistent donor since 2023" },
  { icon: "📍", type: "confirmed", text: "Raksha AI expanded to Surat · 15 donors registered today" },
  { icon: "🩸", type: "match", text: "B- match confirmed in Kolkata · thalassemia patient at SSKM Hospital" },
  { icon: "✅", type: "confirmed", text: "Vikram M. rescheduled · backup donor auto-activated within 4 minutes" },
]

/* ─────────────────────────────────────────
   INLINE LOGO SVG
───────────────────────────────────────── */
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg"
      width={size} height={Math.round(size * 1.17)}>
      <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
      <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z"
        fill="white" opacity="0.95" />
      <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/* ─────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────── */
function Label({ children }: { children: string }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "11px",
      letterSpacing: "2.5px",
      color: T.crimson,
      textTransform: "uppercase",
      marginBottom: "16px",
      textAlign: "center",
    }}>
      {children}
    </p>
  )
}

/* ─────────────────────────────────────────
   COUNTER HOOK
───────────────────────────────────────── */
function useCountUp(target: number, active: boolean, duration = 2200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let start: number | null = null
    const raf = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      // ease out cubic
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(+(ease * target).toFixed(target % 1 !== 0 ? 1 : 0))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [active, target, duration])
  return val
}

/* ─────────────────────────────────────────
   METRIC CARD
───────────────────────────────────────── */
function MetricCard({
  value, suffix, label, color, delay = 0,
}: {
  value: number; suffix: string; label: string; color: string; delay?: number
}) {
  const [active, setActive] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = useCountUp(value, active)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true) }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const displayVal = value % 1 !== 0 ? count.toFixed(1) : Math.round(count).toLocaleString("en-IN")

  return (
    <div ref={ref} style={{
      background: T.card,
      borderTop: `2px solid ${color}`,
      padding: "36px 28px",
      transition: "transform 200ms, border-color 200ms",
      animationDelay: `${delay}ms`,
    }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-4px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "clamp(38px, 4vw, 60px)",
        fontWeight: 600,
        color: color === T.white ? T.white : color,
        lineHeight: 1,
        marginBottom: "14px",
      }}>
        {displayVal}{suffix}
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "13px",
        color: T.muted,
        lineHeight: 1.5,
      }}>
        {label}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   INDIA MAP
───────────────────────────────────────── */
function IndiaMap() {
  const [tip, setTip] = useState<{
    city: typeof CITIES[0]; mx: number; my: number
  } | null>(null)

  /* Simplified India polygon — adequate for hackathon demo */
  const outline = `
    M202,14 L244,8  L288,14 L326,28 L362,46 L392,68
    L418,94 L438,124 L452,156 L460,188 L458,220
    L446,250 L428,276 L404,298 L376,320 L344,344
    L312,368 L282,392 L264,418 L257,448 L260,476
    L252,502 L240,514 L226,498 L212,474 L194,448
    L170,422 L144,396 L116,368  L92,340  L72,310
    L60,280  L56,250  L62,220  L72,190  L88,162
    L108,136 L132,112 L160,88  L186,62  L202,36 Z
  `

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox="0 0 530 560"
        style={{ width: "100%", maxWidth: "460px", display: "block", margin: "0 auto" }}
        onMouseLeave={() => setTip(null)}
      >
        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* India outline */}
        <path d={outline} fill="#0A1628" stroke="#9B2335" strokeWidth="1.2" />

        {/* City markers */}
        {CITIES.map((c, i) => (
          <g key={c.name}>
            {/* Sonar ring 1 */}
            <circle cx={c.x} cy={c.y} r="5" fill="none" stroke={T.blood} strokeWidth="1.2">
              <animate attributeName="r" from="5" to="18" dur="2.8s" begin={`${i * 0.28}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="2.8s" begin={`${i * 0.28}s`} repeatCount="indefinite" />
            </circle>
            {/* Sonar ring 2 */}
            <circle cx={c.x} cy={c.y} r="5" fill="none" stroke={T.blood} strokeWidth="0.8">
              <animate attributeName="r" from="5" to="26" dur="2.8s" begin={`${i * 0.28 + 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.4" to="0" dur="2.8s" begin={`${i * 0.28 + 0.5}s`} repeatCount="indefinite" />
            </circle>
            {/* Centre dot */}
            <circle
              cx={c.x} cy={c.y} r="5"
              fill={T.blood}
              filter="url(#glow)"
              style={{ cursor: "pointer" }}
              onMouseEnter={ev => {
                const svg = ev.currentTarget.closest("svg") as SVGSVGElement
                const box = svg.getBoundingClientRect()
                const wrap = (svg.parentElement as HTMLElement).getBoundingClientRect()
                setTip({ city: c, mx: ev.clientX - wrap.left, my: ev.clientY - wrap.top })
              }}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tip && (
        <div style={{
          position: "absolute",
          left: tip.mx + 14,
          top: tip.my - 72,
          background: T.card,
          border: `1px solid ${T.blood}`,
          borderRadius: "8px",
          padding: "14px 18px",
          pointerEvents: "none",
          zIndex: 20,
          minWidth: "210px",
          boxShadow: `0 0 24px rgba(192,21,42,0.25)`,
        }}>
          <div style={{ fontFamily: "'DM Sans'", fontWeight: 600, color: T.white, marginBottom: "8px" }}>
            {tip.city.name}
          </div>
          <div style={{ fontFamily: "'DM Sans'", fontSize: "12px", lineHeight: 2, color: T.muted }}>
            <span style={{ color: T.blood }}>● </span>{tip.city.donors} donors<br />
            <span style={{ color: T.teal }}>● </span>{tip.city.patients} patients<br />
            <span style={{ color: T.gold }}>● </span>{tip.city.matches} matches this month
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   CHART TOOLTIP
───────────────────────────────────────── */
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.crimson}`,
      borderRadius: "8px", padding: "12px 16px",
    }}>
      <p style={{ fontFamily: "'DM Sans'", color: T.white, marginBottom: "8px", fontWeight: 500 }}>
        Age {label}
      </p>
      {payload.map((e: any) => (
        <p key={e.name} style={{
          fontFamily: "'JetBrains Mono'", fontSize: "12px",
          color: e.color, margin: "3px 0",
        }}>
          {e.name}: {e.value}
        </p>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────
   ACTIVITY FEED
───────────────────────────────────────── */
function ActivityFeed() {
  const [items, setItems] = useState(SEED_FEED)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      const pick = LIVE_POOL[Math.floor(Math.random() * LIVE_POOL.length)]
      setItems(prev => [
        { id: Date.now(), ...pick, time: "Just now" },
        ...prev.slice(0, 9),
      ])
    }, 4500)
    return () => clearInterval(id)
  }, [paused])

  const iconColor = (t: string) =>
    t === "match" ? T.blood : t === "confirmed" ? T.teal : T.gold

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        background: T.card,
        borderLeft: `2px solid ${T.blood}`,
        borderRadius: "0 8px 8px 0",
        maxHeight: "500px",
        overflowY: "auto",
      }}
    >
      {items.map((item, i) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            gap: "16px",
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            animation: i === 0 ? "feedSlide 0.35s ease-out" : "none",
          }}
        >
          <span style={{ fontSize: "18px", flexShrink: 0, lineHeight: 1.5 }}>{item.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "14px",
              color: T.white,
              lineHeight: 1.55,
              marginBottom: "5px",
            }}>
              {item.text}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: T.muted,
            }}>
              {item.time}
            </div>
          </div>
          <div style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: iconColor(item.type),
            flexShrink: 0,
            alignSelf: "center",
          }} />
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────
   NAVBAR
───────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const links = [
    { label: "How It Works", href: "/how-it-works" },
    { label: "For Donors", href: "/for-donors" },
    { label: "For Patients", href: "/for-patients" },
    { label: "Impact", href: "/impact" },
    { label: "Library", href: "/library" },
    { label: "About", href: "/about" },
  ]

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: "64px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 48px",
      background: scrolled ? "rgba(10,10,12,0.96)" : "transparent",
      backdropFilter: scrolled ? "blur(14px)" : "none",
      borderBottom: scrolled ? `1px solid ${T.border}` : "none",
      transition: "background 300ms, border-color 300ms",
    }}>
      {/* Logo */}
      <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <LogoMark size={30} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "18px", fontWeight: 600 }}>
          <span style={{ color: T.white }}>Raksha</span>
          <span style={{ color: T.teal }}>AI</span>
        </span>
      </a>

      {/* Links */}
      <div style={{ display: "flex", gap: "28px" }}>
        {links.map(l => (
          <a key={l.label} href={l.href} style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "14px",
            color: l.href === "/impact" ? T.crimson : T.white,
            textDecoration: "none",
            fontWeight: l.href === "/impact" ? 500 : 400,
            opacity: 0.88,
            borderBottom: l.href === "/impact" ? `1px solid ${T.crimson}` : "none",
            paddingBottom: "2px",
          }}>
            {l.label}
          </a>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", gap: "10px" }}>
        <a href="/register/donor" style={{
          background: T.blood, color: T.white,
          padding: "10px 20px", borderRadius: "0",
          textDecoration: "none",
          fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 500,
        }}>
          Register as Donor
        </a>
        <a href="/register/patient" style={{
          background: "transparent", color: T.white,
          padding: "10px 20px",
          border: "1px solid rgba(255,255,255,0.28)",
          textDecoration: "none",
          fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
        }}>
          Request Blood
        </a>
      </div>
    </nav>
  )
}

/* ─────────────────────────────────────────
   FOOTER
───────────────────────────────────────── */
function Footer() {
  const cols = [
    { title: "Platform", links: ["How It Works", "For Donors", "For Patients", "Impact", "Library"] },
    { title: "Organization", links: ["About", "Blood Warriors", "Partners", "Volunteer"] },
    { title: "Resources", links: ["Thalassemia Library", "Donor FAQs", "Contact Us"] },
  ]
  return (
    <footer style={{
      background: "#060810",
      borderTop: `1px solid ${T.border}`,
      padding: "64px 48px 32px",
    }}>
      <div style={{
        maxWidth: "1200px", margin: "0 auto",
        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: "48px", marginBottom: "40px",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <LogoMark size={26} />
            <span style={{ fontFamily: "'DM Sans'", fontSize: "16px", fontWeight: 600 }}>
              <span style={{ color: T.white }}>Raksha</span>
              <span style={{ color: T.teal }}>AI</span>
            </span>
          </div>
          <p style={{ fontFamily: "'DM Sans'", fontSize: "13px", color: T.muted, lineHeight: 1.7 }}>
            Protecting lives, one match at a time.
          </p>
          <div style={{ marginTop: "16px" }}>
            <span style={{
              fontFamily: "'DM Sans'", fontSize: "12px",
              color: T.blood, fontWeight: 600,
            }}>
              🆘 Emergency: 1800-XXX-XXXX
            </span>
          </div>
        </div>
        {cols.map(col => (
          <div key={col.title}>
            <div style={{
              fontFamily: "'DM Sans'", fontSize: "11px",
              letterSpacing: "2px", color: T.crimson,
              textTransform: "uppercase", marginBottom: "16px",
            }}>
              {col.title}
            </div>
            {col.links.map(l => (
              <div key={l} style={{
                fontFamily: "'DM Sans'", fontSize: "13px",
                color: T.muted, marginBottom: "10px",
              }}>{l}</div>
            ))}
          </div>
        ))}
      </div>
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: "24px",
        display: "flex", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: T.muted }}>
          © 2025 Raksha AI × Blood Warriors Foundation
        </span>
        <span style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: T.muted }}>
          Privacy Policy · Terms of Use
        </span>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────
   PAGE — IMPACT DASHBOARD  (/impact)
───────────────────────────────────────── */
export default function ImpactPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [clock, setClock] = useState("")

  /* Live clock */
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  /* Slow hero video */
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.7
  }, [])

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        ${FONT_IMPORT}
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${T.deep}; color: ${T.white}; }

        @keyframes feedSlide {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${T.card}; }
        ::-webkit-scrollbar-thumb { background: ${T.crimson}; border-radius: 2px; }

        @media (max-width: 768px) {
          nav { padding: 0 20px !important; }
          nav > div:nth-child(2) { display: none !important; }
          .grid-3col { grid-template-columns: 1fr !important; }
          .grid-2col { grid-template-columns: 1fr !important; }
          .metrics-grid { grid-template-columns: 1fr 1fr !important; }
          footer > div { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <Navbar />

      {/* ════════════════════════════════════════
          SECTION 1 — HERO
      ════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        minHeight: "58vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: T.deep,
        overflow: "hidden",
        paddingTop: "64px",
      }}>
        <video
          ref={videoRef}
          autoPlay muted loop playsInline
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", zIndex: 0,
          }}
        >
          <source
            src="https://videos.pexels.com/video-files/3129977/3129977-hd_1920_1080_30fps.mp4"
            type="video/mp4"
          />
        </video>

        {/* Overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(13,13,13,0.88)",
          zIndex: 1,
        }} />

        {/* Content */}
        <div style={{
          position: "relative", zIndex: 2,
          textAlign: "center",
          padding: "80px 24px",
          animation: "fadeUp 0.8s ease-out",
        }}>
          <Label>Live Impact</Label>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(36px, 5.5vw, 68px)",
            fontWeight: 600,
            color: T.white,
            lineHeight: 1.15,
            maxWidth: "780px",
            margin: "0 auto 28px",
          }}>
            Every number here is a life,<br />
            <em style={{ color: T.warm }}>not a statistic.</em>
          </h1>

          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            color: T.muted,
            letterSpacing: "0.5px",
          }}>
            ● LIVE · Last updated: {clock} IST
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 2 — METRICS GRID
      ════════════════════════════════════════ */}
      <section style={{ background: T.navy, padding: "96px 48px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Label>The Numbers</Label>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(28px, 3.5vw, 48px)",
            fontStyle: "italic",
            color: T.white,
            textAlign: "center",
            marginBottom: "56px",
          }}>
            Real data. Real lives.
          </h2>

          <div className="metrics-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "3px",
          }}>
            {METRICS.map((m, i) => (
              <MetricCard
                key={m.label}
                value={m.value}
                suffix={m.suffix}
                label={m.label}
                color={m.color}
                delay={i * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 3 — INDIA MAP
      ════════════════════════════════════════ */}
      <section style={{ background: T.deep, padding: "96px 48px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Label>Donor Network Across India</Label>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(28px, 3.5vw, 52px)",
            fontStyle: "italic",
            color: T.white,
            textAlign: "center",
            marginBottom: "64px",
          }}>
            From Srinagar to Kanyakumari.
          </h2>

          <div className="grid-2col" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "64px",
            alignItems: "center",
          }}>
            <IndiaMap />

            {/* City list + legend */}
            <div>
              {/* Legend */}
              <div style={{ display: "flex", gap: "24px", marginBottom: "32px" }}>
                {[
                  { color: T.blood, label: "Donor Hub" },
                  { color: T.teal, label: "Active Network" },
                  { color: T.gold, label: "Match Activity" },
                ].map(l => (
                  <span key={l.label} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    fontFamily: "'DM Sans'", fontSize: "12px", color: T.muted,
                  }}>
                    <span style={{
                      width: "8px", height: "8px",
                      borderRadius: "50%", background: l.color,
                      display: "inline-block",
                    }} />
                    {l.label}
                  </span>
                ))}
              </div>

              {/* City rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {CITIES.map(c => (
                  <div key={c.name} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "13px 20px",
                    background: T.card,
                    borderLeft: `2px solid rgba(155,35,53,0.3)`,
                    transition: "border-color 200ms, background 200ms",
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.borderLeftColor = T.blood
                      el.style.background = "#1a2535"
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.borderLeftColor = "rgba(155,35,53,0.3)"
                      el.style.background = T.card
                    }}
                  >
                    <span style={{
                      fontFamily: "'DM Sans'", fontSize: "14px",
                      color: T.white, fontWeight: 500,
                    }}>
                      {c.name}
                    </span>
                    <div style={{ display: "flex", gap: "20px" }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono'", fontSize: "12px", color: T.blood,
                      }}>
                        {c.donors} donors
                      </span>
                      <span style={{
                        fontFamily: "'JetBrains Mono'", fontSize: "12px", color: T.muted,
                      }}>
                        {c.patients} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 4 — HEALTH TRAJECTORY GRAPH
      ════════════════════════════════════════ */}
      <section style={{ background: T.navy, padding: "96px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Label>The Clinical Difference Raksha Makes</Label>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(26px, 3.2vw, 48px)",
            fontStyle: "italic",
            color: T.white,
            textAlign: "center",
            marginBottom: "56px",
          }}>
            It's not medicine. It's infrastructure.
          </h2>

          <div style={{
            background: T.card,
            borderRadius: "8px",
            padding: "40px 32px",
            border: `1px solid rgba(255,255,255,0.05)`,
          }}>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={HEALTH_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="age"
                  stroke={T.muted}
                  tick={{ fontFamily: "'JetBrains Mono'", fontSize: 11, fill: T.muted }}
                  label={{
                    value: "Patient Age (years)",
                    position: "insideBottom",
                    offset: -12,
                    fill: T.muted,
                    fontFamily: "'DM Sans'",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  stroke={T.muted}
                  tick={{ fontFamily: "'JetBrains Mono'", fontSize: 11, fill: T.muted }}
                  label={{
                    value: "Stability Score",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    fill: T.muted,
                    fontFamily: "'DM Sans'",
                    fontSize: 12,
                  }}
                />
                <Tooltip content={<ChartTip />} />
                <Legend
                  wrapperStyle={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "13px",
                    paddingTop: "28px",
                    color: T.muted,
                  }}
                />
                <Line
                  type="monotone" dataKey="none"
                  name="No Coordination"
                  stroke={T.blood} strokeWidth={2} strokeDasharray="6 3"
                  dot={{ fill: T.blood, r: 3 }} activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone" dataKey="manual"
                  name="Manual Coordination"
                  stroke={T.gold} strokeWidth={2}
                  dot={{ fill: T.gold, r: 3 }} activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone" dataKey="raksha"
                  name="With Raksha AI"
                  stroke={T.teal} strokeWidth={2.5}
                  dot={{ fill: T.teal, r: 4 }} activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(20px, 2.8vw, 36px)",
            fontStyle: "italic",
            color: T.crimson,
            textAlign: "center",
            marginTop: "48px",
            lineHeight: 1.45,
          }}>
            "The difference between these three lines<br />
            is not medicine. It is infrastructure."
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 5 — LIVE ACTIVITY FEED
      ════════════════════════════════════════ */}
      <section style={{ background: T.deep, padding: "96px 48px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <Label>Happening Right Now</Label>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(28px, 3.5vw, 48px)",
            fontStyle: "italic",
            color: T.white,
            textAlign: "center",
            marginBottom: "8px",
          }}>
            The platform never sleeps.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            color: T.muted,
            textAlign: "center",
            marginBottom: "40px",
          }}>
            Live feed — hover to pause
          </p>

          {/* Legend */}
          <div style={{
            display: "flex", gap: "24px",
            justifyContent: "center", marginBottom: "20px",
          }}>
            {[
              { c: T.blood, l: "Match / Emergency" },
              { c: T.teal, l: "Confirmed / Active" },
              { c: T.gold, l: "Milestone / Badge" },
            ].map(x => (
              <span key={x.l} style={{
                display: "flex", alignItems: "center", gap: "8px",
                fontFamily: "'DM Sans'", fontSize: "12px", color: T.muted,
              }}>
                <span style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: x.c, display: "inline-block",
                }} />
                {x.l}
              </span>
            ))}
          </div>

          <ActivityFeed />
        </div>
      </section>

      <Footer />
    </>
  )
}
