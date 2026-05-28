'use client'

import { useEffect, useRef, useState } from 'react'
import { FadeIn } from '../fade-in'

export function HIWHeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [activeTab, setActiveTab] = useState<'donors' | 'patients'>('donors')

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
          src="https://videos.pexels.com/video-files/3129977/3129977-hd_1920_1080_30fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[rgba(10,22,40,0.82)]" />

      {/* Grain Texture */}
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <FadeIn>
          <span className="inline-block text-raksha-crimson text-xs font-medium tracking-[0.15em] uppercase mb-6">
            THE RAKSHA AI PROCESS
          </span>
        </FadeIn>

        <FadeIn delay={100}>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-raksha-white leading-[1.1] text-balance">
            From chaos to coordination — in minutes, not days.
          </h1>
        </FadeIn>

        <FadeIn delay={200}>
          <p className="text-raksha-muted text-lg sm:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            Our AI platform transforms the blood donation experience for both donors and patients, 
            creating seamless connections when every moment counts.
          </p>
        </FadeIn>

        {/* Toggle Tabs */}
        <FadeIn delay={300}>
          <div className="flex items-center justify-center gap-0 mt-10">
            <button
              onClick={() => setActiveTab('donors')}
              className={`px-8 py-3 text-sm font-medium transition-colors ${
                activeTab === 'donors'
                  ? 'bg-raksha-blood text-raksha-white'
                  : 'bg-transparent text-raksha-white border border-white/50 hover:border-white'
              }`}
            >
              For Donors
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`px-8 py-3 text-sm font-medium transition-colors ${
                activeTab === 'patients'
                  ? 'bg-raksha-blood text-raksha-white'
                  : 'bg-transparent text-raksha-white border border-white/50 hover:border-white'
              }`}
            >
              For Patients
            </button>
          </div>
        </FadeIn>

        {/* Tab Content Preview */}
        <FadeIn delay={400}>
          <div className="mt-8 text-raksha-muted text-sm">
            {activeTab === 'donors' ? (
              <p>Scroll down to see how donors can make an impact with Raksha AI</p>
            ) : (
              <p>Scroll down to see how patient families coordinate care with Raksha AI</p>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-raksha-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
