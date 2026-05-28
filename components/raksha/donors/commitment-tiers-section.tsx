'use client'

import { FadeIn } from '../fade-in'
import { Heart, Shield, Award } from 'lucide-react'

const tiers = [
  {
    name: 'Friend',
    tagline: 'Start your journey',
    commitment: '1 donation per year',
    description: 'Perfect for first-time donors or those with busy schedules. Every drop counts.',
    features: [
      'Priority match notifications',
      'Basic donor badge',
      'Donation reminders',
      'Impact updates'
    ],
    icon: Heart,
    highlighted: false,
    borderColor: 'border-[#1e293b]',
    badgeColor: 'border-raksha-muted'
  },
  {
    name: 'Guardian',
    tagline: 'Most Meaningful',
    commitment: '3 donations per year',
    description: 'The backbone of our community. Guardians provide reliable, life-saving support to multiple patients.',
    features: [
      'All Friend benefits',
      'Crimson Guardian badge',
      'Direct patient impact stories',
      'Priority scheduling',
      'Recognition on donor wall'
    ],
    icon: Shield,
    highlighted: true,
    borderColor: 'border-raksha-blood',
    badgeColor: 'border-raksha-blood'
  },
  {
    name: 'Warrior',
    tagline: 'Elite commitment',
    commitment: '4+ donations per year',
    description: 'Our most dedicated donors. Warriors are matched with patients who need regular, consistent support.',
    features: [
      'All Guardian benefits',
      'Gold Warrior badge',
      'Dedicated patient matching',
      'Annual recognition event',
      'Exclusive community access'
    ],
    icon: Award,
    highlighted: false,
    borderColor: 'border-raksha-gold',
    badgeColor: 'border-raksha-gold'
  }
]

export function CommitmentTiersSection() {
  return (
    <section className="relative py-32 bg-raksha-deep">
      <div className="noise-overlay" />
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-sans font-medium tracking-[1.5px] text-raksha-crimson uppercase mb-4">
              Choose Your Commitment
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-raksha-white mb-4">
              Three Ways to Save Lives
            </h2>
            <p className="font-sans text-raksha-muted max-w-xl mx-auto">
              Every level of commitment makes a difference. Choose what works for your life.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, index) => (
            <FadeIn key={tier.name} delay={index * 0.1}>
              <div
                className={`relative bg-[#111827] rounded-2xl p-8 border ${tier.borderColor} ${
                  tier.highlighted ? 'scale-105 shadow-2xl shadow-raksha-blood/20' : ''
                } transition-all hover:border-raksha-blood/50`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-raksha-gold text-raksha-deep text-xs font-sans font-semibold uppercase tracking-wide rounded-full">
                      {tier.tagline}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-full ${tier.badgeColor} border-2 flex items-center justify-center`}>
                    <tier.icon className="w-6 h-6 text-raksha-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-raksha-white">{tier.name}</h3>
                    <p className="font-mono text-sm text-raksha-teal">{tier.commitment}</p>
                  </div>
                </div>

                <p className="font-sans text-raksha-muted mb-6 min-h-[60px]">
                  {tier.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-raksha-blood flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="font-sans text-sm text-raksha-white">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 font-sans font-semibold transition-colors ${
                    tier.highlighted
                      ? 'bg-raksha-blood text-raksha-white hover:bg-[#a01123]'
                      : 'border border-raksha-muted/30 text-raksha-white hover:border-raksha-blood'
                  }`}
                >
                  Choose {tier.name}
                </button>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-raksha-wine" />
    </section>
  )
}
