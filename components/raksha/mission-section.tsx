'use client'

import { FadeIn } from './fade-in'
import { Counter } from './counter'
import { useLanguage } from '@/context/LanguageContext'

export function MissionSection() {
  const { t } = useLanguage()

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
              <p>
                {t('mission.para1')}
              </p>
              <p>
                {t('mission.para2')}
              </p>
              <p>
                {t('mission.para3')}
              </p>
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
              <p className="text-raksha-white font-medium">{t('mission.stat1label')}</p>
            </div>
          </FadeIn>
          
          <FadeIn delay={100}>
            <div className="bg-[#111827] p-8 border-t border-raksha-wine">
              <p className="font-mono text-4xl lg:text-5xl text-raksha-blood mb-2">
                {t('hero.stat2')}
              </p>
              <p className="text-raksha-white font-medium">{t('mission.stat2label')}</p>
            </div>
          </FadeIn>
          
          <FadeIn delay={200}>
            <div className="bg-[#111827] p-8 border-t border-raksha-wine">
              <p className="font-mono text-4xl lg:text-5xl text-raksha-blood mb-2">
                <Counter end={500} />–700
              </p>
              <p className="text-raksha-white font-medium">{t('mission.stat3label')}</p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
