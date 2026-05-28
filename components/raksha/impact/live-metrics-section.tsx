"use client"

import { useEffect, useRef, useState } from 'react'

interface MetricCardProps {
  value: number
  suffix?: string
  label: string
  accentColor: string
}

function MetricCard({ value, suffix = '', label, accentColor }: MetricCardProps) {
  const [count, setCount] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 2000
          const steps = 60
          const increment = value / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= value) {
              setCount(value)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [value])

  const formatNumber = (num: number) => {
    if (suffix === '%') {
      return num.toFixed(1)
    }
    return num.toLocaleString('en-IN')
  }

  return (
    <div
      ref={cardRef}
      className="bg-[#111827] rounded-2xl p-6 md:p-8 relative overflow-hidden group hover:border-[#9B2335] border border-transparent transition-colors duration-300"
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: accentColor }}
      />
      
      <div className="font-mono text-4xl md:text-5xl lg:text-6xl text-[#FAF9F7] mb-2">
        {formatNumber(count)}{suffix}
      </div>
      <p className="font-sans text-sm md:text-base text-[#6B7280]">{label}</p>
    </div>
  )
}

export function LiveMetricsSection() {
  const metrics = [
    { value: 847, label: 'Patients Supported', accentColor: '#C0152A' },
    { value: 2341, label: 'Active Donors', accentColor: '#FAF9F7' },
    { value: 124, label: 'Matches This Month', accentColor: '#D4A847' },
    { value: 17, label: 'Cities Connected', accentColor: '#FAF9F7' },
    { value: 4872, label: 'Transfusions Coordinated', accentColor: '#C0152A' },
    { value: 98.3, suffix: '%', label: 'Match Success Rate', accentColor: '#2CA8A0' },
  ]

  return (
    <section className="py-20 md:py-28 bg-[#0A1628] relative">
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9B2335] font-sans mb-4 text-center">
          Real-Time Metrics
        </p>
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#FAF9F7] text-center mb-12 md:mb-16">
          The Pulse of Our Network
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              value={metric.value}
              suffix={metric.suffix}
              label={metric.label}
              accentColor={metric.accentColor}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
