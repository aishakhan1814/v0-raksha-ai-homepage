'use client'

import { FadeIn } from '../fade-in'

export function HIWCTASection() {
  return (
    <section className="relative bg-[#6B0F1A] py-24 lg:py-32">
      {/* Grain Texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-raksha-white leading-tight text-balance">
            Ready to be part of the solution?
          </h2>
        </FadeIn>

        <FadeIn delay={100}>
          <p className="text-raksha-white/70 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
            Whether you want to donate blood or coordinate care for a loved one, 
            Raksha AI is here to guide every step of the journey.
          </p>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a
              href="/register/donor"
              className="px-8 py-4 bg-raksha-white text-raksha-blood text-sm font-semibold hover:bg-raksha-white/90 transition-colors w-full sm:w-auto"
            >
              Register as Donor
            </a>
            <a
              href="/register/patient"
              className="px-8 py-4 border border-raksha-white text-raksha-white text-sm font-semibold hover:bg-raksha-white/10 transition-colors w-full sm:w-auto"
            >
              Register for Care Coordination
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={300}>
          <p className="text-raksha-white/50 text-sm mt-8">
            Already registered?{' '}
            <a href="#login" className="text-raksha-white underline hover:no-underline">
              Sign in to your account
            </a>
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
