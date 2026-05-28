'use client'

import { FadeIn } from './fade-in'
import { Counter } from './counter'

export function MissionSection() {
  return (
    <section className="relative py-24 lg:py-32 bg-raksha-navy grain-overlay">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
          {/* Left - Pull Quote */}
          <FadeIn>
            <blockquote className="font-display text-3xl sm:text-4xl lg:text-[44px] text-raksha-warm italic leading-snug">
              &ldquo;Every Thalassemia patient deserves a donor who keeps coming back.&rdquo;
            </blockquote>
          </FadeIn>

          {/* Right - Body Text */}
          <FadeIn delay={100}>
            <div className="space-y-6 text-raksha-muted leading-relaxed">
              <p>
                Thalassemia Major is a genetic blood disorder that requires lifelong blood transfusions — 
                typically every 2-3 weeks. Without regular transfusions, patients face severe anemia, 
                organ damage, and shortened life expectancy.
              </p>
              <p>
                In India alone, over 1 lakh children are born with Thalassemia Major every year. 
                Each patient needs 500-700 transfusions over their lifetime. That&apos;s not just 
                500 blood bags — it&apos;s 500 moments of uncertainty, coordination, and hope.
              </p>
              <p>
                Raksha AI was built to eliminate that uncertainty. We match patients with committed 
                donors, predict transfusion needs, and ensure no patient ever faces a shortage alone.
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
              <p className="text-raksha-white font-medium">Thalassemia patients in India</p>
            </div>
          </FadeIn>
          
          <FadeIn delay={100}>
            <div className="bg-[#111827] p-8 border-t border-raksha-wine">
              <p className="font-mono text-4xl lg:text-5xl text-raksha-blood mb-2">
                Every 21 Days
              </p>
              <p className="text-raksha-white font-medium">Average transfusion frequency</p>
            </div>
          </FadeIn>
          
          <FadeIn delay={200}>
            <div className="bg-[#111827] p-8 border-t border-raksha-wine">
              <p className="font-mono text-4xl lg:text-5xl text-raksha-blood mb-2">
                <Counter end={500} />–700
              </p>
              <p className="text-raksha-white font-medium">Transfusions per lifetime</p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
