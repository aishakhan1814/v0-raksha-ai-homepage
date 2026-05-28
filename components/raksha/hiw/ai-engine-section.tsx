'use client'

import { FadeIn } from '../fade-in'

const panels = [
  {
    id: 'matching',
    label: 'AI MATCHING ENGINE',
    title: 'Neural network for perfect matches',
    description: 'Our deep learning model considers 47+ compatibility factors including blood type, antibody profiles, geographic proximity, donor history, and urgency scores to find the optimal match in milliseconds.',
    icon: (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        {/* Neural Network Nodes */}
        <circle cx="20" cy="30" r="6" fill="#C0152A" />
        <circle cx="20" cy="60" r="6" fill="#C0152A" />
        <circle cx="20" cy="90" r="6" fill="#C0152A" />
        
        <circle cx="60" cy="25" r="6" fill="#C0152A" />
        <circle cx="60" cy="50" r="6" fill="#C0152A" />
        <circle cx="60" cy="75" r="6" fill="#C0152A" />
        <circle cx="60" cy="100" r="6" fill="#C0152A" />
        
        <circle cx="100" cy="45" r="6" fill="#C0152A" />
        <circle cx="100" cy="75" r="6" fill="#C0152A" />
        
        {/* Connections */}
        <line x1="26" y1="30" x2="54" y2="25" stroke="#C0152A" strokeWidth="1" opacity="0.5" />
        <line x1="26" y1="30" x2="54" y2="50" stroke="#C0152A" strokeWidth="1" opacity="0.5" />
        <line x1="26" y1="60" x2="54" y2="50" stroke="#C0152A" strokeWidth="1" opacity="0.5" />
        <line x1="26" y1="60" x2="54" y2="75" stroke="#C0152A" strokeWidth="1" opacity="0.5" />
        <line x1="26" y1="90" x2="54" y2="75" stroke="#C0152A" strokeWidth="1" opacity="0.5" />
        <line x1="26" y1="90" x2="54" y2="100" stroke="#C0152A" strokeWidth="1" opacity="0.5" />
        
        <line x1="66" y1="25" x2="94" y2="45" stroke="#C0152A" strokeWidth="1" opacity="0.5" />
        <line x1="66" y1="50" x2="94" y2="45" stroke="#C0152A" strokeWidth="1" opacity="0.5" />
        <line x1="66" y1="50" x2="94" y2="75" stroke="#C0152A" strokeWidth="1" opacity="0.5" />
        <line x1="66" y1="75" x2="94" y2="75" stroke="#C0152A" strokeWidth="1" opacity="0.5" />
        <line x1="66" y1="100" x2="94" y2="75" stroke="#C0152A" strokeWidth="1" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'prediction',
    label: 'PREDICTIVE ANALYTICS',
    title: 'Anticipate needs before crisis',
    description: 'Time-series analysis of hemoglobin levels, transfusion intervals, and seasonal patterns. We predict transfusion needs 7-14 days in advance with 94% accuracy.',
    icon: (
      <svg className="w-full h-full" viewBox="0 0 120 80" fill="none">
        {/* Heartbeat/Waveform */}
        <path
          d="M0,40 L20,40 L25,40 L30,20 L40,60 L50,30 L55,45 L60,40 L80,40 L85,40 L90,15 L100,55 L110,35 L115,40 L120,40"
          stroke="#C0152A"
          strokeWidth="2"
          fill="none"
        />
        {/* Baseline */}
        <line x1="0" y1="40" x2="120" y2="40" stroke="#C0152A" strokeWidth="0.5" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'language',
    label: 'REGIONAL INTELLIGENCE',
    title: '12 Indian languages, one mission',
    description: 'Natural language processing trained on Indian healthcare terminology. Donors and families communicate in Hindi, Tamil, Telugu, Bengali, Marathi, and more.',
    icon: (
      <svg className="w-full h-full" viewBox="0 0 200 150" fill="none">
        {/* India Map Outline (simplified) */}
        <path
          d="M100,10 Q130,15 150,30 Q170,50 165,80 Q160,100 140,120 Q120,140 100,145 Q80,140 60,120 Q40,100 35,80 Q30,50 50,30 Q70,15 100,10"
          stroke="#9B2335"
          strokeWidth="2"
          fill="none"
        />
        {/* Language Pills positioned on map */}
        <rect x="70" y="35" width="60" height="18" rx="9" fill="#2CA8A0" />
        <text x="100" y="48" textAnchor="middle" fill="white" fontSize="10" fontFamily="DM Sans">Hindi</text>
        
        <rect x="40" y="65" width="50" height="18" rx="9" fill="#2CA8A0" />
        <text x="65" y="78" textAnchor="middle" fill="white" fontSize="10" fontFamily="DM Sans">Marathi</text>
        
        <rect x="110" y="65" width="50" height="18" rx="9" fill="#2CA8A0" />
        <text x="135" y="78" textAnchor="middle" fill="white" fontSize="10" fontFamily="DM Sans">Bengali</text>
        
        <rect x="55" y="95" width="45" height="18" rx="9" fill="#2CA8A0" />
        <text x="77" y="108" textAnchor="middle" fill="white" fontSize="10" fontFamily="DM Sans">Tamil</text>
        
        <rect x="105" y="95" width="50" height="18" rx="9" fill="#2CA8A0" />
        <text x="130" y="108" textAnchor="middle" fill="white" fontSize="10" fontFamily="DM Sans">Telugu</text>
      </svg>
    ),
  },
]

export function AIEngineSection() {
  return (
    <section className="relative bg-raksha-navy py-24 lg:py-32">
      {/* Grain Texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-block text-raksha-crimson text-xs font-medium tracking-[0.15em] uppercase mb-4">
              THE AI ENGINE
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-raksha-white leading-tight max-w-3xl mx-auto">
              Intelligence built for India&apos;s blood ecosystem
            </h2>
          </div>
        </FadeIn>

        {/* Panels Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {panels.map((panel, index) => (
            <FadeIn key={panel.id} delay={index * 150}>
              <div className="bg-[#111827] border border-raksha-wine/30 rounded-2xl p-8 h-full hover:border-raksha-blood/50 transition-colors">
                {/* Icon */}
                <div className="h-32 mb-6">
                  {panel.icon}
                </div>

                {/* Label */}
                <span className="inline-block text-raksha-teal text-xs font-medium tracking-[0.1em] uppercase mb-3">
                  {panel.label}
                </span>

                {/* Title */}
                <h3 className="text-xl font-semibold text-raksha-white mb-3">
                  {panel.title}
                </h3>

                {/* Description */}
                <p className="text-raksha-muted leading-relaxed text-sm">
                  {panel.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Bottom Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-raksha-wine" />
    </section>
  )
}
