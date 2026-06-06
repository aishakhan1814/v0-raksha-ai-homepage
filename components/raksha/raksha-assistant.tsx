"use client"

import { useState, useRef, useEffect, type FormEvent } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

// ─── LANGUAGES ─────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "mr", label: "Marathi", native: "मराठी" },
] as const

type LangCode = (typeof LANGUAGES)[number]["code"]

// ─── UI COPY PER LANGUAGE ───────────────────────────────────────────────────────
const UI_COPY: Record<LangCode, { title: string; subtitle: string; placeholder: string; greeting: string; send: string; thinking: string; error: string }> = {
  en: {
    title: "Raksha AI Assistant",
    subtitle: "Ask about donation, Thalassemia, or care",
    placeholder: "Type your question...",
    greeting: "Hello! I'm Raksha AI. Ask me anything about blood donation, Thalassemia care, or how our platform works.",
    send: "Send",
    thinking: "Thinking...",
    error: "Something went wrong. Please try again.",
  },
  hi: {
    title: "रक्षा AI सहायक",
    subtitle: "रक्तदान, थैलेसीमिया या देखभाल के बारे में पूछें",
    placeholder: "अपना प्रश्न लिखें...",
    greeting: "नमस्ते! मैं रक्षा AI हूँ। रक्तदान, थैलेसीमिया देखभाल या हमारे प्लेटफ़ॉर्म के बारे में कुछ भी पूछें।",
    send: "भेजें",
    thinking: "सोच रहा हूँ...",
    error: "कुछ गड़बड़ हो गई। कृपया पुनः प्रयास करें।",
  },
  ta: {
    title: "ரக்ஷா AI உதவியாளர்",
    subtitle: "இரத்த தானம், தலசீமியா பற்றி கேளுங்கள்",
    placeholder: "உங்கள் கேள்வியை எழுதுங்கள்...",
    greeting: "வணக்கம்! நான் ரக்ஷா AI. இரத்த தானம் அல்லது தலசீமியா பராமரிப்பு பற்றி எதையும் கேளுங்கள்.",
    send: "அனுப்பு",
    thinking: "யோசிக்கிறேன்...",
    error: "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.",
  },
  te: {
    title: "రక్ష AI సహాయకుడు",
    subtitle: "రక్తదానం, థాలసేమియా గురించి అడగండి",
    placeholder: "మీ ప్రశ్నను టైప్ చేయండి...",
    greeting: "నమస్తే! నేను రక్ష AI. రక్తదానం లేదా థాలసేమియా సంరక్షణ గురించి ఏదైనా అడగండి.",
    send: "పంపండి",
    thinking: "ఆలోచిస్తున్నాను...",
    error: "ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
  },
  bn: {
    title: "রক্ষা AI সহায়ক",
    subtitle: "রক্তদান, থ্যালাসেমিয়া সম্পর্কে জিজ্ঞাসা করুন",
    placeholder: "আপনার প্রশ্ন লিখুন...",
    greeting: "নমস্কার! আমি রক্ষা AI। রক্তদান বা থ্যালাসেমিয়া যত্ন সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন।",
    send: "পাঠান",
    thinking: "ভাবছি...",
    error: "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।",
  },
  mr: {
    title: "रक्षा AI सहाय्यक",
    subtitle: "रक्तदान, थॅलेसेमिया बद्दल विचारा",
    placeholder: "तुमचा प्रश्न लिहा...",
    greeting: "नमस्कार! मी रक्षा AI आहे. रक्तदान किंवा थॅलेसेमिया काळजीबद्दल काहीही विचारा.",
    send: "पाठवा",
    thinking: "विचार करत आहे...",
    error: "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.",
  },
}

// ─── HELPERS ────────────────────────────────────────────────────────────────────
function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts) return ""
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("")
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────────
export function RakshaAssistant() {
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState<LangCode>("en")
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const copy = UI_COPY[language]
  const isLoading = status === "submitted" || status === "streaming"

  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    // Send the message, passing the chosen language so the server replies in it
    sendMessage({ text: trimmed }, { body: { language } })
    setInput("")
  }

  return (
    <>
      {/* Launcher Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Raksha AI assistant" : "Open Raksha AI assistant"}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-[200] flex h-14 w-14 items-center justify-center rounded-full bg-raksha-blood text-raksha-white shadow-lg shadow-raksha-blood/30 transition-all hover:bg-raksha-crimson hover:scale-105 focus:outline-none focus:ring-2 focus:ring-raksha-teal focus:ring-offset-2 focus:ring-offset-raksha-deep"
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 21l1.8-4A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Raksha AI assistant chat"
          className="fixed bottom-24 right-6 z-[200] flex h-[560px] max-h-[calc(100vh-7rem)] w-[calc(100vw-3rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-raksha-wine bg-card shadow-2xl"
        >
          {/* Header */}
          <header className="flex items-start justify-between gap-3 border-b border-raksha-wine/50 bg-raksha-navy px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-raksha-blood text-raksha-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2s6 7 6 11a6 6 0 11-12 0c0-4 6-11 6-11z" />
                </svg>
              </span>
              <div>
                <p className="font-display text-base font-semibold leading-tight text-raksha-white">{copy.title}</p>
                <p className="text-xs leading-tight text-raksha-muted">{copy.subtitle}</p>
              </div>
            </div>
            {/* Language selector */}
            <label className="sr-only" htmlFor="raksha-lang">
              Select language
            </label>
            <select
              id="raksha-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LangCode)}
              className="shrink-0 rounded-md border border-raksha-wine/60 bg-raksha-deep px-2 py-1 text-xs text-raksha-white outline-none focus:border-raksha-teal"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {/* Greeting (shown until first message) */}
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed text-raksha-white">
                  {copy.greeting}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const text = getMessageText(message)
              const isUser = message.role === "user"
              return (
                <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? "rounded-tr-sm bg-raksha-blood text-raksha-white"
                        : "rounded-tl-sm bg-muted text-raksha-white"
                    }`}
                  >
                    {text || (
                      <span className="inline-flex gap-1" aria-label={copy.thinking}>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-raksha-muted [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-raksha-muted [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-raksha-muted" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Loading indicator before assistant text starts streaming */}
            {status === "submitted" && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3" aria-label={copy.thinking}>
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-raksha-muted [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-raksha-muted [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-raksha-muted" />
                  </span>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="flex flex-col items-start gap-2">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-raksha-wine/30 px-4 py-2.5 text-sm text-raksha-coral">
                  {copy.error}
                </div>
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="text-xs font-medium text-raksha-teal underline-offset-2 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-raksha-wine/50 bg-raksha-navy px-3 py-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={copy.placeholder}
              aria-label={copy.placeholder}
              disabled={isLoading}
              className="flex-1 rounded-full border border-raksha-wine/60 bg-raksha-deep px-4 py-2.5 text-sm text-raksha-white placeholder:text-raksha-muted outline-none transition-colors focus:border-raksha-teal disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || input.trim().length === 0}
              aria-label={copy.send}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raksha-blood text-raksha-white transition-colors hover:bg-raksha-crimson focus:outline-none focus:ring-2 focus:ring-raksha-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
