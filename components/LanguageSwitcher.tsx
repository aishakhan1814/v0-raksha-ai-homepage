'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()

  const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value
    startTransition(() => {
      // This assumes you are using a path-based routing strategy: /en/page or /te/page
      router.replace(`/${nextLocale}${pathname.split('/').slice(2).join('/')}`)
    })
  }

  return (
    <select
      className="bg-transparent text-raksha-white/80 text-sm focus:outline-none cursor-pointer hover:text-raksha-teal"
      defaultValue={pathname.split('/')[1]}
      onChange={onSelectChange}
      disabled={isPending}
    >
      <option value="en">English</option>
      <option value="te">తెలుగు (Telugu)</option>
      <option value="hi">हिन्दी (Hindi)</option>
      {/* Add your other 6 languages here */}
    </select>
  )
}