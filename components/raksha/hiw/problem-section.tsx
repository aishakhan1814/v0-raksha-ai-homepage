'use client'

import { useTranslations } from '@/lib/i18n-context'
import { FadeIn } from '../fade-in'

export function ProblemSection() {
  const t = useTranslations()

  const beforeItems = [
    t('howItWorks.problem.before1'),
    t('howItWorks.problem.before2'),
    t('howItWorks.problem.before3'),
    t('howItWorks.problem.before4'),
    t('howItWorks.problem.before5'),
  ]

  const afterItems = [
    t('howItWorks.problem.after1'),
    t('howItWorks.problem.after2'),
    t('howItWorks.problem.after3'),
    t('howItWorks.problem.after4'),
    t('howItWorks.problem.after5'),
  ]

  return (
    <section className="relative">
      {/* Split Background */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 bg-raksha-deep" />
        <div className="w-1/2 bg-raksha-navy" />
      </div>

      {/* Crimson Divider Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-raksha-blood hidden lg:block" />

      {/* Grain Texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Before Raksha */}
          <FadeIn>
            <div className="space-y-8">
              <div>
                <span className="inline-block text-raksha-crimson/70 text-xs font-medium tracking-[0.15em] uppercase mb-4">
                  {t('howItWorks.problem.beforeLabel')}
                </span>
                <h2 className="font-display text-3xl sm:text-4xl text-raksha-white/80 leading-tight">
                  {t('howItWorks.problem.beforeTitle')}
                </h2>
              </div>

              <ul className="space-y-4">
                {beforeItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-raksha-crimson/70">
                    <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-raksha-white/60">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          {/* With Raksha AI */}
          <FadeIn delay={200}>
            <div className="space-y-8">
              <div>
                <span className="inline-block text-raksha-teal text-xs font-medium tracking-[0.15em] uppercase mb-4">
                  {t('howItWorks.problem.afterLabel')}
                </span>
                <h2 className="font-display text-3xl sm:text-4xl text-raksha-white leading-tight">
                  {t('howItWorks.problem.afterTitle')}
                </h2>
              </div>

              <ul className="space-y-4">
                {afterItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-0.5 shrink-0 text-raksha-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-raksha-white">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Bottom Crimson Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-raksha-wine" />
    </section>
  )
}
