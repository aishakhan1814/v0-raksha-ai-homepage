'use client'

import { FadeIn } from '../fade-in'
import { Bell, Award, Users, Calendar, Heart, BarChart3 } from 'lucide-react'

const benefits = [
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Receive alerts only when patients match your blood type and location. No spam, just meaningful requests.',
    iconColor: 'text-raksha-blood'
  },
  {
    icon: Award,
    title: 'Recognition Badges',
    description: 'Earn digital and physical badges that showcase your commitment. Share your impact with pride.',
    iconColor: 'text-raksha-gold'
  },
  {
    icon: Users,
    title: 'Community Access',
    description: 'Join a network of like-minded donors. Share stories, tips, and motivation with fellow lifesavers.',
    iconColor: 'text-raksha-teal'
  },
  {
    icon: Calendar,
    title: 'Flexible Scheduling',
    description: 'Book donation appointments at your convenience. We work around your schedule, not the other way around.',
    iconColor: 'text-raksha-blood'
  },
  {
    icon: Heart,
    title: 'Impact Stories',
    description: 'See exactly how your donations help. Receive anonymized updates about the patients you\'ve supported.',
    iconColor: 'text-raksha-coral'
  },
  {
    icon: BarChart3,
    title: 'Health Insights',
    description: 'Track your donation history, health metrics, and eligibility status all in one place.',
    iconColor: 'text-raksha-blood'
  }
]

export function BenefitsSection() {
  return (
    <section className="relative py-32 bg-raksha-navy">
      <div className="noise-overlay" />
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-sans font-medium tracking-[1.5px] text-raksha-crimson uppercase mb-4">
              Donor Benefits
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-raksha-white mb-4">
              What You Get Back
            </h2>
            <p className="font-sans text-raksha-muted max-w-xl mx-auto">
              Beyond the satisfaction of saving lives, here&apos;s what Raksha AI offers you.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <FadeIn key={benefit.title} delay={index * 0.1}>
              <div className="group p-6 rounded-2xl bg-[#111827]/50 border border-transparent hover:border-raksha-blood/30 transition-all">
                <benefit.icon className={`w-8 h-8 ${benefit.iconColor} mb-4`} />
                <h3 className="font-sans font-semibold text-lg text-raksha-white mb-2">
                  {benefit.title}
                </h3>
                <p className="font-sans text-raksha-muted leading-relaxed">
                  {benefit.description}
                </p>
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
