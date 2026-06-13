import { Navbar } from "@/components/raksha/navbar"
import { Footer } from "@/components/raksha/footer"
import { PatientsHeroSection } from "@/components/raksha/patients/hero-section"
import { PromisesSection } from "@/components/raksha/patients/promises-section"
import { FamilyStoriesSection } from "@/components/raksha/patients/family-stories-section"
import { RegistrationFormSection } from "@/components/raksha/patients/registration-form-section"
import { FaqSection } from "@/components/raksha/patients/faq-section"
import { ClosingCtaSection } from "@/components/raksha/patients/closing-cta-section"

export const metadata = {
  title: "For Patients & Families | Raksha AI",
  description:
    "Register your thalassemia patient with Raksha AI. We connect you with verified, compatible blood donors so you never miss a transfusion again.",
}

export default function ForPatientsPage() {
  return (
    <main className="bg-background">
      <Navbar />
      <PatientsHeroSection />
      <div className="h-px w-full" style={{ backgroundColor: "#8B1A2A" }} />
      <PromisesSection />
      <div className="h-px w-full" style={{ backgroundColor: "#8B1A2A" }} />
      <FamilyStoriesSection />
      <div className="h-px w-full" style={{ backgroundColor: "#8B1A2A" }} />
      <RegistrationFormSection />
      <div className="h-px w-full" style={{ backgroundColor: "#8B1A2A" }} />
      <FaqSection />
      <div className="h-px w-full" style={{ backgroundColor: "#8B1A2A" }} />
      <ClosingCtaSection />
      <Footer />
    </main>
  )
}
