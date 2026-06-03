import { ReactNode } from 'react'
import { TranslationProvider } from '@/lib/i18n-context'

// Import all message files
import enMessages from '@/messages/en.json'
import teMessages from '@/messages/te.json'
import hiMessages from '@/messages/hi.json'
import taMessages from '@/messages/ta.json'

const messages: Record<string, any> = {
  en: enMessages,
  te: teMessages,
  hi: hiMessages,
  ta: taMessages,
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const localeMessages = messages[locale] || enMessages

  return (
    <TranslationProvider messages={localeMessages} locale={locale}>
      {children}
    </TranslationProvider>
  )
}
