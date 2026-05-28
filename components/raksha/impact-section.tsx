'use client'

import { FadeIn } from './fade-in'
import { Counter } from './counter'

const stats = [
  { value: 12500, suffix: '+', label: 'Lives Protected' },
  { value: 8200, suffix: '+', label: 'Active Donors' },
  { value: 98, suffix: '%', label: 'Match Success Rate' },
  { value: 45, suffix: ' min', label: 'Avg Response Time' },
]

export function ImpactSection() {
  return (
    <section id="impact" className="relative py-24 lg:py-32 bg-[#8B0000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-raksha-white/60 text-xs uppercase tracking-[0.15em] font-medium mb-4 text-center">
            Impact So Far
          </p>
        </FadeIn>
        
        <FadeIn delay={50}>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-raksha-white text-center mb-16 text-balance">
            Numbers that represent hope
          </h2>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={index * 100}>
              <div className="text-center">
                <p className="font-display text-5xl sm:text-6xl lg:text-[80px] text-raksha-white mb-2">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-white/70">
                  {stat.label}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
