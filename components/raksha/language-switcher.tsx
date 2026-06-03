'use client'

import { useLocale } from '@/lib/i18n-context'
import { usePathname, useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const locales = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
]

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLanguageChange = (newLocale: string) => {
    // Replace the locale in the pathname
    const segments = pathname.split('/')
    segments[1] = newLocale // Replace the locale segment
    const newPathname = segments.join('/')
    router.push(newPathname)
  }

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px] border-raksha-white/50 text-raksha-white hover:border-raksha-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-raksha-navy border-raksha-wine">
        {locales.map((loc) => (
          <SelectItem
            key={loc.code}
            value={loc.code}
            className="text-raksha-white cursor-pointer hover:bg-raksha-wine/20"
          >
            {loc.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
