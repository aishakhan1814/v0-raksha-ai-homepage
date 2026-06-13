'use client'

import { FadeIn } from '../fade-in'
import { MapPin, Globe, PhoneCall, Smartphone, CheckCircle2, RefreshCw, Compass } from 'lucide-react'

const tiers = [
  {
    tier: 'Tier 1',
    status: 'Active',
    statusColor: 'bg-raksha-teal/10 text-raksha-teal border-raksha-teal/30',
    title: 'Metro Hubs & WhatsApp Integration',
    coverage: 'Major Metros (Mumbai, Delhi, Hyderabad, Bengaluru)',
    techStack: 'Smart WhatsApp API, Web Console, Next.js dashboard',
    description: 'Serving urban clusters with high smartphone penetration. Direct integration with major municipal blood banks and multi-specialty hospitals to validate our matching algorithms.',
    icon: <Smartphone className="w-6 h-6 text-raksha-teal" />,
    features: ['Real-time WhatsApp alerts', 'Next.js Console interface', 'Hospital-facing dispatch dashboard'],
  },
  {
    tier: 'Tier 2',
    status: 'In Deployment',
    statusColor: 'bg-raksha-warm/15 text-raksha-warm border-raksha-warm/35',
    title: 'Regional Integration & SMS Fallback',
    coverage: 'Tier-2 & Tier-3 Cities (Across 12 states)',
    techStack: '12 Indian Languages, Automated SMS Fallback, Regional NLP',
    description: 'Expanding to regional communities. Translates communications into Hindi, Tamil, Telugu, Marathi, and more. Auto-detects network failure and drops back to simple, carrier-direct SMS so feature phones stay connected.',
    icon: <Globe className="w-6 h-6 text-raksha-warm" />,
    features: ['12 Indian languages translation', 'Carrier-grade SMS fallback', 'Feature-phone optimization'],
  },
  {
    tier: 'Tier 3',
    status: 'Under R&D',
    statusColor: 'bg-raksha-crimson/10 text-raksha-crimson border-raksha-crimson/20',
    title: 'Rural IVR & USSD voice networks',
    coverage: 'Rural PHCs & Remote Villages (Deep India)',
    techStack: 'Amazon Connect, Cloud IVR, USSD menus (*821#)',
    description: 'Ensuring total accessibility. Removes the need for internet or literacy. Families in rural regions can dial a toll-free number or use basic USSD codes to request blood. Amazon Connect automatically queues and routes calls.',
    icon: <PhoneCall className="w-6 h-6 text-raksha-crimson" />,
    features: ['Toll-free voice recognition', 'USSD quick-press menu', 'Amazon Connect cloud routing'],
  },
]

export function ScalabilitySection() {
  return (
    <section className="relative bg-raksha-deep py-24 lg:py-32 overflow-hidden grain-overlay">
      {/* Visual Accent Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-raksha-teal/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-raksha-blood/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-24">
          <FadeIn>
            <span className="inline-block text-raksha-crimson text-xs font-semibold tracking-[0.15em] uppercase mb-4">
              Scale Blueprint
            </span>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="font-display text-4xl sm:text-5xl text-raksha-white leading-tight max-w-3xl mx-auto mb-6">
              Three Tiers of Accessibility
            </h2>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-lg text-raksha-muted max-w-2xl mx-auto leading-relaxed">
              We believe geographical location, language, and internet access should never determine a child&apos;s survival. Our expansion plan bridges the digital divide.
            </p>
          </FadeIn>
        </div>

        {/* Tiers Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {tiers.map((t, i) => (
            <FadeIn key={t.tier} delay={i * 150}>
              <div className="flex flex-col h-full bg-[#111827]/80 border border-raksha-wine/20 rounded-2xl p-8 hover:border-raksha-wine/50 hover:-translate-y-1 transition-all duration-300 relative group">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold tracking-wider text-raksha-muted/80">
                      {t.tier}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full border ${t.statusColor}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#0A1628] rounded-xl border border-raksha-wine/10">
                    {t.icon}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-display text-xl sm:text-2xl text-raksha-white mb-2 leading-tight group-hover:text-raksha-warm transition-colors">
                  {t.title}
                </h3>
                
                {/* Coverage Subheader */}
                <p className="text-xs font-mono text-raksha-teal mb-6 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {t.coverage}
                </p>

                {/* Main Body */}
                <p className="text-sm text-raksha-muted leading-relaxed mb-6 flex-grow">
                  {t.description}
                </p>

                {/* Tech Info */}
                <div className="border-t border-raksha-wine/10 pt-6 mt-auto">
                  <span className="text-[10px] font-mono tracking-widest text-raksha-muted uppercase font-bold block mb-3">
                    Infrastructure Stack
                  </span>
                  <p className="text-xs text-raksha-white font-medium mb-4">
                    {t.techStack}
                  </p>
                  
                  <ul className="space-y-2">
                    {t.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs text-raksha-muted">
                        <CheckCircle2 className="w-3.5 h-3.5 text-raksha-crimson flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

      </div>

      {/* Thin crimson divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-raksha-wine" />
    </section>
  )
}
