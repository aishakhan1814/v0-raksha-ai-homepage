"use client"

import { useState } from "react"
import { FadeIn } from "../fade-in"

const faqs = [
  {
    question: "Is Raksha AI really free for families?",
    answer:
      "Yes, completely free. We're funded by donors and partners who believe every thalassemia patient deserves reliable blood access. You'll never pay a single rupee.",
  },
  {
    question: "How do you find compatible donors?",
    answer:
      "Our AI matches donors by blood type, antigen profile, location, and availability. We maintain a verified network of regular donors who've been screened and are committed to helping patients like your child.",
  },
  {
    question: "What happens in an emergency?",
    answer:
      "Call our 24/7 emergency line. Our system immediately alerts all compatible donors in your area. We've connected families with donors in under an hour during crisis situations.",
  },
  {
    question: "Do donors come directly to the hospital?",
    answer:
      "Yes. We coordinate with your hospital's blood bank. Donors arrive prepared, complete the donation, and the blood is processed for your child. You just need to bring your child for the transfusion.",
  },
  {
    question: "How quickly can you start helping us?",
    answer:
      "Within 24-48 hours of registration, we begin matching donors. Your first scheduled transfusion with a Raksha-matched donor typically happens within 1-2 weeks.",
  },
  {
    question: "What if a donor cancels last minute?",
    answer:
      "Every scheduled donation has a backup donor confirmed. If the primary donor can't make it, the backup is automatically notified. You'll never be left without a donor.",
  },
  {
    question: "Is my information safe?",
    answer:
      "Absolutely. We use bank-level encryption, never share personal data with third parties, and comply with all healthcare privacy regulations. Your family's information is protected.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-24 md:py-32" style={{ backgroundColor: "#0D0D0D" }}>
      <div className="max-w-4xl mx-auto px-6">
        <FadeIn>
          <span
            className="inline-block text-xs font-sans font-medium tracking-[0.15em] uppercase mb-4"
            style={{ color: "#9B2335" }}
          >
            Questions
          </span>
          <h2
            className="font-serif text-3xl md:text-5xl font-semibold mb-12"
            style={{ color: "#FAF9F7" }}
          >
            Frequently asked
          </h2>
        </FadeIn>

        <div className="space-y-0">
          {faqs.map((faq, index) => (
            <FadeIn key={index} delay={index * 0.05}>
              <div
                className="border-b"
                style={{ borderColor: "#1e293b", backgroundColor: "#111827" }}
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between py-6 px-6 text-left transition-colors hover:bg-slate-800/50"
                >
                  <span
                    className="font-sans text-base md:text-lg font-medium pr-4"
                    style={{ color: "#FAF9F7" }}
                  >
                    {faq.question}
                  </span>
                  <svg
                    className="w-5 h-5 shrink-0 transition-transform duration-300"
                    style={{
                      color: "#C0152A",
                      transform:
                        openIndex === index ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: openIndex === index ? "200px" : "0px",
                    opacity: openIndex === index ? 1 : 0,
                  }}
                >
                  <p
                    className="px-6 pb-6 font-sans text-base leading-relaxed"
                    style={{ color: "#6B7280" }}
                  >
                    {faq.answer}
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
