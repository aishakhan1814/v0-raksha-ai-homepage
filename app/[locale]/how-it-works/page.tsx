import { Navbar } from '@/components/raksha/navbar'
import { Footer } from '@/components/raksha/footer'
import { HIWHeroSection } from '@/components/raksha/hiw/hero-section'
import { ProblemSection } from '@/components/raksha/hiw/problem-section'
import { DonorJourneySection } from '@/components/raksha/hiw/donor-journey-section'
import { PatientJourneySection } from '@/components/raksha/hiw/patient-journey-section'
import { AIEngineSection } from '@/components/raksha/hiw/ai-engine-section'
import { HIWCTASection } from '@/components/raksha/hiw/cta-section'

export const metadata = {
  title: 'How It Works | Raksha AI',
  description: 'Learn how Raksha AI transforms blood donation and care coordination for Thalassemia patients in India.',
}

export default function HowItWorksPage() {
  return (
    <main className="bg-raksha-deep">
      <Navbar />
      <HIWHeroSection />
      <ProblemSection />
      <DonorJourneySection />
      <PatientJourneySection />
      <AIEngineSection />
      <HIWCTASection />
      <Footer />
    </main>
  )
}
