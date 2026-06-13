'use client'

import { FadeIn } from './fade-in'

const stories = [
  {
    type: 'patient',
    name: 'Priya Sharma',
    location: 'Mumbai',
    quote: 'Before Raksha AI, every transfusion day was a crisis. Now, I get a notification, a donor is already confirmed, and we just show up. My daughter finally has a normal childhood between transfusions.',
    accent: '#E8897A', // coral
  },
  {
    type: 'donor',
    name: 'Rajesh Kumar',
    location: 'Delhi',
    quote: 'I used to donate randomly — once a year, maybe. Now I donate every 3 months to the same child. I\'ve seen her grow up through Raksha AI updates. She calls me her "blood uncle." That\'s worth more than anything.',
    accent: '#2CA8A0', // teal
  },
]

export function HumanStorySection() {
  return (
    <section className="relative py-24 lg:py-32 bg-raksha-navy grain-overlay">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-raksha-crimson text-xs uppercase tracking-[0.15em] font-medium mb-4 text-center">
            Real Stories
          </p>
        </FadeIn>
        
        <FadeIn delay={50}>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-raksha-white text-center mb-16 text-balance">
            The humans behind the numbers
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
                    {story.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-raksha-white font-medium">{story.name}</p>
                    <p className="text-raksha-muted text-sm">
                      {story.type === 'patient' ? 'Patient Family' : 'Recurring Donor'} • {story.location}
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
              &ldquo;When you save a life every 21 days, you don&apos;t just become a donor. You become family.&rdquo;
            </blockquote>
            <p className="text-raksha-muted text-center mt-6">
              — A Raksha AI Donor
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
