"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { FadeIn } from "../fade-in"

export function ClosingCtaSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7
    }
  }, [])

  return (
    <section className="relative py-32 md:py-40 overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://videos.pexels.com/video-files/4812204/4812204-hd_1920_1080_25fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark forest green overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(15, 26, 18, 0.75)" }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <FadeIn>
          {/* Pulsing donor circle animation */}
          <div className="flex justify-center mb-12">
            <div className="relative w-24 h-24">
              {/* Central crimson dot */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
                style={{ backgroundColor: "#C0152A" }}
              />
              {/* Pulsing teal ring */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 animate-ping"
                style={{ borderColor: "#2CA8A0", opacity: 0.5 }}
              />
              {/* Outer teal dots */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: "#2CA8A0",
                    top: `${50 + 45 * Math.sin((i * Math.PI * 2) / 6)}%`,
                    left: `${50 + 45 * Math.cos((i * Math.PI * 2) / 6)}%`,
                    transform: "translate(-50%, -50%)",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-6"
            style={{ color: "#FAF9F7" }}
          >
            Your child deserves
            <br />
            certainty, not chaos.
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p
            className="font-sans text-lg md:text-xl font-light max-w-xl mx-auto mb-10"
            style={{ color: "rgba(245, 236, 215, 0.8)" }}
          >
            Let us handle the donors. You focus on being there.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href=""
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-sans font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#C0152A" }}
            >
              Register My Patient Now
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
            <a
              href="https://wa.me/911234567890"
              className="inline-flex items-center gap-2 font-sans text-base font-medium transition-opacity hover:opacity-80"
              style={{ color: "#2CA8A0" }}
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp us
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
