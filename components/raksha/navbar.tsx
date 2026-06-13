'use client'

import { useEffect, useState } from 'react'
import { RakshaLogo } from './logo'
import { useTranslation, Language } from './translation-provider'

const navLinks = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'For Donors', href: '/for-donors' },
  { label: 'For Patients', href: '/for-patients' },
  { label: 'Impact', href: '/impact' },
  { label: 'Library', href: '/library' },
  { label: "About", href: "/about" },
  { label: "Console", href: "/console" },
]

export function Navbar({ hideLinks = false }: { hideLinks?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("raksha_user");
      if (u) setUser(JSON.parse(u));
    }
  }, [])

  const { language, setLanguage, translating } = useTranslation()

  const visibleLinks = navLinks.filter(link => {
    if (link.label === "Console") {
      return user && (user.role === "coordinator" || user.role === "admin");
    }
    return true;
  })

  const languages: { code: Language; label: string; name: string }[] = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'hi', label: 'HI', name: 'हिन्दी' },
    { code: 'te', label: 'TE', name: 'తెలుగు' },
    { code: 'ta', label: 'TA', name: 'தமிழ்' },
    { code: 'bn', label: 'BN', name: 'বাংলা' },
    { code: 'es', label: 'ES', name: 'Español' },
    { code: 'kn', label: 'KN', name: 'ಕನ್ನಡ' },
  ]
  const currentLang = languages.find(l => l.code === language) || languages[0]

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
          <a href="/" className="shrink-0">
            <RakshaLogo height={36} variant="dark" />
          </a>

          {/* Desktop Nav Links */}
          {!hideLinks && (
            <div className="hidden lg:flex items-center gap-8">
              {visibleLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-raksha-white/80 hover:text-raksha-teal transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative" style={{ position: 'relative' }}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-raksha-white/5 border border-raksha-white/10 hover:bg-raksha-white/10 hover:border-raksha-white/20 text-raksha-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                <span>🌐 {currentLang.label}</span>
                {translating && (
                  <span className="w-1.5 h-1.5 rounded-full bg-raksha-teal animate-pulse" style={{ backgroundColor: '#2CA8A0' }} />
                )}
                <svg className={`w-3 h-3 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setLangDropdownOpen(false)} 
                  />
                  <div 
                    className="absolute right-0 mt-2 w-40 rounded bg-raksha-navy border border-raksha-wine/50 shadow-xl overflow-hidden z-50"
                    style={{ position: 'absolute', right: 0, marginTop: '8px', width: '160px', borderRadius: '4px', backgroundColor: '#0D1B2E', border: '1px solid rgba(192, 21, 42, 0.5)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 50 }}
                  >
                    <div className="py-1">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code)
                            setLangDropdownOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            language === lang.code 
                              ? 'bg-raksha-wine/30 text-raksha-teal font-semibold' 
                              : 'text-raksha-white/80 hover:bg-raksha-white/5 hover:text-raksha-white'
                          }`}
                          style={{ width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', background: language === lang.code ? 'rgba(192, 21, 42, 0.2)' : 'transparent', color: language === lang.code ? '#2CA8A0' : 'rgba(250, 249, 247, 0.8)', fontSize: '13px', transition: 'background-color 0.2s, color 0.2s' }}
                        >
                          <span>{lang.name}</span>
                          {language === lang.code && (
                            <span className="text-raksha-teal" style={{ color: '#2CA8A0' }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* CTAs */}
            <div className={`${hideLinks ? 'flex' : 'hidden lg:flex'} items-center gap-3`}>
              {hideLinks ? (
                <a
                  href="/"
                  className="px-5 py-2.5 border border-raksha-white/50 text-raksha-white text-sm font-medium hover:border-raksha-white transition-colors"
                >
                  Go Back to Homepage
                </a>
              ) : user ? (
                <>
                  <span className="text-xs text-raksha-white/70 font-mono">
                    LOGGED IN: <strong className="text-raksha-teal">{user.role?.toUpperCase()}</strong>
                  </span>
                  <button
                    onClick={() => {
                      localStorage.removeItem("raksha_user");
                      window.location.href = "/signin";
                    }}
                    className="px-4 py-2 border border-raksha-crimson text-raksha-crimson text-xs font-semibold uppercase tracking-wider hover:bg-raksha-crimson hover:text-raksha-white transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/register/donor"
                    className="px-5 py-2.5 bg-raksha-blood text-raksha-white text-sm font-medium hover:bg-raksha-crimson transition-colors"
                  >
                    Register as Donor
                  </a>
                  <a
                    href="/register/patient"
                    className="px-5 py-2.5 border border-raksha-white/50 text-raksha-white text-sm font-medium hover:border-raksha-white transition-colors"
                  >
                    Request Blood
                  </a>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            {!hideLinks && (
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
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {!hideLinks && mobileMenuOpen && (
          <div className="lg:hidden pb-6 border-t border-raksha-wine/50 mt-2 pt-4">
            <div className="flex flex-col gap-4">
              {visibleLinks.map((link) => (
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
                {user ? (
                  <>
                    <div className="text-xs text-center text-raksha-white/70 font-mono">
                      LOGGED IN: <strong className="text-raksha-teal">{user.role?.toUpperCase()}</strong>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem("raksha_user");
                        window.location.href = "/signin";
                      }}
                      className="px-5 py-2.5 border border-raksha-crimson text-raksha-crimson text-sm font-semibold uppercase tracking-wider text-center cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="/register/donor"
                      className="px-5 py-2.5 bg-raksha-blood text-raksha-white text-sm font-medium text-center"
                    >
                      Register as Donor
                    </a>
                    <a
                      href="/register/patient"
                      className="px-5 py-2.5 border border-raksha-white/50 text-raksha-white text-sm font-medium text-center"
                    >
                      Request Blood
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
