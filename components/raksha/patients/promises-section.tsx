"use client"

import { FadeIn } from "../fade-in"

const promises = [
  {
    number: "01",
    title: "Never miss a transfusion date",
    body: "Our AI predicts when your child will need blood next and schedules donors automatically — no more last-minute panic calls.",
  },
  {
    number: "02",
    title: "Always have compatible blood",
    body: "We match donors by blood type, antigen profile, and location. Your child gets the safest, most compatible blood every time.",
  },
  {
    number: "03",
    title: "Backup donor confirmed",
    body: "Every scheduled donation has a verified backup donor on standby. If the primary can't make it, someone else already will.",
    hasCheck: true,
  },
  {
    number: "04",
    title: "Direct hospital coordination",
    body: "We work with your blood bank and hospital directly. Donors arrive prepared, paperwork is ready, and you just show up.",
  },
  {
    number: "05",
    title: "24/7 emergency support",
    body: "Crisis at 2 AM? Our emergency line connects you with available donors in your city within minutes. We never sleep.",
  },
  {
    number: "06",
    title: "Transfusion Passport",
    body: "A complete portable compatibility profile (antibody panel, reaction history, preferred donors) that goes with you across any hospital in India. A clinical first.",
  },
]

export function PromisesSection() {
  return (
    <section className="py-24 md:py-32" style={{ backgroundColor: "#0A1628" }}>
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <span
            className="inline-block text-xs font-sans font-medium tracking-[0.15em] uppercase mb-4"
            style={{ color: "#9B2335" }}
          >
            Our Promises
          </span>
          <h2
            className="font-serif text-3xl md:text-5xl font-semibold mb-16"
            style={{ color: "#FAF9F7" }}
          >
            Six things we guarantee
          </h2>
        </FadeIn>

        <div className="space-y-12">
          {promises.map((promise, index) => (
            <FadeIn key={promise.number} delay={index * 0.1}>
              <div className="flex gap-8 items-start">
                <span
                  className="font-serif text-5xl md:text-7xl font-bold shrink-0"
                  style={{ color: "#C0152A" }}
                >
                  {promise.number}
                </span>
                <div className="pt-2">
                  <h3
                    className="font-sans text-xl md:text-2xl font-semibold mb-2 flex items-center gap-3"
                    style={{ color: "#FAF9F7" }}
                  >
                    {promise.title}
                    {promise.hasCheck && (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="#2CA8A0"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </h3>
                  <p
                    className="font-sans text-base font-light max-w-xl"
                    style={{ color: "#6B7280" }}
                  >
                    {promise.body}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
