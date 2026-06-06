"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { AI_CSS } from "./styles"
import { Sidebar } from "./sidebar"
import { ShieldLogo } from "./shield-logo"

type Role = "user" | "assistant"

interface Message {
  id: string
  role: Role
  content: string
  timestamp: string
  isError?: boolean
}

const MAX_CHARS = 500

const GREETING = `Namaste! I'm the Raksha Assistant — your guide to blood donation, Thalassemia care, and the Raksha AI platform.

Whether you're a donor wondering about eligibility, a family seeking guidance, or someone learning about Thalassemia for the first time — I'm here to help.

What would you like to know today?`

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

function makeGreeting(): Message {
  return {
    id: "greeting",
    role: "assistant",
    content: GREETING,
    timestamp: new Date().toISOString(),
  }
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Initial greeting on mount
  useEffect(() => {
    setMessages([makeGreeting()])
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  // Grow textarea up to max height
  const resizeTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    }

    // conversation history (exclude greeting + errors) BEFORE adding new user msg
    const history = messages
      .filter((m) => m.id !== "greeting" && !m.isError)
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    if (textareaRef.current) textareaRef.current.style.height = "auto"

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationHistory: history }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Request failed")
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ])
    } catch (err) {
      console.log("[v0] AI Assistant request failed:", err)
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't get a response right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (q: string) => {
    setInput(q)
    setSidebarOpen(false)
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      resizeTextarea()
    })
  }

  const handleClear = () => {
    setMessages([makeGreeting()])
    setInput("")
  }

  const handleNewSession = () => {
    setMessages([makeGreeting()])
    setInput("")
    setSidebarOpen(false)
  }

  const hasUserMessages = messages.some((m) => m.role === "user")

  return (
    <div className="ai-root">
      <style dangerouslySetInnerHTML={{ __html: AI_CSS }} />

      {/* Mobile overlay */}
      {sidebarOpen && <div className="ai-overlay" onClick={() => setSidebarOpen(false)} />}

      <Sidebar onSuggestion={handleSuggestion} open={sidebarOpen} />

      <div className="ai-main">
        {/* Mobile top strip */}
        <div className="ai-mobile-bar">
          <button
            type="button"
            className="ai-iconbtn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldLogo size={24} />
            <span className="ai-brand-text" style={{ fontSize: "1.1rem" }}>
              <span style={{ color: "#FAF9F7" }}>Raksha</span>
              <span style={{ color: "#2CA8A0" }}>AI</span>
            </span>
          </div>
        </div>

        {/* Top bar */}
        <div className="ai-topbar">
          <div>
            <div className="ai-topbar-title">Raksha Assistant</div>
            <div className="ai-topbar-sub">Powered by Claude AI</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button type="button" className="ai-iconbtn" onClick={handleClear} aria-label="Clear chat" title="Clear chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6h12zM10 11v6M14 11v6" />
              </svg>
            </button>
            <button type="button" className="ai-iconbtn" onClick={handleNewSession} aria-label="New session" title="New session">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M20 9a8 8 0 00-14.5-3.5L4 7M4 15a8 8 0 0014.5 3.5L20 17" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-messages">
          {!hasUserMessages && messages.length <= 1 ? (
            <>
              <div className="ai-empty">
                <ShieldLogo size={60} />
                <div className="ai-empty-title">Ask Raksha Assistant anything</div>
                <div className="ai-empty-sub">
                  Get instant answers about blood donation, Thalassemia care, and how Raksha AI works.
                </div>
              </div>
              {/* Greeting bubble still shows below empty state */}
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}

          {loading && (
            <div className="ai-msg-row assistant">
              <div className="ai-avatar-line">
                <ShieldLogo size={16} />
                <span className="ai-avatar-name">Raksha Assistant</span>
              </div>
              <div className="ai-bubble assistant" style={{ padding: 0 }}>
                <div className="ai-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="ai-input-area">
          <div className="ai-input-wrap">
            <textarea
              ref={textareaRef}
              className="ai-textarea"
              placeholder="Ask about blood donation, Thalassemia, or how Raksha AI works..."
              value={input}
              maxLength={MAX_CHARS}
              rows={1}
              onChange={(e) => {
                setInput(e.target.value)
                resizeTextarea()
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              type="button"
              className="ai-send"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FAF9F7" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
          {input.length > 0 && (
            <div className="ai-counter">
              {input.length}/{MAX_CHARS}
            </div>
          )}
          <div className="ai-foot-note">
            Raksha Assistant can make mistakes. Verify important medical information with a doctor.
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  return (
    <div className={`ai-msg-row ${isUser ? "user" : "assistant"}`}>
      {!isUser && (
        <div className="ai-avatar-line">
          <ShieldLogo size={16} />
          <span className="ai-avatar-name">Raksha Assistant</span>
        </div>
      )}
      <div className={`ai-bubble ${isUser ? "user" : message.isError ? "error" : "assistant"}`}>
        {message.content}
      </div>
      <div className="ai-time">{formatTime(message.timestamp)}</div>
    </div>
  )
}
