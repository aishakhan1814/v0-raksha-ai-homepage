"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from "react"
import { translations } from "./translations"
import { dictionary } from "@/components/raksha/dictionary"

// Static JSON imports for messages
import en from "../messages/en.json"
import hi from "../messages/hi.json"
import te from "../messages/te.json"
import ta from "../messages/ta.json"
import mr from "../messages/mr.json"
import bn from "../messages/bn.json"

export type Language = "en" | "hi" | "te" | "mr" | "ta" | "bn" | "gu" | "pa" | "kn"

const messages: Record<string, any> = { en, hi, te, ta, mr, bn }

interface LanguageContextType {
  lang: Language
  setLang: (l: Language) => void
  switchLanguage: (l: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  switchLanguage: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en")
  const observerRef = useRef<MutationObserver | null>(null)
  
  // WeakMaps to remember original texts and input placeholders
  const originalTexts = useRef<WeakMap<Text, string>>(new WeakMap())
  const originalPlaceholders = useRef<WeakMap<HTMLElement, string>>(new WeakMap())
  const originalValues = useRef<WeakMap<HTMLElement, string>>(new WeakMap())

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem("raksha-lang") as Language
    if (saved && (messages[saved] || translations[saved])) {
      setLangState(saved)
    }
  }, [])

  // Save language to localStorage every time it changes
  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem("raksha-lang", newLang)
  }

  const switchLanguage = (newLang: Language) => {
    setLang(newLang)
  }

  // Precomputed combined dictionary for the current language
  const activeDict = useMemo(() => {
    if (lang === "en") return {}
    
    const combined: Record<string, string> = {}
    
    // 1. Flatten the target language JSON messages and map them using English values
    const targetMsgs = messages[lang] || {}
    const enMsgs = messages["en"] || {}

    function mapTranslations(targetObj: any, enObj: any) {
      if (!targetObj || !enObj) return
      Object.keys(enObj).forEach(key => {
        const enVal = enObj[key]
        const targetVal = targetObj[key]
        if (typeof enVal === 'string' && typeof targetVal === 'string') {
          if (enVal && targetVal && targetVal !== enVal) {
            combined[enVal.replace(/\s+/g, ' ').trim()] = targetVal
          }
        } else if (typeof enVal === 'object' && typeof targetVal === 'object') {
          mapTranslations(targetVal, enVal)
        }
      })
    }

    mapTranslations(targetMsgs, enMsgs)

    // 2. Load static dictionary from dictionary.ts for legacy/fallback support
    const dictForLang = dictionary[lang as Exclude<Language, 'en'>]
    if (dictForLang) {
      Object.entries(dictForLang).forEach(([key, val]) => {
        combined[key.replace(/\s+/g, ' ').trim()] = val
      })
    }

    // 3. Load flat translations from translations.ts
    const enTrans = translations["en"] || {}
    const langTrans = translations[lang] || {}
    Object.keys(enTrans).forEach(key => {
      const enVal = enTrans[key]
      const langVal = langTrans[key]
      if (enVal && langVal && langVal !== enVal) {
        combined[enVal.replace(/\s+/g, ' ').trim()] = langVal
      }
    })

    return combined
  }, [lang])

  // Key-based translation function with fallback to nested dot notation & dictionary lookup
  const t = (key: string): string => {
    // 1. Resolve dot notation if present
    if (key.includes('.')) {
      const langMessages = messages[lang] || messages["en"]
      const value = key.split('.').reduce((acc, part) => acc && acc[part], langMessages)
      if (value && typeof value === 'string') {
        return value
      }
      // Fallback to English nested key
      const enMessages = messages["en"]
      const enValue = key.split('.').reduce((acc, part) => acc && acc[part], enMessages)
      if (enValue && typeof enValue === 'string') {
        return enValue
      }
    }

    // 2. Resolve flat translation mapping
    const dict = translations[lang] || translations["en"]
    if (dict[key]) return dict[key]
    
    // Fallback: look up the english translation string in our combined activeDict
    const englishVal = translations["en"][key] || key
    if (lang === "en") return englishVal
    
    const normalizedOriginal = englishVal.replace(/\s+/g, ' ').trim()
    if (activeDict[normalizedOriginal]) {
      return activeDict[normalizedOriginal]
    }
    
    return englishVal
  }

  // High performance DOM walker and observer
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return

    const pauseObserver = () => {
      if (observerRef.current) observerRef.current.disconnect()
    }

    const resumeObserver = () => {
      if (observerRef.current && lang !== "en") {
        observerRef.current.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        })
      }
    }

    const translateNode = (node: Node) => {
      // 1. Text node translation
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text
        const val = textNode.nodeValue?.trim()
        if (!val || val.length < 2 || /^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()?"'’+\[\]\\|<>🆘🤖←🔍⚠️]+$/.test(val)) return

        const parent = textNode.parentElement
        if (parent) {
          const tag = parent.tagName.toLowerCase()
          if (['script', 'style', 'code', 'pre', 'noscript', 'iframe', 'canvas', 'svg'].includes(tag)) return
          if (parent.closest('[translate="no"]')) return
        }

        if (!originalTexts.current.has(textNode)) {
          originalTexts.current.set(textNode, textNode.nodeValue || "")
        }

        const original = originalTexts.current.get(textNode) || ""
        const normalizedOriginal = original.replace(/\s+/g, ' ').trim()

        if (lang === "en") {
          if (textNode.nodeValue !== original) textNode.nodeValue = original
        } else {
          const translatedVal = activeDict[normalizedOriginal]
          if (translatedVal) {
            const leadingSpace = original.match(/^\s*/)?.[0] || ""
            const trailingSpace = original.match(/\s*$/)?.[0] || ""
            const finalTranslated = leadingSpace + translatedVal + trailingSpace
            if (textNode.nodeValue !== finalTranslated) {
              textNode.nodeValue = finalTranslated
            }
          } else {
            if (textNode.nodeValue !== original) textNode.nodeValue = original
          }
        }
      } 
      // 2. Element node translation (placeholders and button values)
      else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        const tag = el.tagName.toLowerCase()
        if (['script', 'style', 'code', 'pre', 'noscript', 'iframe', 'canvas', 'svg'].includes(tag)) return
        if (el.closest('[translate="no"]')) return

        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          const placeholder = el.getAttribute("placeholder")
          if (placeholder && placeholder.trim().length > 1) {
            if (!originalPlaceholders.current.has(el)) {
              originalPlaceholders.current.set(el, placeholder)
            }
            const original = originalPlaceholders.current.get(el)!
            const normalizedOriginal = original.replace(/\s+/g, ' ').trim()
            if (lang === "en") {
              if (el.getAttribute("placeholder") !== original) el.setAttribute("placeholder", original)
            } else {
              const translatedVal = activeDict[normalizedOriginal]
              if (translatedVal) {
                const leadingSpace = original.match(/^\s*/)?.[0] || ""
                const trailingSpace = original.match(/\s*$/)?.[0] || ""
                const finalTranslated = leadingSpace + translatedVal + trailingSpace
                if (el.getAttribute("placeholder") !== finalTranslated) el.setAttribute("placeholder", finalTranslated)
              } else {
                if (el.getAttribute("placeholder") !== original) el.setAttribute("placeholder", original)
              }
            }
          }
        }

        if (el instanceof HTMLInputElement) {
          const type = el.getAttribute("type")
          if (type === "button" || type === "submit" || type === "reset") {
            const val = el.getAttribute("value")
            if (val && val.trim().length > 1) {
              if (!originalValues.current.has(el)) {
                originalValues.current.set(el, val)
              }
              const original = originalValues.current.get(el)!
              const normalizedOriginal = original.replace(/\s+/g, ' ').trim()
              if (lang === "en") {
                if (el.getAttribute("value") !== original) el.setAttribute("value", original)
              } else {
                const translatedVal = activeDict[normalizedOriginal]
                if (translatedVal) {
                  const leadingSpace = original.match(/^\s*/)?.[0] || ""
                  const trailingSpace = original.match(/\s*$/)?.[0] || ""
                  const finalTranslated = leadingSpace + translatedVal + trailingSpace
                  if (el.getAttribute("value") !== finalTranslated) el.setAttribute("value", finalTranslated)
                } else {
                  if (el.getAttribute("value") !== original) el.setAttribute("value", original)
                }
              }
            }
          }
        }

        node.childNodes.forEach(translateNode)
      }
    }

    const translateFullDOM = () => {
      pauseObserver()
      translateNode(document.body)
      resumeObserver()
    }

    // Initial full DOM translation when language changes
    translateFullDOM()

    if (lang === "en") return

    // Mutation observer for dynamic elements
    const observer = new MutationObserver((mutations) => {
      pauseObserver()
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const node = mutation.target as Text
          const parent = node.parentElement
          if (parent && parent.closest('[translate="no"]')) continue

          const currentVal = node.nodeValue || ""
          const originalVal = originalTexts.current.get(node) || currentVal
          const normalizedOriginal = originalVal.replace(/\s+/g, ' ').trim()
          const translatedVal = activeDict[normalizedOriginal]

          let finalTranslated = originalVal
          if (translatedVal) {
            const leadingSpace = originalVal.match(/^\s*/)?.[0] || ""
            const trailingSpace = originalVal.match(/\s*$/)?.[0] || ""
            finalTranslated = leadingSpace + translatedVal + trailingSpace
          }

          if (currentVal !== finalTranslated) {
            originalTexts.current.set(node, currentVal)
            translateNode(node)
          }
        } else if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            translateNode(node)
          })
        }
      }
      resumeObserver()
    })

    observerRef.current = observer
    resumeObserver()

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [lang, activeDict])

  return (
    <LanguageContext.Provider value={{ lang, setLang, switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
