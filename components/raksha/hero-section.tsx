'use client'

import { useEffect, useRef } from 'react'
import { FadeIn } from './fade-in'

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        id="hero-video"
        autoPlay
        muted
        loop
        playsInline
        className="video-bg"
      >
        <source 
          src="https://videos.pexels.com/video-files/13149047/13149047-hd_1920_1080_30fps.mp4" 
          type="video/mp4"
        />
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-raksha-navy/[0.78]" />
      
      {/* Ripple Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="ripple-ring w-[300px] h-[300px]" style={{ animationDelay: '0s' }} />
        <div className="ripple-ring w-[300px] h-[300px]" style={{ animationDelay: '1s' }} />
        <div className="ripple-ring w-[300px] h-[300px]" style={{ animationDelay: '2s' }} />
        <div className="ripple-ring w-[300px] h-[300px]" style={{ animationDelay: '3s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-3xl">
          <FadeIn>
            <p className="text-raksha-crimson text-xs sm:text-sm uppercase tracking-[0.2em] font-medium mb-6">
              Blood Warriors × Raksha AI
            </p>
          </FadeIn>
          
          <FadeIn delay={100}>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[80px] text-raksha-white leading-[1.1] mb-6 text-balance">
              Saving a life shouldn&apos;t require a miracle. Just a match.
            </h1>
          </FadeIn>
          
          <FadeIn delay={200}>
            <p className="text-lg sm:text-xl text-raksha-muted max-w-xl mb-8 leading-relaxed">
              Raksha AI connects voluntary blood donors with Thalassemia patients across India — 
              through intelligent matching, automated scheduling, and care that never stops.
            </p>
          </FadeIn>
          
          <FadeIn delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a
                href="#register-donor"
                className="px-8 py-4 bg-raksha-blood text-raksha-white font-medium hover:bg-raksha-crimson transition-colors text-center"
              >
                Register as a Donor
              </a>
              <a
                href="/register/patient"
                className="px-8 py-4 border border-raksha-white/50 text-raksha-white font-medium hover:border-raksha-white transition-colors text-center"
              >
                Find Blood for My Patient
              </a>
            </div>
          </FadeIn>
          
          <FadeIn delay={400}>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-raksha-white">1,00,000+</span>
                <span className="text-raksha-muted">Patients</span>
              </div>
              <div className="w-px h-4 bg-raksha-crimson" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-raksha-white">Every 21 Days</span>
                <span className="text-raksha-muted">Transfusion</span>
              </div>
              <div className="w-px h-4 bg-raksha-crimson" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-raksha-white">500+</span>
                <span className="text-raksha-muted">Transfusions / Lifetime</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-xs text-raksha-muted uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-raksha-crimson/30 relative overflow-hidden">
          <div className="absolute inset-x-0 bg-raksha-blood animate-scroll-line h-full" />
        </div>
      </div>
    </section>
  )
}
