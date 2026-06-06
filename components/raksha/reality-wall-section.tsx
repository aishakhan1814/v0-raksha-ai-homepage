"use client"

import React, { useEffect, useRef, useState } from "react"

/* ── inline FadeIn so this file has zero external deps ── */
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: 0.05 })
    ob.observe(el)
    return () => ob.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? "translateY(0)" : "translateY(24px)",
        transition: `opacity .8s ease ${delay}ms, transform .8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const WORDS = [
  "BLOOD GROUP MISMATCH", "NO AVAILABLE DONORS", "ALLOIMMUNIZATION RISK", "IRON OVERLOAD",
  "HOSPITAL COORDINATION", "CHELATION THERAPY", "LANGUAGE BARRIER", "EXPIRED DONOR CONTACT",
  "EMERGENCY CALLS AT 2AM", "HEMOGLOBIN CRASH", "BLOOD BANK SHORTAGE", "DONOR DROPOUT",
  "NEXT TRANSFUSION DATE", "COMPATIBILITY TESTING", "TRAVEL TO BLOOD BANK", "IRREGULAR SCHEDULING",
  "MANUAL FOLLOW-UP", "PATIENT ANXIETY",
]

function seed(i: number, s: number): number {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function wStyle(i: number): React.CSSProperties {
  return {
    fontSize: `${14 + seed(i, 1) * 13}px`,
    opacity: 0.25 + seed(i, 2) * 0.7,
    transform: `rotate(${(seed(i, 3) - 0.5) * 5}deg)`,
    display: "inline-block",
    flexShrink: 0,
    color: "#FAF9F7",
    fontWeight: 500,
    padding: "0 6px",
    whiteSpace: "nowrap",
  }
}

function Row({
  words,
  rev = false,
  dur = "35s",
  off = 0,
}: {
  words: string[]
  rev?: boolean
  dur?: string
  off?: number
}) {
  const rep = [...words, ...words, ...words]
  return (
    <div style={{ overflow: "hidden", width: "100%", marginBottom: 10 }}>
      <div
        style={{
          display: "inline-flex",
          gap: 36,
          whiteSpace: "nowrap",
          animation: `${rev ? "rwR" : "rwF"} ${dur} linear infinite`,
          willChange: "transform",
        }}
      >
        {rep.map((w, i) => (
          <span key={i} style={wStyle(i + off)}>
            {w}
          </span>
        ))}
      </div>
    </div>
  )
}

export function RealityWallSection() {
  const vRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (vRef.current) vRef.current.playbackRate = 0.7
  }, [])

  return (
    <>
      <style>{`
        @keyframes rwF { from { transform: translateX(0) } to { transform: translateX(-33.333%) } }
        @keyframes rwR { from { transform: translateX(-33.333%) } to { transform: translateX(0) } }
      `}</style>

      <section
        style={{
          position: "relative",
          paddingTop: 96,
          paddingBottom: 96,
          overflow: "hidden",
          background: "#0D0D0D",
        }}
      >
        {/* Video background */}
        <video
          ref={vRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          onError={(e) => {
            (e.currentTarget as HTMLVideoElement).style.display = "none"
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        >
          <source
            src="https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4"
            type="video/mp4"
          />
        </video>

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(13,13,13,0.80)",
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <FadeIn>
            <p
              style={{
                fontFamily: "DM Sans,system-ui,sans-serif",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: "#9B2335",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 48,
              }}
            >
              THE CURRENT REALITY
            </p>
          </FadeIn>

          <div style={{ marginBottom: 64 }}>
            <Row words={WORDS} dur="35s" off={0} />
            <Row words={[...WORDS].reverse()} rev dur="27s" off={100} />
            <Row words={WORDS} dur="43s" off={200} />
          </div>

          <FadeIn>
            <blockquote
              style={{ textAlign: "center", maxWidth: 860, margin: "0 auto 24px" }}
            >
              <p
                style={{
                  fontFamily: "Cormorant Garamond,Georgia,serif",
                  fontSize: "clamp(28px,4.5vw,54px)",
                  fontWeight: 700,
                  color: "#F5ECD7",
                  lineHeight: 1.1,
                  letterSpacing: "-0.5px",
                  margin: 0,
                }}
              >
                {"They're not missing donors. They're missing a "}
                <em style={{ fontStyle: "italic", color: "#FFFFFF" }}>system.</em>
              </p>
            </blockquote>
          </FadeIn>

          <FadeIn delay={120}>
            <p
              style={{
                fontFamily: "DM Sans,system-ui,sans-serif",
                fontSize: "1rem",
                fontWeight: 300,
                color: "#9CA3AF",
                maxWidth: 600,
                margin: "0 auto 44px",
                textAlign: "center",
                lineHeight: 1.8,
              }}
            >
              Families spend hours on phone calls, WhatsApp groups, and hospital queues —
              hoping someone will show up. It&apos;s not a donor shortage. It&apos;s a coordination crisis.
            </p>
          </FadeIn>

          <FadeIn delay={240}>
            <div style={{ textAlign: "center" }}>
              <a
                href="#how-it-works"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 32px",
                  background: "#C0152A",
                  color: "#FAF9F7",
                  fontFamily: "DM Sans,system-ui,sans-serif",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  letterSpacing: "0.04em",
                  textDecoration: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#9B2335"
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#C0152A"
                }}
              >
                See How Raksha AI Works
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  )
}

export default RealityWallSection