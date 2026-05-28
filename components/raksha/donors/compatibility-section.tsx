'use client'

import { FadeIn } from '../fade-in'

const compatibilityFactors = [
  {
    title: 'Blood Type Matching',
    description: 'ABO and Rh factor compatibility is just the beginning. We match based on extended phenotyping to reduce transfusion reactions.',
    detail: 'Traditional systems stop at A+, B-, etc. We go deeper.'
  },
  {
    title: 'Antigen Profiling',
    description: 'Thalassemia patients receiving regular transfusions develop antibodies. We track and avoid incompatible antigens.',
    detail: 'Kell, Duffy, Kidd, and 30+ other antigen systems monitored.'
  },
  {
    title: 'Location Intelligence',
    description: 'When urgency matters, distance matters. Our AI prioritizes donors who can reach the patient fastest.',
    detail: 'Real-time traffic, transport availability, and hospital proximity.'
  }
]

export function CompatibilitySection() {
  return (
    <section className="relative py-32 bg-raksha-deep">
      <div className="noise-overlay" />
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-sans font-medium tracking-[1.5px] text-raksha-crimson uppercase mb-4">
              Beyond Blood Type
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-raksha-white mb-4">
              Why Compatibility Matters
            </h2>
            <p className="font-sans italic text-raksha-blood text-lg">
              &ldquo;Most platforms ignore this. We don&apos;t.&rdquo;
            </p>
          </div>
        </FadeIn>

        <div className="space-y-6">
          {compatibilityFactors.map((factor, index) => (
            <FadeIn key={factor.title} delay={index * 0.15}>
              <div className="bg-[#111827] rounded-2xl p-8 md:p-10 border border-raksha-wine hover:border-raksha-blood transition-colors">
                <div className="grid md:grid-cols-3 gap-6 items-start">
                  <div>
                    <h3 className="font-display text-2xl text-raksha-white mb-2">
                      {factor.title}
                    </h3>
                  </div>
                  <div className="md:col-span-2">
                    <p className="font-sans text-raksha-white/90 mb-3 leading-relaxed">
                      {factor.description}
                    </p>
                    <p className="font-mono text-sm text-raksha-teal">
                      {factor.detail}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.5}>
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-raksha-navy/50 rounded-full border border-raksha-wine">
              <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-9">
                <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A"/>
                <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" 
                      fill="white" opacity="0.95"/>
                <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
              <p className="font-sans text-raksha-white">
                Powered by <span className="font-semibold">Raksha</span><span className="text-raksha-teal">AI</span>&apos;s matching algorithm
              </p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-raksha-wine" />
    </section>
  )
}
