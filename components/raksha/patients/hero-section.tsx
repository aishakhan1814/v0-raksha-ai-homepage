"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { FadeIn } from "../fade-in"

export function PatientsHeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.65
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://videos.pexels.com/video-files/6823562/6823562-hd_1920_1080_25fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark forest green overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(15, 26, 18, 0.80)" }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <FadeIn>
          <span
            className="inline-block text-xs font-sans font-medium tracking-[0.15em] uppercase mb-6"
            style={{ color: "#2CA8A0" }}
          >
            For Thalassemia Families
          </span>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1
            className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight mb-6"
            style={{ color: "#FAF9F7" }}
          >
            {"You've been fighting this alone."}
            <br />
            {"You don't have to anymore."}
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p
            className="font-sans text-lg md:text-xl font-light max-w-2xl mx-auto mb-10"
            style={{ color: "rgba(245, 236, 215, 0.8)" }}
          >
            Raksha AI connects your child with verified, compatible donors — so you
            can focus on what matters most: being there for them.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Link
            href="/register/patient"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-sans font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C0152A" }}
          >
            Register My Patient
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </FadeIn>

        {/* CSS illustration: protective circle */}
        <FadeIn delay={0.4}>
          <div className="mt-16 flex justify-center">
            <div className="relative w-32 h-32">
              {/* Central crimson dot */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                style={{ backgroundColor: "#C0152A" }}
              />
              {/* Protective teal dots */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: "#2CA8A0",
                    top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8)}%`,
                    left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8)}%`,
                    transform: "translate(-50%, -50%)",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
