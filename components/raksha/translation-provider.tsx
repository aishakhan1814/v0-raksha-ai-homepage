'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

export type Language = 'en' | 'hi' | 'te' | 'ta' | 'bn' | 'es' | 'kn'

interface TranslationContextType {
  language: Language
  setLanguage: (lang: Language) => void
  translating: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

const API_URL = "/api"

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [translating, setTranslating] = useState(false)
  
  const originalTexts = useRef<WeakMap<Text, string>>(new WeakMap())
  const originalPlaceholders = useRef<WeakMap<HTMLElement, string>>(new WeakMap())
  const originalValues = useRef<WeakMap<HTMLElement, string>>(new WeakMap())
  const translationCache = useRef<Map<string, string>>(new Map())
  const queue = useRef<Set<string>>(new Set())
  const queueNodes = useRef<Set<{ text: string; node: Text | HTMLElement; type: 'text' | 'placeholder' | 'value' }>>(new Set())
  const timeoutId = useRef<any>(null)
  
  const observerRef = useRef<MutationObserver | null>(null)
  const isTranslatingActive = useRef<boolean>(false)

  // Load language preference on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('raksha_language') as Language
    if (savedLang && savedLang !== 'en') {
      setLanguageState(savedLang)
    }
  }, [])

  // Helper to load translation cache for a language
  const loadLanguageCache = (lang: Language): Record<string, string> => {
    try {
      const cached = localStorage.getItem(`raksha_translate_${lang}`)
      return cached ? JSON.parse(cached) : {}
    } catch {
      return {}
    }
  }

  // Helper to save a translated phrase
  const saveToCache = (lang: Language, original: string, translated: string) => {
    try {
      const cached = loadLanguageCache(lang)
      cached[original] = translated
      localStorage.setItem(`raksha_translate_${lang}`, JSON.stringify(cached))
    } catch (e) {
      console.error(e)
    }
  }

  // Load cache for current language
  useEffect(() => {
    translationCache.current.clear()
    if (language !== 'en') {
      const cacheObj = loadLanguageCache(language)
      Object.entries(cacheObj).forEach(([k, v]) => {
        translationCache.current.set(k, v)
      })
    }
  }, [language])

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
        
        // Standard cross-browser regex to avoid Unicode syntax crashes (like older Safari)
        if (!val || val.length < 2 || /^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()?"'’+\[\]\\|<>]+$/.test(val)) return

        // Skip ignored tags
        const parent = textNode.parentElement
        if (parent) {
          const tag = parent.tagName.toLowerCase()
          if (['script', 'style', 'code', 'pre', 'noscript', 'iframe', 'canvas', 'svg'].includes(tag)) return
          if (parent.closest('[translate="no"]')) return
        }

        // Store original text
        if (!originalTexts.current.has(textNode)) {
          originalTexts.current.set(textNode, textNode.nodeValue || "")
        }

        const original = originalTexts.current.get(textNode) || ""
        if (language === 'en') {
          if (textNode.nodeValue !== original) {
            textNode.nodeValue = original
          }
        } else {
          if (translationCache.current.has(original)) {
            const translated = translationCache.current.get(original)!
            if (textNode.nodeValue !== translated) {
              textNode.nodeValue = translated
            }
          } else {
            queueNode(original, textNode, 'text')
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
              if (translationCache.current.has(original)) {
                const translated = translationCache.current.get(original)!
                if (el.getAttribute('placeholder') !== translated) {
                  el.setAttribute('placeholder', translated)
                }
              } else {
                queueNode(original, el, 'placeholder')
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
                if (translationCache.current.has(original)) {
                  const translated = translationCache.current.get(original)!
                  if (el.getAttribute('value') !== translated) {
                    el.setAttribute('value', translated)
                  }
                } else {
                  queueNode(original, el, 'value')
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

  // Queue a node for batch translation
  const queueNode = (text: string, node: Text | HTMLElement, type: 'text' | 'placeholder' | 'value') => {
    queue.current.add(text)
    queueNodes.current.add({ text, node, type })

    if (timeoutId.current) return

    setTranslating(true)
    timeoutId.current = setTimeout(async () => {
      timeoutId.current = null
      const textsToTranslate = Array.from(queue.current)
      const nodesToTranslate = Array.from(queueNodes.current)
      
      queue.current.clear()
      queueNodes.current.clear()

      if (textsToTranslate.length === 0) {
        setTranslating(false)
        return
      }

      try {
        const response = await fetch(`${API_URL}/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strings: textsToTranslate,
            target_language: language,
            source_language: 'en'
          })
        })

        if (response.ok) {
          const data = await response.json()
          const translations: string[] = data.translations

          pauseObserver()

          // Save to cache
          textsToTranslate.forEach((original, idx) => {
            const translated = translations[idx] || original
            translationCache.current.set(original, translated)
            saveToCache(language, original, translated)
          })

          // Apply translations to the queued nodes
          nodesToTranslate.forEach(({ text, node, type }) => {
            const translated = translationCache.current.get(text) || text
            if (type === 'text') {
              const textNode = node as Text
              if (textNode.nodeValue !== translated) {
                textNode.nodeValue = translated
              }
            } else if (type === 'placeholder') {
              const el = node as HTMLElement
              if (el.getAttribute('placeholder') !== translated) {
                el.setAttribute('placeholder', translated)
              }
            } else if (type === 'value') {
              const el = node as HTMLElement
              if (el.getAttribute('value') !== translated) {
                el.setAttribute('value', translated)
              }
            }
          })

          resumeObserver()
        }
      } catch (err) {
        console.error("Translation API call failed:", err)
      } finally {
        setTranslating(false)
      }
    }, 150)
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
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          const node = mutation.target as Text
          const parent = node.parentElement
          if (parent && parent.closest('[translate="no"]')) continue

          const currentVal = node.nodeValue || ""
          const originalVal = originalTexts.current.get(node)
          const translatedVal = translationCache.current.get(originalVal || "")

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
    <TranslationContext.Provider value={{ language, setLanguage, translating }}>
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
