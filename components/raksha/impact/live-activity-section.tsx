"use client"

import { useEffect, useRef, useState } from 'react'

type ActivityType = 'match' | 'confirmed' | 'badge'

interface Activity {
  id: number
  type: ActivityType
  message: string
  time: string
  location: string
}

const initialActivities: Activity[] = [
  { id: 1, type: 'match', message: 'New donor-patient match completed', time: '2 min ago', location: 'Mumbai' },
  { id: 2, type: 'confirmed', message: 'Donation confirmed by Rajesh K.', time: '5 min ago', location: 'Delhi' },
  { id: 3, type: 'badge', message: 'Priya M. earned "5 Donations" badge', time: '8 min ago', location: 'Bangalore' },
  { id: 4, type: 'match', message: 'Urgent B- match found for patient', time: '12 min ago', location: 'Chennai' },
  { id: 5, type: 'confirmed', message: 'Transfusion completed successfully', time: '15 min ago', location: 'Kolkata' },
  { id: 6, type: 'badge', message: 'Amit S. earned "Guardian" status', time: '18 min ago', location: 'Hyderabad' },
  { id: 7, type: 'match', message: 'O+ donor matched with 3 patients', time: '22 min ago', location: 'Pune' },
  { id: 8, type: 'confirmed', message: 'Emergency request fulfilled', time: '25 min ago', location: 'Ahmedabad' },
]

const newActivities: Omit<Activity, 'id' | 'time'>[] = [
  { type: 'match', message: 'AB+ donor found for rare requirement', location: 'Jaipur' },
  { type: 'confirmed', message: 'Scheduled donation confirmed', location: 'Lucknow' },
  { type: 'badge', message: 'Neha R. reached 10 donations milestone', location: 'Surat' },
  { type: 'match', message: 'Critical match: A- for thalassemia patient', location: 'Bhopal' },
  { type: 'confirmed', message: 'Family notified of successful match', location: 'Nagpur' },
  { type: 'badge', message: 'Community group "Blood Warriors" formed', location: 'Indore' },
]

function ActivityIcon({ type }: { type: ActivityType }) {
  const colors = {
    match: '#C0152A',
    confirmed: '#2CA8A0',
    badge: '#D4A847',
  }

  const icons = {
    match: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.match} strokeWidth="2">
        <path d="M12 2C12 2 8 8 8 12C8 15.31 10.24 18 12 18C13.76 18 16 15.31 16 12C16 8 12 2 12 2Z" />
        <path d="M12 18V22" />
        <path d="M8 22H16" />
      </svg>
    ),
    confirmed: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.confirmed} strokeWidth="2">
        <path d="M20 6L9 17L4 12" />
      </svg>
    ),
    badge: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.badge} strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  }

  return (
    <div 
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${colors[type]}20` }}
    >
      {icons[type]}
    </div>
  )
}

export function LiveActivitySection() {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [isPaused, setIsPaused] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)
  const activityCounter = useRef(initialActivities.length)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      const randomActivity = newActivities[Math.floor(Math.random() * newActivities.length)]
      activityCounter.current += 1
      
      const newActivity: Activity = {
        id: activityCounter.current,
        type: randomActivity.type,
        message: randomActivity.message,
        location: randomActivity.location,
        time: 'Just now',
      }

      setActivities(prev => [newActivity, ...prev.slice(0, 9)])
    }, 4000)

    return () => clearInterval(interval)
  }, [isPaused])

  return (
    <section className="py-20 md:py-28 bg-[#0D0D0D] relative">
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9B2335] font-sans mb-4 text-center">
          Happening Now
        </p>
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#FAF9F7] text-center mb-12 md:mb-16">
          Live Activity Feed
        </h2>

        {/* Feed Container */}
        <div
          ref={feedRef}
          className="bg-[#111827] rounded-2xl border-l-2 border-[#C0152A] overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="max-h-[500px] overflow-y-auto">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 md:p-5 border-b border-[#1F2937] last:border-b-0 animate-fade-in-up"
                style={{ 
                  animationDelay: index === 0 ? '0ms' : `${index * 50}ms`,
                  opacity: index === 0 ? 1 : undefined
                }}
              >
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[#FAF9F7] text-sm md:text-base">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-xs text-[#6B7280]">{activity.time}</span>
                    <span className="text-[#6B7280]">·</span>
                    <span className="font-sans text-xs text-[#6B7280]">{activity.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pause indicator */}
        {isPaused && (
          <p className="text-center text-[#6B7280] text-sm mt-4 font-sans">
            Feed paused — hover to resume
          </p>
        )}

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#C0152A]" />
            <span className="font-sans text-sm text-[#6B7280]">Match Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2CA8A0]" />
            <span className="font-sans text-sm text-[#6B7280]">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#D4A847]" />
            <span className="font-sans text-sm text-[#6B7280]">Badge Earned</span>
          </div>
        </div>
      </div>
    </section>
  )
}
