'use client'

import { useEffect, useRef } from 'react'
import { FadeIn } from '../fade-in'

export function DonorsHeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://videos.pexels.com/video-files/11266354/11266354-hd_1920_1080_25fps.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-[rgba(10,22,40,0.75)]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <div className="space-y-8">
              <span className="inline-block text-xs font-sans font-medium tracking-[1.5px] text-raksha-crimson uppercase">
                For Blood Donors
              </span>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-raksha-white leading-[1.1] text-balance">
                You are not just a blood type. You are someone&apos;s lifeline.
              </h1>
              <p className="font-sans text-xl text-raksha-muted max-w-[560px]">
                Join thousands of verified donors who receive personalized match requests 
                when a Thalassemia patient needs their specific blood type.
              </p>
              <div className="space-y-3">
                <a
                  href="/register/donor"
                  className="inline-block px-8 py-4 bg-raksha-blood text-raksha-white font-sans font-semibold text-lg hover:bg-[#a01123] transition-colors"
                >
                  Register as a Donor
                </a>
                <p className="text-sm font-sans text-raksha-muted">
                  Takes 3 minutes. Free. No obligation.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* CSS Illustration - Two silhouettes connected */}
          <FadeIn delay={0.2}>
            <div className="hidden lg:flex items-center justify-center relative h-[400px]">
              {/* Donor silhouette */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2">
                <svg width="120" height="180" viewBox="0 0 120 180" fill="none">
                  <circle cx="60" cy="35" r="25" fill="#FAF9F7" opacity="0.15" />
                  <path
                    d="M60 65 C30 75 20 100 20 130 L20 180 L45 180 L45 130 L50 130 L50 180 L70 180 L70 130 L75 130 L75 180 L100 180 L100 130 C100 100 90 75 60 65Z"
                    fill="#FAF9F7"
                    opacity="0.15"
                  />
                </svg>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-sans text-raksha-muted tracking-wide">
                  DONOR
                </span>
              </div>

              {/* Connecting thread */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <path
                  d="M100 200 Q200 150 300 200"
                  stroke="#C0152A"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="8 4"
                  className="animate-pulse"
                />
                {/* Blood drop on thread */}
                <circle cx="200" cy="175" r="6" fill="#C0152A" />
              </svg>

              {/* Patient silhouette */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2">
                <svg width="120" height="180" viewBox="0 0 120 180" fill="none">
                  <circle cx="60" cy="35" r="25" fill="#FAF9F7" opacity="0.15" />
                  <path
                    d="M60 65 C30 75 20 100 20 130 L20 180 L45 180 L45 130 L50 130 L50 180 L70 180 L70 130 L75 130 L75 180 L100 180 L100 130 C100 100 90 75 60 65Z"
                    fill="#FAF9F7"
                    opacity="0.15"
                  />
                </svg>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-sans text-raksha-muted tracking-wide">
                  PATIENT
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
