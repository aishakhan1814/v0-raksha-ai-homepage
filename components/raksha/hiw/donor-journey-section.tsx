'use client'

import { useEffect, useRef, useState } from 'react'
import { FadeIn } from '../fade-in'

const donorSteps = [
  {
    number: '01',
    title: 'Register & Verify',
    description: 'Complete a simple registration with blood type, location, and health screening. Our AI verifies eligibility in real-time.',
  },
  {
    number: '02',
    title: 'Get Matched',
    description: 'Raksha AI finds patients who need your blood type, factoring in location, urgency, and your availability preferences.',
    matchCard: {
      patientName: 'Arjun S.',
      bloodType: 'O+',
      location: 'Apollo Hospital, Chennai',
      urgency: 'High',
      compatibility: 98,
    },
  },
  {
    number: '03',
    title: 'Confirm & Schedule',
    description: 'Review the match details and confirm with a single tap. Choose a time slot that works for you.',
    notification: {
      title: 'Donation Request',
      message: 'Arjun S. needs O+ blood at Apollo Hospital',
      time: '2 min ago',
    },
  },
  {
    number: '04',
    title: 'Donate & Impact',
    description: 'Visit the center, donate, and track your impact. Earn badges and see the lives you have helped save.',
    badges: [
      { label: 'First Donation', icon: '🩸' },
      { label: '5 Lives Saved', icon: '⭐' },
      { label: 'Regular Donor', icon: '🏆' },
    ],
  },
]

export function DonorJourneySection() {
  const [lineHeight, setLineHeight] = useState(0)
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const timelineTop = rect.top
      const timelineHeight = rect.height

      if (timelineTop < windowHeight && rect.bottom > 0) {
        const visibleStart = Math.max(0, windowHeight - timelineTop)
        const progress = Math.min(visibleStart / timelineHeight, 1)
        setLineHeight(progress * 100)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative bg-raksha-deep py-24 lg:py-32">
      {/* Grain Texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-block text-raksha-crimson text-xs font-medium tracking-[0.15em] uppercase mb-4">
              DONOR JOURNEY
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-raksha-white leading-tight">
              Your path to saving lives
            </h2>
          </div>
        </FadeIn>

        {/* Timeline */}
        <div ref={timelineRef} className="relative">
          {/* Timeline Line Background */}
          <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-px bg-raksha-wine/30 -translate-x-1/2" />
          
          {/* Animated Timeline Line */}
          <div 
            className="absolute left-8 lg:left-1/2 top-0 w-px bg-raksha-blood -translate-x-1/2 transition-all duration-100"
            style={{ height: `${lineHeight}%` }}
          />

          {/* Steps */}
          <div className="space-y-16 lg:space-y-24">
            {donorSteps.map((step, index) => (
              <FadeIn key={step.number} delay={index * 100}>
                <div className={`relative flex items-start gap-8 lg:gap-16 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}>
                  {/* Circle */}
                  <div className="absolute left-8 lg:left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-raksha-blood flex items-center justify-center z-10">
                    <span className="font-mono text-sm text-raksha-white font-medium">{step.number}</span>
                  </div>

                  {/* Content */}
                  <div className={`ml-24 lg:ml-0 lg:w-[calc(50%-4rem)] ${
                    index % 2 === 0 ? 'lg:pr-16 lg:text-right' : 'lg:pl-16'
                  }`}>
                    <h3 className="text-xl font-semibold text-raksha-white mb-2">{step.title}</h3>
                    <p className="text-raksha-muted leading-relaxed">{step.description}</p>

                    {/* Match Card */}
                    {step.matchCard && (
                      <div className={`mt-6 bg-[#111827] border border-raksha-wine/30 rounded-2xl p-5 ${
                        index % 2 === 0 ? 'lg:ml-auto' : ''
                      } max-w-sm`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-raksha-white font-medium">{step.matchCard.patientName}</span>
                          <span className="px-3 py-1 bg-raksha-blood text-white text-xs font-medium rounded">
                            {step.matchCard.compatibility}% Match
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-raksha-muted">Blood Type</span>
                            <span className="text-raksha-white">{step.matchCard.bloodType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-raksha-muted">Location</span>
                            <span className="text-raksha-white text-right">{step.matchCard.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-raksha-muted">Urgency</span>
                            <span className="text-raksha-blood">{step.matchCard.urgency}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notification Mockup */}
                    {step.notification && (
                      <div className={`mt-6 bg-[#111827] border border-raksha-wine/30 rounded-2xl p-5 ${
                        index % 2 === 0 ? 'lg:ml-auto' : ''
                      } max-w-sm`}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-raksha-blood/20 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-raksha-blood" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-raksha-white font-medium text-sm">{step.notification.title}</span>
                              <span className="text-raksha-muted text-xs">{step.notification.time}</span>
                            </div>
                            <p className="text-raksha-muted text-sm mt-1">{step.notification.message}</p>
                            <div className="flex gap-2 mt-3">
                              <button className="px-4 py-1.5 bg-raksha-teal text-white text-xs font-medium rounded">
                                YES
                              </button>
                              <button className="px-4 py-1.5 bg-transparent border border-raksha-muted/30 text-raksha-muted text-xs font-medium rounded">
                                Later
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Badges */}
                    {step.badges && (
                      <div className={`mt-6 flex gap-3 flex-wrap ${
                        index % 2 === 0 ? 'lg:justify-end' : ''
                      }`}>
                        {step.badges.map((badge) => (
                          <div 
                            key={badge.label}
                            className="bg-[#111827] border border-raksha-gold/50 rounded-xl px-4 py-2 flex items-center gap-2"
                          >
                            <span>{badge.icon}</span>
                            <span className="text-raksha-white text-sm">{badge.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Empty space for alternating layout */}
                  <div className="hidden lg:block lg:w-[calc(50%-4rem)]" />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-raksha-wine" />
    </section>
  )
}
