'use client'

import { FadeIn } from '../fade-in'
import { Check, X, Info } from 'lucide-react'

const eligibilityItems = [
  { text: 'Age 18–65 years', eligible: true },
  { text: 'Weight above 50 kg', eligible: true },
  { text: 'No tattoos in past 6 months', eligible: true },
  { text: 'No major surgeries in past year', eligible: true },
  { text: 'Hemoglobin level ≥ 12.5 g/dL', eligible: true },
  { text: 'No chronic illnesses (diabetes, heart disease)', eligible: true },
]

const ineligibleItems = [
  { text: 'Pregnant or breastfeeding', eligible: false },
  { text: 'Currently on antibiotics', eligible: false },
  { text: 'HIV/Hepatitis positive', eligible: false },
]

export function EligibilitySection() {
  return (
    <section className="relative py-32 bg-raksha-navy">
      <div className="noise-overlay" />
      <div className="max-w-5xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-sans font-medium tracking-[1.5px] text-raksha-crimson uppercase mb-4">
              Eligibility Check
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-raksha-white mb-4">
              Can You Donate?
            </h2>
            <p className="font-sans text-raksha-muted max-w-xl mx-auto">
              Most healthy adults can donate blood. Here&apos;s a quick guide to check your eligibility.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Eligible column */}
          <FadeIn delay={0.1}>
            <div className="bg-[#111827] rounded-2xl p-8 border border-raksha-teal/30">
              <h3 className="font-sans font-semibold text-raksha-teal text-lg mb-6 flex items-center gap-2">
                <Check className="w-5 h-5" />
                You Can Donate If
              </h3>
              <ul className="space-y-4">
                {eligibilityItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-raksha-blood flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-raksha-white">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          {/* Ineligible column */}
          <FadeIn delay={0.2}>
            <div className="bg-[#111827] rounded-2xl p-8 border border-raksha-muted/20">
              <h3 className="font-sans font-semibold text-raksha-muted text-lg mb-6 flex items-center gap-2">
                <X className="w-5 h-5" />
                Temporary Deferrals
              </h3>
              <ul className="space-y-4">
                {ineligibleItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-raksha-muted flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-raksha-muted">{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 p-4 bg-raksha-teal/10 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-raksha-teal flex-shrink-0 mt-0.5" />
                <p className="font-sans text-sm text-raksha-teal">
                  Temporary deferrals don&apos;t mean you can never donate. Most conditions 
                  resolve within weeks to months. We&apos;ll notify you when you become eligible.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.3}>
          <div className="text-center mt-12">
            <a href="/register/donor" className="px-8 py-4 bg-raksha-blood text-raksha-white font-sans font-semibold text-lg hover:bg-[#a01123] transition-colors inline-flex items-center gap-2">
              I&apos;m Eligible — Register Now
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </FadeIn>
      </div>

      {/* Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-raksha-wine" />
    </section>
  )
}
