'use client'

import { FadeIn } from './fade-in'

export function TwoJourneysSection() {
  return (
    <section id="donors" className="relative">
      {/* Split Background */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 bg-raksha-deep" />
        <div className="w-1/2 bg-raksha-navy" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-raksha-crimson hidden lg:block" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <FadeIn>
          <p className="text-raksha-crimson text-xs uppercase tracking-[0.15em] font-medium mb-16 text-center">
            Two People. One Mission.
          </p>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-0">
          {/* Donor Column */}
          <FadeIn delay={100}>
            <div className="group lg:pr-16 p-8 lg:p-12 transition-all duration-300 hover:bg-raksha-deep/50 lg:hover:translate-y-[-4px]">
              {/* Heart Drop Icon */}
              <div className="w-16 h-16 mb-8 flex items-center justify-center">
                <svg className="w-12 h-12 text-raksha-blood" viewBox="0 0 48 48" fill="none">
                  <path 
                    d="M24 44c0 0-18-10-18-24 0-8 6-12 12-12 4 0 6 2 6 2s2-2 6-2c6 0 12 4 12 12 0 14-18 24-18 24z" 
                    fill="currentColor"
                  />
                  <path 
                    d="M24 18c0 0-4 6-4 10 0 2.2 1.8 4 4 4s4-1.8 4-4c0-4-4-10-4-10z" 
                    fill="white" 
                    opacity="0.9"
                  />
                </svg>
              </div>

              <h3 className="font-display text-3xl lg:text-4xl text-raksha-white mb-6">
                The Donor
              </h3>
              
              <p className="text-raksha-muted leading-relaxed mb-8">
                You give blood once. Raksha AI turns that into a relationship. We remind you 
                when you&apos;re eligible again, match you with patients who need your blood type, 
                and show you the impact you&apos;re making — not in abstract numbers, but in real lives.
              </p>
              
              <p className="text-raksha-muted leading-relaxed mb-8">
                No more sporadic donations. No more wondering if your blood made a difference. 
                Become a recurring hero for someone who needs you every 21 days.
              </p>

              <a
                href=""
                className="inline-flex items-center gap-2 px-6 py-3 bg-raksha-blood text-raksha-white font-medium hover:bg-raksha-crimson transition-colors"
              >
                Become a Raksha Donor
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </FadeIn>

          {/* Patient Family Column */}
          <FadeIn delay={200}>
            <div className="group lg:pl-16 p-8 lg:p-12 transition-all duration-300 hover:bg-raksha-navy/50 lg:hover:translate-y-[-4px]">
              {/* Shield Icon */}
              <div className="w-16 h-16 mb-8 flex items-center justify-center">
                <svg className="w-12 h-12 text-raksha-gold" viewBox="0 0 48 56" fill="none">
                  <path 
                    d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" 
                    fill="currentColor"
                  />
                  <path 
                    d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" 
                    fill="white" 
                    opacity="0.9"
                  />
                </svg>
              </div>

              <h3 className="font-display text-3xl lg:text-4xl text-raksha-white mb-6">
                The Patient Family
              </h3>
              
              <p className="text-raksha-muted leading-relaxed mb-8">
                You&apos;ve spent years managing transfusion schedules, calling donors, and 
                hoping someone answers. Raksha AI takes that burden off your shoulders. 
                We predict when your child needs blood, find compatible donors, and coordinate 
                everything — so you can focus on being a parent, not a logistics manager.
              </p>
              
              <p className="text-raksha-muted leading-relaxed mb-8">
                Register once. Let Raksha AI handle the rest.
              </p>

              <a
                href=""
                className="inline-flex items-center gap-2 px-6 py-3 border border-raksha-blood text-raksha-blood font-medium hover:bg-raksha-blood hover:text-raksha-white transition-colors"
              >
                Register Your Patient
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
