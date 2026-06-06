import { Navbar } from '@/components/raksha/navbar'
import { HeroSection } from '@/components/raksha/hero-section'
import { RealityWallSection } from '@/components/raksha/reality-wall-section'
import { MissionSection } from '@/components/raksha/mission-section'
import { TwoJourneysSection } from '@/components/raksha/two-journeys-section'
import { HowItWorksSection } from '@/components/raksha/how-it-works-section'
import { ImpactSection } from '@/components/raksha/impact-section'
import { HumanStorySection } from '@/components/raksha/human-story-section'
import { PartnersSection } from '@/components/raksha/partners-section'
import { PreFooterCTASection } from '@/components/raksha/pre-footer-cta-section'
import { Footer } from '@/components/raksha/footer'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Section 1: Sticky Navigation Bar */}
      <Navbar />
      
      {/* Section 2: Hero */}
      <HeroSection />
      
      {/* Thin crimson divider */}
      <div className="h-px bg-raksha-wine" />
      
      {/* Section 3: The Reality Wall */}
      <RealityWallSection />
      
      {/* Thin crimson divider */}
      <div className="h-px bg-raksha-wine" />
      
      {/* Section 4: Mission Statement */}
      <MissionSection />
      
      {/* Thin crimson divider */}
      <div className="h-px bg-raksha-wine" />
      
      {/* Section 5: The Two Journeys */}
      <TwoJourneysSection />
      
      {/* Thin crimson divider */}
      <div className="h-px bg-raksha-wine" />
      
      {/* Section 6: How the AI Works */}
      <HowItWorksSection />
      
      {/* Thin crimson divider */}
      <div className="h-px bg-raksha-wine" />
      
      {/* Section 7: Impact Numbers */}
      <ImpactSection />
      
      {/* Thin crimson divider */}
      <div className="h-px bg-raksha-wine" />
      
      {/* Section 8: The Human Story */}
      <HumanStorySection />
      
      {/* Section 9: Partners Strip */}
      <PartnersSection />
      
      {/* Thin crimson divider */}
      <div className="h-px bg-raksha-wine" />
      
      {/* Section 10: Pre-Footer CTA */}
      <PreFooterCTASection />
      
      {/* Section 11: Footer */}
      <Footer />
    </main>
  )
}
