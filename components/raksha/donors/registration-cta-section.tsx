'use client'

import { useEffect, useRef } from 'react'
import { FadeIn } from '../fade-in'

const steps = [
  { number: '01', text: 'Fill basic info (3 min)' },
  { number: '02', text: 'Verify your identity' },
  { number: '03', text: 'Get matched with patients' }
]

export function RegistrationCTASection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7
    }
  }, [])

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://videos.pexels.com/video-files/855592/855592-hd_1920_1080_25fps.mp4"
          type="video/mp4"
        />
      </video>
      {/* Deep crimson overlay */}
      <div className="absolute inset-0 bg-[rgba(107,15,26,0.82)]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-24 text-center">
        <FadeIn>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-raksha-white mb-8 leading-tight">
            Someone is waiting<br />for a donor like you.
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center gap-4">
                <span className="font-mono text-2xl text-raksha-teal font-medium">
                  {step.number}
                </span>
                <span className="font-sans text-raksha-white/90">
                  {step.text}
                </span>
                {index < steps.length - 1 && (
                  <span className="hidden md:block text-raksha-white/30 ml-4">→</span>
                )}
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/register/donor" className="px-10 py-4 bg-raksha-white text-raksha-blood font-sans font-semibold text-lg hover:bg-raksha-white/90 transition-colors">
              Register as a Donor
            </a>
            <a
              href="https://www.bloodwarriors.in/about"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 border border-raksha-white/50 text-raksha-white font-sans font-medium hover:bg-raksha-white/10 transition-colors"
            >
              Learn More
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <p className="mt-8 font-sans text-sm text-raksha-white/60">
            Join 50,000+ verified donors across India
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
