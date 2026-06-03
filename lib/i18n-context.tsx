'use client'

import React, { createContext, useContext } from 'react'

type Messages = Record<string, any>

interface TranslationContextType {
  messages: Messages
  locale: string
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({
  children,
  messages,
  locale,
}: {
  children: React.ReactNode
  messages: Messages
  locale: string
}) {
  return (
    <TranslationContext.Provider value={{ messages, locale }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslations() {
  const context = useContext(TranslationContext)
  if (!context) {
    console.warn('[v0] useTranslations called outside TranslationProvider, returning empty object')
    return () => 'translation.missing'
  }

  return (key: string, defaultValue?: string) => {
    const keys = key.split('.')
    let value: any = context.messages
    for (const k of keys) {
      value = value?.[k]
    }
    return typeof value === 'string' ? value : defaultValue || key
  }
}

export function useLocale() {
  const context = useContext(TranslationContext)
  return context?.locale || 'en'
}
