'use client'

import { useTranslations } from 'next-intl'
import { FadeIn } from './fade-in'
import { Counter } from './counter'

export function MissionSection() {
  const t = useTranslations()
  return (
    <section className="relative py-24 lg:py-32 bg-raksha-navy grain-overlay">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
          {/* Left - Pull Quote */}
          <FadeIn>
            <blockquote className="font-display text-3xl sm:text-4xl lg:text-[44px] text-raksha-warm italic leading-snug">
              &ldquo;{t('mission.quote')}&rdquo;
            </blockquote>
          </FadeIn>

          {/* Right - Body Text */}
          <FadeIn delay={100}>
            <div className="space-y-6 text-raksha-muted leading-relaxed">
              <p>{t('mission.desc1')}</p>
              <p>{t('mission.desc2')}</p>
              <p>{t('mission.desc3')}</p>
            </div>
          </FadeIn>
        </div>

        {/* Stat Boxes */}
        <div className="grid sm:grid-cols-3 gap-6">
          <FadeIn delay={0}>
            <div className="bg-[#111827] p-8 border-t border-raksha-wine">
              <p className="font-mono text-4xl lg:text-5xl text-raksha-blood mb-2">
                <Counter end={100000} suffix="+" />
              </p>
              <p className="text-raksha-white font-medium">{t('mission.stat1Label')}</p>
            </div>
          </FadeIn>
          
          <FadeIn delay={100}>
            <div className="bg-[#111827] p-8 border-t border-raksha-wine">
              <p className="font-mono text-4xl lg:text-5xl text-raksha-blood mb-2">
                {t('mission.stat2Title')}
              </p>
              <p className="text-raksha-white font-medium">{t('mission.stat2Desc')}</p>
            </div>
          </FadeIn>
          
          <FadeIn delay={200}>
            <div className="bg-[#111827] p-8 border-t border-raksha-wine">
              <p className="font-mono text-4xl lg:text-5xl text-raksha-blood mb-2">
                {t('mission.stat3Count')}
              </p>
              <p className="text-raksha-white font-medium">{t('mission.stat3Label')}</p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
