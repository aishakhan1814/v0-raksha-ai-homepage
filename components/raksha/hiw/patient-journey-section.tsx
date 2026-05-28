'use client'

import { useEffect, useRef, useState } from 'react'
import { FadeIn } from '../fade-in'

const patientSteps = [
  {
    number: '01',
    title: 'Register Your Loved One',
    description: 'Enter patient details, transfusion history, and preferred hospitals. Raksha AI builds a care profile.',
  },
  {
    number: '02',
    title: 'AI Predicts Needs',
    description: 'Our algorithms analyze hemoglobin trends and predict when the next transfusion will be needed — before crisis hits.',
    chart: true,
  },
  {
    number: '03',
    title: 'Schedule Transfusions',
    description: 'Book appointments in advance with confirmed donor matches. No more last-minute scrambles.',
    calendar: [
      { day: 'Mon', date: 15, status: 'confirmed' },
      { day: 'Tue', date: 16, status: null },
      { day: 'Wed', date: 17, status: null },
      { day: 'Thu', date: 18, status: 'confirmed' },
      { day: 'Fri', date: 19, status: null },
    ],
  },
  {
    number: '04',
    title: 'Track & Coordinate',
    description: 'Monitor health records, medication schedules, and communicate with your care network — all in one place.',
  },
]

export function PatientJourneySection() {
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
            <span className="inline-block text-raksha-gold text-xs font-medium tracking-[0.15em] uppercase mb-4">
              PATIENT FAMILY JOURNEY
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-raksha-white leading-tight">
              Care, coordinated with compassion
            </h2>
          </div>
        </FadeIn>

        {/* Timeline */}
        <div ref={timelineRef} className="relative">
          {/* Timeline Line Background */}
          <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-px bg-raksha-gold/20 -translate-x-1/2" />
          
          {/* Animated Timeline Line */}
          <div 
            className="absolute left-8 lg:left-1/2 top-0 w-px bg-raksha-gold -translate-x-1/2 transition-all duration-100"
            style={{ height: `${lineHeight}%` }}
          />

          {/* Steps */}
          <div className="space-y-16 lg:space-y-24">
            {patientSteps.map((step, index) => (
              <FadeIn key={step.number} delay={index * 100}>
                <div className={`relative flex items-start gap-8 lg:gap-16 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}>
                  {/* Circle */}
                  <div className="absolute left-8 lg:left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-raksha-gold flex items-center justify-center z-10">
                    <span className="font-mono text-sm text-raksha-deep font-medium">{step.number}</span>
                  </div>

                  {/* Content */}
                  <div className={`ml-24 lg:ml-0 lg:w-[calc(50%-4rem)] ${
                    index % 2 === 0 ? 'lg:pr-16 lg:text-right' : 'lg:pl-16'
                  }`}>
                    <h3 className="text-xl font-semibold text-raksha-white mb-2">{step.title}</h3>
                    <p className="text-raksha-muted leading-relaxed">{step.description}</p>

                    {/* Hemoglobin Chart */}
                    {step.chart && (
                      <div className={`mt-6 bg-[#111827] border border-raksha-wine/30 rounded-2xl p-5 ${
                        index % 2 === 0 ? 'lg:ml-auto' : ''
                      } max-w-sm`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-raksha-white font-medium text-sm">Hemoglobin Trend</span>
                          <span className="text-raksha-muted text-xs">Last 30 days</span>
                        </div>
                        <div className="h-32 relative">
                          {/* Chart Grid */}
                          <div className="absolute inset-0 flex flex-col justify-between">
                            {[12, 10, 8, 6].map((val) => (
                              <div key={val} className="flex items-center gap-2">
                                <span className="text-raksha-muted text-xs w-6">{val}</span>
                                <div className="flex-1 border-t border-raksha-wine/20" />
                              </div>
                            ))}
                          </div>
                          {/* Raksha AI Line (Green - Stable) */}
                          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                            <path
                              d="M0,60 Q50,55 100,50 T200,45"
                              fill="none"
                              stroke="#1A7A4A"
                              strokeWidth="2"
                            />
                          </svg>
                          {/* Without Coordination Line (Red Dashed - Volatile) */}
                          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                            <path
                              d="M0,40 Q30,70 60,30 T120,80 T200,20"
                              fill="none"
                              stroke="#C0152A"
                              strokeWidth="2"
                              strokeDasharray="5,5"
                            />
                          </svg>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-raksha-green" />
                            <span className="text-raksha-muted text-xs">With Raksha AI</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-raksha-blood border-dashed" style={{ borderTop: '2px dashed #C0152A', backgroundColor: 'transparent' }} />
                            <span className="text-raksha-muted text-xs">Without</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Calendar */}
                    {step.calendar && (
                      <div className={`mt-6 bg-[#111827] border border-raksha-wine/30 rounded-2xl p-5 ${
                        index % 2 === 0 ? 'lg:ml-auto' : ''
                      } max-w-sm`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-raksha-white font-medium text-sm">June 2024</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {step.calendar.map((day) => (
                            <div 
                              key={day.date}
                              className={`text-center p-2 rounded-lg ${
                                day.status === 'confirmed' 
                                  ? 'bg-raksha-teal/20 border border-raksha-teal' 
                                  : 'bg-raksha-wine/10'
                              }`}
                            >
                              <span className="block text-raksha-muted text-xs">{day.day}</span>
                              <span className={`block font-mono text-sm ${
                                day.status === 'confirmed' ? 'text-raksha-teal' : 'text-raksha-white'
                              }`}>
                                {day.date}
                              </span>
                              {day.status === 'confirmed' && (
                                <svg className="w-4 h-4 mx-auto mt-1 text-raksha-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>
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
