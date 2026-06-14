'use client'

import { FadeIn } from './fade-in'
import { useLanguage } from '@/context/LanguageContext'

export function HumanStorySection() {
  const { t } = useLanguage()

  const stories = [
    {
      type: 'patient',
      name: t('stories.priya.name'),
      location: t('stories.priya.location'),
      quote: t('stories.priya.quote'),
      role: t('stories.priya.role'),
      accent: '#E8897A', // coral
    },
    {
      type: 'donor',
      name: t('stories.rajesh.name'),
      location: t('stories.rajesh.location'),
      quote: t('stories.rajesh.quote'),
      role: t('stories.rajesh.role'),
      accent: '#2CA8A0', // teal
    },
  ]

  return (
    <section className="relative py-24 lg:py-32 bg-raksha-navy grain-overlay">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-raksha-crimson text-xs uppercase tracking-[0.15em] font-medium mb-4 text-center">
            {t('stories.label')}
          </p>
        </FadeIn>
        
        <FadeIn delay={50}>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-raksha-white text-center mb-16 text-balance">
            {t('stories.headline')}
          </h2>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {stories.map((story, index) => (
            <FadeIn key={story.name} delay={index * 100}>
              <div className="bg-[#111827] p-8 lg:p-10 rounded-2xl relative">
                {/* Accent bar */}
                <div 
                  className="absolute left-0 top-8 bottom-8 w-1 rounded-r"
                  style={{ backgroundColor: story.accent }}
                />
                
                <blockquote className="font-display text-xl lg:text-2xl text-raksha-warm italic leading-relaxed mb-8 pl-6">
                  &ldquo;{story.quote}&rdquo;
                </blockquote>
                
                <div className="flex items-center gap-4 pl-6">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-raksha-white font-semibold"
                    style={{ backgroundColor: story.accent }}
                  >
                    {story.name.split(' ').map(n => n ? n[0] : '').join('')}
                  </div>
                  <div>
                    <p className="text-raksha-white font-medium">{story.name}</p>
                    <p className="text-raksha-muted text-sm">
                      {story.role} • {story.location}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Full-width pull quote */}
        <FadeIn delay={300}>
          <div className="border-t border-b border-raksha-wine py-12">
            <blockquote className="font-display text-2xl sm:text-3xl lg:text-[40px] text-raksha-warm text-center italic leading-snug max-w-4xl mx-auto">
              &ldquo;{t('stories.pullQuote')}&rdquo;
            </blockquote>
            <p className="text-raksha-muted text-center mt-6">
              {t('stories.author')}
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
