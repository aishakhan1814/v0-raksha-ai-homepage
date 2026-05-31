'use client'

import { useEffect, useRef } from 'react'
import { FadeIn } from './fade-in'

export function PreFooterCTASection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.6
    }
  }, [])

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
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
          src="https://videos.pexels.com/video-files/6823562/6823562-hd_1920_1080_25fps.mp4" 
          type="video/mp4"
        />
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-raksha-deep/[0.80]" />

      {/* Blood Drop Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg className="w-96 h-96 text-raksha-blood opacity-[0.04]" viewBox="0 0 100 140" fill="currentColor">
          <path d="M50 0C50 0 0 60 0 90C0 117.6 22.4 140 50 140C77.6 140 100 117.6 100 90C100 60 50 0 50 0Z" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[64px] text-raksha-white leading-tight mb-8 text-balance">
            Every drop counts. Every match matters.
          </h2>
        </FadeIn>

        <FadeIn delay={100}>
          <p className="text-raksha-blood text-lg lg:text-xl font-medium mb-8">
            By the time she is 18, she will need 210 more transfusions.
          </p>
        </FadeIn>

        <FadeIn delay={200}>
          <p className="text-raksha-muted text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Join the network of heroes who show up — not once, but every time. 
            Your blood type could be someone&apos;s lifeline.
          </p>
        </FadeIn>

        <FadeIn delay={300}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/register/donor"
              className="w-full sm:w-auto px-8 py-4 bg-raksha-blood text-raksha-white font-medium hover:bg-raksha-crimson transition-colors flex items-center justify-center gap-2"
            >
              I Want to Donate Blood
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="/register/patient"
              className="w-full sm:w-auto px-8 py-4 border border-raksha-white/50 text-raksha-white font-medium hover:border-raksha-white transition-colors flex items-center justify-center gap-2"
            >
              Register My Patient
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
