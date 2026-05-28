import { Metadata } from 'next'
import { Navbar } from '@/components/raksha/navbar'
import { DonorsHeroSection } from '@/components/raksha/donors/hero-section'
import { DonorStoriesSection } from '@/components/raksha/donors/stories-section'
import { EligibilitySection } from '@/components/raksha/donors/eligibility-section'
import { CommitmentTiersSection } from '@/components/raksha/donors/commitment-tiers-section'
import { BenefitsSection } from '@/components/raksha/donors/benefits-section'
import { CompatibilitySection } from '@/components/raksha/donors/compatibility-section'
import { RegistrationCTASection } from '@/components/raksha/donors/registration-cta-section'
import { Footer } from '@/components/raksha/footer'

export const metadata: Metadata = {
  title: 'For Donors | Raksha AI',
  description: 'Register as a blood donor and become someone\'s lifeline. Join thousands of verified donors supporting Thalassemia patients across India.',
}

export default function ForDonorsPage() {
  return (
    <main className="bg-raksha-deep min-h-screen">
      <Navbar />
      <DonorsHeroSection />
      <DonorStoriesSection />
      <EligibilitySection />
      <CommitmentTiersSection />
      <BenefitsSection />
      <CompatibilitySection />
      <RegistrationCTASection />
      <Footer />
    </main>
  )
}
