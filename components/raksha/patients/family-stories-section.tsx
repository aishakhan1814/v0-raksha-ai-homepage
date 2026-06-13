"use client"

import { useState, useEffect } from "react"
import { FadeIn } from "../fade-in"

const stories = [
  {
    quote:
      "Before Raksha, I spent every week calling relatives, begging for donors. Now I get a notification three days before each transfusion — donor confirmed. I can finally breathe.",
    name: "Priya Sharma",
    relation: "Mother of Arjun, 7",
    location: "Mumbai",
  },
  {
    quote:
      "My son used to be terrified of transfusion days. Now he asks 'Is uncle Vikram coming today?' He's made friends with his regular donors. That's something I never imagined.",
    name: "Lakshmi Reddy",
    relation: "Mother of Karthik, 9",
    location: "Hyderabad",
  },
  {
    quote:
      "The emergency line saved us. Kiran had a crisis at midnight — they found a compatible donor in 40 minutes. I don't know how, but they did.",
    name: "Anjali Patel",
    relation: "Mother of Kiran, 5",
    location: "Ahmedabad",
  },
  {
    quote:
      "I'm a single father. I can't take days off work to hunt for donors. Raksha handles everything — I just get a message telling me when to bring her in.",
    name: "Suresh Kumar",
    relation: "Father of Meera, 11",
    location: "Chennai",
  },
]

export function FamilyStoriesSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % stories.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [isPaused])

  return (
    <section className="py-24 md:py-32" style={{ backgroundColor: "#0D0D0D" }}>
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <span
            className="inline-block text-xs font-sans font-medium tracking-[0.15em] uppercase mb-4"
            style={{ color: "#9B2335" }}
          >
            Family Stories
          </span>
          <h2
            className="font-serif text-3xl md:text-5xl font-semibold mb-16"
            style={{ color: "#FAF9F7" }}
          >
            From families like yours
          </h2>
        </FadeIn>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {stories.map((story, index) => (
                <div key={index} className="w-full flex-shrink-0 px-2">
                  <div
                    className="p-8 md:p-12 rounded-2xl"
                    style={{
                      backgroundColor: "#111827",
                      borderLeft: "4px solid #D4A847",
                    }}
                  >
                    <blockquote
                      className="font-serif text-xl md:text-2xl italic leading-relaxed mb-8"
                      style={{ color: "#F5ECD7" }}
                    >
                      &ldquo;{story.quote}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-sans font-medium"
                        style={{ backgroundColor: "#E8897A", color: "#0D0D0D" }}
                      >
                        {story.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p
                          className="font-sans font-medium"
                          style={{ color: "#FAF9F7" }}
                        >
                          {story.name}
                        </p>
                        <p
                          className="font-sans text-sm"
                          style={{ color: "#6B7280" }}
                        >
                          {story.relation} · {story.location}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-3 mt-8">
            {stories.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor:
                    index === activeIndex ? "#E8897A" : "#374151",
                }}
                aria-label={`Go to story ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
