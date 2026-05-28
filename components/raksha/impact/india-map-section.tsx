"use client"

import { useState } from 'react'

interface City {
  name: string
  x: number
  y: number
  patients: number
  donors: number
}

const cities: City[] = [
  { name: 'Mumbai', x: 28, y: 58, patients: 156, donors: 423 },
  { name: 'Delhi', x: 38, y: 28, patients: 134, donors: 387 },
  { name: 'Bangalore', x: 36, y: 76, patients: 98, donors: 276 },
  { name: 'Chennai', x: 44, y: 78, patients: 87, donors: 234 },
  { name: 'Kolkata', x: 62, y: 42, patients: 76, donors: 198 },
  { name: 'Hyderabad', x: 40, y: 64, patients: 89, donors: 245 },
  { name: 'Ahmedabad', x: 26, y: 44, patients: 54, donors: 156 },
  { name: 'Pune', x: 30, y: 62, patients: 45, donors: 134 },
  { name: 'Jaipur', x: 32, y: 34, patients: 38, donors: 98 },
  { name: 'Lucknow', x: 46, y: 34, patients: 32, donors: 87 },
  { name: 'Surat', x: 26, y: 52, patients: 28, donors: 76 },
  { name: 'Bhopal', x: 38, y: 48, patients: 24, donors: 67 },
  { name: 'Nagpur', x: 42, y: 54, patients: 21, donors: 54 },
  { name: 'Indore', x: 34, y: 50, patients: 19, donors: 48 },
  { name: 'Coimbatore', x: 36, y: 82, patients: 16, donors: 43 },
  { name: 'Kochi', x: 34, y: 84, patients: 14, donors: 38 },
  { name: 'Patna', x: 54, y: 38, patients: 12, donors: 34 },
]

export function IndiaMapSection() {
  const [hoveredCity, setHoveredCity] = useState<City | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  return (
    <section className="py-20 md:py-28 bg-[#0D0D0D] relative">
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9B2335] font-sans mb-4 text-center">
          Geographic Reach
        </p>
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#FAF9F7] text-center mb-12 md:mb-16">
          A Network Across India
        </h2>

        {/* Map Container */}
        <div className="relative max-w-2xl mx-auto">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-auto"
            style={{ maxHeight: '600px' }}
          >
            {/* Simplified India outline */}
            <path
              d="M35 8 L55 5 L70 12 L75 25 L72 35 L78 42 L72 48 L65 42 L60 48 L55 45 L50 50 L55 55 L50 65 L45 70 L50 80 L45 90 L40 88 L35 92 L30 85 L25 75 L20 65 L22 55 L18 50 L22 42 L20 35 L25 28 L30 20 L35 15 Z"
              fill="#0A1628"
              stroke="#9B2335"
              strokeWidth="0.5"
            />
            
            {/* City markers with pulse animation */}
            {cities.map((city, index) => (
              <g
                key={city.name}
                onMouseEnter={(e) => {
                  setHoveredCity(city)
                  const rect = e.currentTarget.getBoundingClientRect()
                  setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top })
                }}
                onMouseLeave={() => setHoveredCity(null)}
                className="cursor-pointer"
              >
                {/* Pulse ring animation */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r="2"
                  fill="none"
                  stroke="#C0152A"
                  strokeWidth="0.3"
                  opacity="0.6"
                  className="animate-ping"
                  style={{ 
                    animationDelay: `${index * 0.2}s`,
                    transformOrigin: `${city.x}px ${city.y}px`
                  }}
                />
                {/* City dot */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r="1.2"
                  fill="#C0152A"
                  className="transition-all duration-300 hover:r-2"
                />
              </g>
            ))}
          </svg>

          {/* Tooltip */}
          {hoveredCity && (
            <div 
              className="absolute z-20 bg-[#111827] border border-[#C0152A] rounded-lg p-4 pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{ 
                left: `${hoveredCity.x}%`, 
                top: `${hoveredCity.y - 5}%`,
              }}
            >
              <p className="font-sans text-[#FAF9F7] font-medium mb-2">{hoveredCity.name}</p>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-[#C0152A] font-mono">{hoveredCity.patients}</span>
                  <span className="text-[#6B7280] ml-1">patients</span>
                </div>
                <div>
                  <span className="text-[#2CA8A0] font-mono">{hoveredCity.donors}</span>
                  <span className="text-[#6B7280] ml-1">donors</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#C0152A]" />
            <span className="font-sans text-sm text-[#6B7280]">City Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2CA8A0]" />
            <span className="font-sans text-sm text-[#6B7280]">Active Network</span>
          </div>
        </div>
      </div>
    </section>
  )
}
