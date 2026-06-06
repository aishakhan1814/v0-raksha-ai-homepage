'use client'

import { useEffect, useRef, useState } from 'react'

const chaosWords = [
  'BLOOD GROUP MISMATCH', 'NO AVAILABLE DONORS', 'ALLOIMMUNIZATION RISK', 'IRON OVERLOAD',
  'HOSPITAL COORDINATION', 'CHELATION THERAPY', 'LANGUAGE BARRIER', 'EXPIRED DONOR CONTACT',
  'EMERGENCY CALLS AT 2AM', 'HEMOGLOBIN CRASH', 'BLOOD BANK SHORTAGE', 'DONOR DROPOUT',
  'NEXT TRANSFUSION DATE', 'COMPATIBILITY TESTING', 'TRAVEL TO BLOOD BANK', 'IRREGULAR SCHEDULING',
  'MANUAL FOLLOW-UP', 'PATIENT ANXIETY',
]

function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function chaosStyle(index: number): React.CSSProperties {
  return {
    fontSize: `${14 + seeded(index, 1) * 14}px`,
    opacity: 0.2 + seeded(index, 2) * 0.8,
    transform: `rotate(${(seeded(index, 3) - 0.5) * 6}deg)`,
    display: 'inline-block',
    flexShrink: 0,
    color: '#FAF9F7',
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 500,
    letterSpacing: '0.05em',
  }
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function MarqueeRow({
  words,
  reverse = false,
  duration = '35s',
  offset = 0,
}: {
  words: string[]
  reverse?: boolean
  duration?: string
  offset?: number
}) {
  const doubled = [...words, ...words]
  return (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', marginBottom: '8px' }}>
      <div
        style={{
          display: 'inline-flex',
          gap: '32px',
          animation: `${reverse ? 'marqueeReverse' : 'marquee'} ${duration} linear infinite`,
        }}
      >
        {doubled.map((word, i) => (
          <span key={i} style={chaosStyle(i + offset)}>
            {word}
          </span>
        ))}
      </div>
    </div>
  )
}

export function RealityWallSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7
    }
  }, [])

  return (
    <>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marqueeReverse {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>

      <section
        style={{
          position: 'relative',
          paddingTop: '96px',
          paddingBottom: '96px',
          overflow: 'hidden',
          background: '#0D0D0D',
          borderTop: '1px solid #8B1A2A',
        }}
      >
        {/* Grain */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5, pointerEvents: 'none',
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Video */}
        <video
          ref={videoRef}
          autoPlay muted loop playsInline preload="none"
          onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        >
          <source src="https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,13,0.85)', zIndex: 1 }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

          <FadeIn>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', fontWeight: 600,
              letterSpacing: '0.2em', color: '#9B2335', textTransform: 'uppercase',
              textAlign: 'center', marginBottom: '48px',
            }}>
              THE CURRENT REALITY
            </p>
          </FadeIn>

          <div style={{ marginBottom: '64px' }}>
            <MarqueeRow words={chaosWords} reverse={false} duration="35s" offset={0} />
            <MarqueeRow words={[...chaosWords].reverse()} reverse={true} duration="28s" offset={100} />
            <MarqueeRow words={chaosWords} reverse={false} duration="42s" offset={200} />
          </div>

          <FadeIn>
            <blockquote style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto 28px' }}>
              <p style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 700, color: '#F5ECD7',
                lineHeight: 1.1, letterSpacing: '-0.5px', margin: 0,
              }}>
                {"They're not missing donors. They're missing a "}
                <em style={{ fontStyle: 'italic', color: '#FAF9F7' }}>system.</em>
              </p>
            </blockquote>
          </FadeIn>

          <FadeIn delay={100}>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 300,
              color: '#6B7280', maxWidth: '640px', margin: '0 auto 40px',
              textAlign: 'center', lineHeight: 1.75,
            }}>
              Families spend hours on phone calls, WhatsApp groups, and hospital queues —
              hoping someone will show up. It&apos;s not a donor shortage. It&apos;s a coordination crisis.
            </p>
          </FadeIn>

          <FadeIn delay={200}>
            <div style={{ textAlign: 'center' }}>
              <a
                href="#how-it-works"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '14px 32px', background: '#C0152A', color: '#FAF9F7',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.9rem',
                  letterSpacing: '0.04em', textDecoration: 'none', transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#9B2335')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#C0152A')}
              >
                See How Raksha AI Works
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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