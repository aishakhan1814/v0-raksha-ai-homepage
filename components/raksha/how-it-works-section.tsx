'use client'

import { FadeIn } from './fade-in'

const features = [
  {
    title: 'Smart Blood Matching',
    description: 'AI-powered compatibility analysis that goes beyond ABO/Rh. We consider antigen profiles, transfusion history, and alloimmunization risk to find the safest matches.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="#C0152A" strokeWidth="1.5">
        <circle cx="16" cy="16" r="12" />
        <path d="M16 8v4m0 8v4M8 16h4m8 0h4" strokeLinecap="round" />
        <circle cx="16" cy="16" r="4" fill="#C0152A" fillOpacity="0.2" />
      </svg>
    ),
  },
  {
    title: 'Predictive Scheduling',
    description: 'Machine learning models analyze hemoglobin trends, transfusion history, and individual patient patterns to predict the optimal next transfusion date — before it becomes urgent.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="#C0152A" strokeWidth="1.5">
        <rect x="4" y="6" width="24" height="20" rx="2" />
        <path d="M4 12h24" />
        <path d="M10 6V3M22 6V3" strokeLinecap="round" />
        <circle cx="16" cy="19" r="3" fill="#C0152A" fillOpacity="0.3" />
      </svg>
    ),
  },
  {
    title: 'Automated Donor Outreach',
    description: 'When a patient needs blood, Raksha AI automatically contacts eligible donors via SMS and WhatsApp in their preferred language. No more manual phone trees.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="#C0152A" strokeWidth="1.5">
        <path d="M6 26V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H10l-4 4z" />
        <path d="M10 12h12M10 16h8" strokeLinecap="round" />
        <circle cx="22" cy="8" r="4" fill="#C0152A" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Coordination',
    description: 'Track donor confirmations, blood bank availability, and hospital readiness in one dashboard. Everyone — patient, donor, hospital — stays synchronized.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="#C0152A" strokeWidth="1.5">
        <circle cx="16" cy="8" r="4" />
        <circle cx="8" cy="24" r="4" />
        <circle cx="24" cy="24" r="4" />
        <path d="M16 12v4m-4 4l-2 2m10-6l2 2" />
        <path d="M12 24h8" strokeDasharray="2 2" />
      </svg>
    ),
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 bg-raksha-deep grain-overlay">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-raksha-crimson text-xs uppercase tracking-[0.15em] font-medium mb-4 text-center">
            The Raksha AI Engine
          </p>
        </FadeIn>
        
        <FadeIn delay={50}>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-raksha-white text-center mb-16 text-balance">
            Smarter matching. Proactive scheduling. Zero guesswork.
          </h2>
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <FadeIn key={feature.title} delay={index * 100}>
              <div className="group bg-[#111827] p-8 rounded-2xl border border-[#1e293b] hover:border-raksha-crimson transition-all duration-300 hover:translate-y-[-6px]">
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3 className="font-display text-xl lg:text-2xl text-raksha-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-raksha-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
