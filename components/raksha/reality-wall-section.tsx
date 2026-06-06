'use client'

import { useEffect, useRef } from 'react'
import { FadeIn } from './fade-in'

const chaosWords = [
  'BLOOD GROUP MISMATCH', 'NO AVAILABLE DONORS', 'ALLOIMMUNIZATION RISK', 'IRON OVERLOAD',
  'HOSPITAL COORDINATION', 'CHELATION THERAPY', 'LANGUAGE BARRIER', 'EXPIRED DONOR CONTACT',
  'EMERGENCY CALLS AT 2AM', 'HEMOGLOBIN CRASH', 'BLOOD BANK SHORTAGE', 'DONOR DROPOUT',
  'NEXT TRANSFUSION DATE', 'COMPATIBILITY TESTING', 'TRAVEL TO BLOOD BANK', 'IRREGULAR SCHEDULING',
  'MANUAL FOLLOW-UP', 'PATIENT ANXIETY'
]

// Deterministic pseudo-random generator seeded by index so the server and client
// render identical markup (prevents React hydration mismatches).
function seeded(index: number, salt: number) {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function chaosStyle(index: number) {
  return {
    fontSize: `${14 + seeded(index, 1) * 14}px`,
    opacity: 0.2 + seeded(index, 2) * 0.8,
    transform: `rotate(${(seeded(index, 3) - 0.5) * 6}deg)`,
  }
}

export function RealityWallSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7
    }
  }, [])

  return (
    <section className="relative py-32 overflow-hidden grain-overlay">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        className="video-bg"
      >
        <source 
          src="https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4" 
          type="video/mp4"
        />
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-raksha-deep/[0.85]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-raksha-crimson text-xs uppercase tracking-[0.15em] font-medium mb-12 text-center">
            The Current Reality
          </p>
        </FadeIn>

        {/* Chaos Text Marquee */}
        <div className="relative h-48 mb-16 overflow-hidden">
          {/* Row 1 */}
          <div className="absolute top-0 left-0 w-full whitespace-nowrap animate-marquee">
            <div className="inline-flex gap-8">
              {[...chaosWords, ...chaosWords].map((word, i) => (
                <span
                  key={i}
                  className="text-raksha-white font-medium"
                  style={chaosStyle(i)}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
          
          {/* Row 2 */}
          <div className="absolute top-16 left-0 w-full whitespace-nowrap animate-marquee-reverse">
            <div className="inline-flex gap-8">
              {[...chaosWords.slice().reverse(), ...chaosWords.slice().reverse()].map((word, i) => (
                <span
                  key={i}
                  className="text-raksha-white font-medium"
                  style={chaosStyle(i + 100)}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
          
          {/* Row 3 */}
          <div className="absolute top-32 left-0 w-full whitespace-nowrap animate-marquee" style={{ animationDuration: '40s' }}>
            <div className="inline-flex gap-8">
              {[...chaosWords, ...chaosWords].map((word, i) => (
                <span
                  key={i}
                  className="text-raksha-white font-medium"
                  style={chaosStyle(i + 200)}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Central Quote */}
        <FadeIn>
          <blockquote className="text-center max-w-4xl mx-auto mb-8">
            <p className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-raksha-warm leading-tight">
              {"They're not missing donors. They're missing a "}
              <em className="italic">system.</em>
            </p>
          </blockquote>
        </FadeIn>

        <FadeIn delay={100}>
          <p className="text-center text-raksha-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Families spend hours on phone calls, WhatsApp groups, and hospital queues — 
            hoping someone will show up. It&apos;s not a donor shortage. It&apos;s a coordination crisis.
          </p>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="text-center">
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 bg-raksha-blood text-raksha-white font-medium hover:bg-raksha-crimson transition-colors"
            >
              See How Raksha AI Works
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
