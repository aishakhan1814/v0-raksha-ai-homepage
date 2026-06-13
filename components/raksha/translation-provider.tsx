'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { dictionary } from './dictionary'

export type Language = 'en' | 'hi' | 'te' | 'mr' | 'ta' | 'bn' | 'gu' | 'pa' | 'kn'

interface TranslationContextType {
  language: Language
  setLanguage: (lang: Language) => void
  translating: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  
  const originalTexts = useRef<WeakMap<Text, string>>(new WeakMap())
  const originalPlaceholders = useRef<WeakMap<HTMLElement, string>>(new WeakMap())
  const originalValues = useRef<WeakMap<HTMLElement, string>>(new WeakMap())
  
  const observerRef = useRef<MutationObserver | null>(null)

  // Load language preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('raksha_language') as Language
      if (savedLang && savedLang !== 'en') {
        setLanguageState(savedLang)
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    if (lang === language) return
    setLanguageState(lang)
    localStorage.setItem('raksha_language', lang)
  }

  // Safely pause the observer during mutations
  const pauseObserver = () => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
  }

  // Resume the observer
  const resumeObserver = () => {
    if (observerRef.current && language !== 'en') {
      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }
  }

  // Walk the DOM tree and translate nodes
  const translateDOM = () => {
    if (typeof document === 'undefined') return

    pauseObserver()

    const walk = (node: Node) => {
      // Handle text nodes
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text
        const val = textNode.nodeValue?.trim()
        
        // Standard cross-browser regex to avoid Unicode syntax crashes
        if (!val || val.length < 2 || /^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()?"'’+\[\]\\|<>]+$/.test(val)) return

        // Skip ignored tags
        const parent = textNode.parentElement
        if (parent) {
          const tag = parent.tagName.toLowerCase()
          if (['script', 'style', 'code', 'pre', 'noscript', 'iframe', 'canvas', 'svg'].includes(tag)) return
          if (parent.closest('[translate="no"]')) return
        }

        // Store original text if not already stored
        if (!originalTexts.current.has(textNode)) {
          originalTexts.current.set(textNode, textNode.nodeValue || "")
        }

        const original = originalTexts.current.get(textNode) || ""
        if (language === 'en') {
          if (textNode.nodeValue !== original) {
            textNode.nodeValue = original
          }
        } else {
          const dictForLang = dictionary[language as Exclude<Language, 'en'>]
          const translated = dictForLang?.[original] || original
          if (textNode.nodeValue !== translated) {
            textNode.nodeValue = translated
          }
        }
      } 
      // Handle elements (like placeholders and button values)
      else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        const tag = el.tagName.toLowerCase()
        if (['script', 'style', 'code', 'pre', 'noscript', 'iframe', 'canvas', 'svg'].includes(tag)) return
        if (el.closest('[translate="no"]')) return

        // Placeholders in input/textarea
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          const placeholder = el.getAttribute('placeholder')
          if (placeholder && placeholder.trim().length > 1) {
            if (!originalPlaceholders.current.has(el)) {
              originalPlaceholders.current.set(el, placeholder)
            }
            const original = originalPlaceholders.current.get(el)!
            if (language === 'en') {
              if (el.getAttribute('placeholder') !== original) {
                el.setAttribute('placeholder', original)
              }
            } else {
              const dictForLang = dictionary[language as Exclude<Language, 'en'>]
              const translated = dictForLang?.[original] || original
              if (el.getAttribute('placeholder') !== translated) {
                el.setAttribute('placeholder', translated)
              }
            }
          }
        }

        // Button values
        if (el instanceof HTMLInputElement) {
          const type = el.getAttribute('type')
          if (type === 'button' || type === 'submit' || type === 'reset') {
            const val = el.getAttribute('value')
            if (val && val.trim().length > 1) {
              if (!originalValues.current.has(el)) {
                originalValues.current.set(el, val)
              }
              const original = originalValues.current.get(el)!
              if (language === 'en') {
                if (el.getAttribute('value') !== original) {
                  el.setAttribute('value', original)
                }
              } else {
                const dictForLang = dictionary[language as Exclude<Language, 'en'>]
                const translated = dictForLang?.[original] || original
                if (el.getAttribute('value') !== translated) {
                  el.setAttribute('value', translated)
                }
              }
            }
          }
        }

        // Traverse children
        node.childNodes.forEach(walk)
      }
    }

    walk(document.body)
    resumeObserver()
  }

  // Restore everything to English
  const restoreEnglish = () => {
    if (typeof document === 'undefined') return

    pauseObserver()

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text
        if (originalTexts.current.has(textNode)) {
          const original = originalTexts.current.get(textNode)!
          if (textNode.nodeValue !== original) {
            textNode.nodeValue = original
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          if (originalPlaceholders.current.has(el)) {
            const original = originalPlaceholders.current.get(el)!
            if (el.getAttribute('placeholder') !== original) {
              el.setAttribute('placeholder', original)
            }
          }
        }
        if (el instanceof HTMLInputElement) {
          if (originalValues.current.has(el)) {
            const original = originalValues.current.get(el)!
            if (el.getAttribute('value') !== original) {
              el.setAttribute('value', original)
            }
          }
        }
        node.childNodes.forEach(walk)
      }
    }
    walk(document.body)
    resumeObserver()
  }

  // Trigger translation when language changes or page updates
  useEffect(() => {
    if (language === 'en') {
      restoreEnglish()
      return
    }

    // Translate DOM initially
    translateDOM()

    // Setup MutationObserver to translate any dynamically added elements
    const observer = new MutationObserver((mutations) => {
      let shouldTranslate = false
      const dictForLang = dictionary[language as Exclude<Language, 'en'>]

      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          const node = mutation.target as Text
          const parent = node.parentElement
          if (parent && parent.closest('[translate="no"]')) continue

          const currentVal = node.nodeValue || ""
          const originalVal = originalTexts.current.get(node)
          const translatedVal = dictForLang?.[originalVal || ""] || originalVal

          if (currentVal !== translatedVal) {
            originalTexts.current.set(node, currentVal)
            shouldTranslate = true
          }
        } else if (mutation.type === 'childList') {
          shouldTranslate = true
        }
      }

      if (shouldTranslate) {
        translateDOM()
      }
    })

    observerRef.current = observer

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [language])

  return (
    <TranslationContext.Provider value={{ language, setLanguage, translating: false }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
