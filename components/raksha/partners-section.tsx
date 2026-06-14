'use client'

import { useLanguage } from '@/context/LanguageContext'

const partners = [
  'Blood Warriors Foundation',
  'KEM Hospital Mumbai',
  'AIIMS Delhi',
  'Rotary Blood Bank',
  'Indian Red Cross Society',
  'Thalassemia India',
  'Sankalp India Foundation',
  'HDFC Bank Blood Donation',
]

export function PartnersSection() {
  const { t } = useLanguage()

  return (
    <section className="py-12 bg-raksha-warm overflow-hidden">
      <div className="relative">
        <div className="animate-ticker flex whitespace-nowrap">
          {[...partners, ...partners, ...partners].map((partner, index) => (
            <div key={index} className="flex items-center">
              <span className="text-raksha-navy font-medium px-8 text-sm lg:text-base">
                {t(partner)}
              </span>
              <span className="text-raksha-crimson">|</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
