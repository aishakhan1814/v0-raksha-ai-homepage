'use client'

import { useState, useEffect, useCallback } from 'react'
import { FadeIn } from '../fade-in'

const donorStories = [
  {
    quote: "I never thought my B+ blood could mean so much. When I received the notification that a 7-year-old girl needed my exact type, I didn't hesitate. That was two years ago. Now I donate every three months.",
    name: "Arun Mehta",
    location: "Mumbai",
    stat: "12 donations",
    statLabel: "since joining"
  },
  {
    quote: "My sister has Thalassemia. For years, I watched my parents struggle to find compatible donors. Now I'm on the other side — helping families like mine find hope when they need it most.",
    name: "Priya Sharma",
    location: "Delhi",
    stat: "8 matches",
    statLabel: "confirmed"
  },
  {
    quote: "The AI matched me with a patient 200km away. The coordination was seamless — transport, timing, everything. I've never felt more useful in my life.",
    name: "Vikram Singh",
    location: "Jaipur",
    stat: "3 hours",
    statLabel: "avg response time"
  }
]

export function DonorStoriesSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % donorStories.length)
  }, [])

  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isPaused, nextSlide])

  return (
    <section className="relative py-32 bg-raksha-deep">
      <div className="noise-overlay" />
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn>
          <span className="inline-block text-xs font-sans font-medium tracking-[1.5px] text-raksha-crimson uppercase mb-6">
            Why Donors Give
          </span>
        </FadeIn>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {donorStories.map((story, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="bg-[#111827] border-t-2 border-raksha-gold rounded-2xl p-10 md:p-16">
                    <blockquote className="font-display text-2xl md:text-3xl lg:text-4xl italic text-raksha-warm leading-relaxed mb-10">
                      &ldquo;{story.quote}&rdquo;
                    </blockquote>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <p className="font-sans font-semibold text-raksha-white text-lg">
                          {story.name}
                        </p>
                        <p className="font-sans text-raksha-muted">
                          {story.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-3xl text-raksha-teal font-medium">
                          {story.stat}
                        </p>
                        <p className="font-sans text-sm text-raksha-muted uppercase tracking-wide">
                          {story.statLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {donorStories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-raksha-blood scale-125'
                    : 'bg-raksha-muted/30 hover:bg-raksha-muted/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-raksha-wine" />
    </section>
  )
}
