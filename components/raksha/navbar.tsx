'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { RakshaLogo } from './logo'
import { LanguageSwitcher } from './language-switcher'

export function Navbar() {
  const t = useTranslations()
  const locale = useLocale()
  
  const navLinks = [
    { label: t('nav.howItWorks'), href: `/${locale}/how-it-works` },
    { label: t('nav.forDonors'), href: `/${locale}/for-donors` },
    { label: t('nav.forPatients'), href: `/${locale}/for-patients` },
    { label: t('nav.impact'), href: `/${locale}/impact` },
    { label: t('nav.library'), href: `/${locale}/library` },
    { label: t('nav.about'), href: `/${locale}/about` },
  ]

  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      setScrolled(currentScrollY > 50)
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      } ${
        scrolled ? 'bg-raksha-navy border-b border-raksha-wine' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href={`/${locale}`} className="shrink-0">
            <RakshaLogo height={36} variant="dark" />
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-raksha-white/80 hover:text-raksha-teal transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href={`/${locale}/register/donor`}
              className="px-5 py-2.5 bg-raksha-blood text-raksha-white text-sm font-medium hover:bg-raksha-crimson transition-colors"
            >
              {t('nav.registerDonor')}
            </a>
            <a
              href={`/${locale}/register/patient`}
              className="px-5 py-2.5 border border-raksha-white/50 text-raksha-white text-sm font-medium hover:border-raksha-white transition-colors"
            >
              {t('nav.requestBlood')}
            </a>
            <div className="ml-4">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-raksha-white"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-6 border-t border-raksha-wine/50 mt-2 pt-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-raksha-white/80 hover:text-raksha-teal transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-raksha-wine/30">
                <a
                  href={`/${locale}/register/donor`}
                  className="px-5 py-2.5 bg-raksha-blood text-raksha-white text-sm font-medium text-center"
                >
                  {t('nav.registerDonor')}
                </a>
                <a
                  href={`/${locale}/register/patient`}
                  className="px-5 py-2.5 border border-raksha-white/50 text-raksha-white text-sm font-medium text-center"
                >
                  {t('nav.requestBlood')}
                </a>
                <div className="pt-2">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
