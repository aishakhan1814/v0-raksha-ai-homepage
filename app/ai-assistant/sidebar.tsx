"use client"

import { ShieldLogo } from "./shield-logo"

const SUGGESTIONS = [
  "How do I register as a blood donor?",
  "What is Thalassemia and how does it affect blood needs?",
  "How does Raksha AI match donors to patients?",
  "What blood types are compatible for transfusion?",
  "How often can I donate blood safely?",
  "What happens if my donor cancels last minute?",
]

const CAPABILITIES = [
  { color: "#C0152A", text: "Blood donation eligibility and process" },
  { color: "#2CA8A0", text: "Thalassemia education and care guidance" },
  { color: "#D4A847", text: "Transfusion scheduling and coordination" },
  { color: "#E8897A", text: "Blood compatibility and matching explained" },
]

function DropIcon({ color }: { color: string }) {
  return (
    <svg className="ai-cap-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d="M12 3C12 3 6 10 6 15C6 18.31 8.69 21 12 21C15.31 21 18 18.31 18 15C18 10 12 3 12 3Z"
        fill={color}
        opacity="0.85"
      />
    </svg>
  )
}

export function Sidebar({
  onSuggestion,
  open,
}: {
  onSuggestion: (q: string) => void
  open: boolean
}) {
  return (
    <aside className={`ai-sidebar ${open ? "open" : ""}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Brand */}
        <div>
          <a href="/" className="ai-brand">
            <ShieldLogo size={34} />
            <span className="ai-brand-text">
              <span className="r">Raksha</span>
              <span className="a">AI</span>
            </span>
          </a>
          <div className="ai-section-label" style={{ marginTop: 12 }}>
            AI Assistant
          </div>
        </div>

        {/* Identity card */}
        <div className="ai-identity">
          <div className="ai-pulse">
            <ShieldLogo size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="ai-identity-name">Raksha Assistant</div>
            <div className="ai-identity-sub">Blood Intelligence &amp; Care Coordination</div>
            <div className="ai-status">
              <span className="ai-status-dot" />
              <span className="ai-status-text">Online</span>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <div className="ai-section-label" style={{ marginBottom: 12 }}>
            Ask Me About
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SUGGESTIONS.map((q) => (
              <button key={q} type="button" className="ai-chip" onClick={() => onSuggestion(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <div className="ai-section-label" style={{ marginBottom: 12 }}>
            What I Can Help With
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {CAPABILITIES.map((c) => (
              <div className="ai-cap-row" key={c.text}>
                <DropIcon color={c.color} />
                <span className="ai-cap-text">{c.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="ai-disclaimer">
          Raksha Assistant provides general information only. For medical decisions, always consult
          your treating physician.
        </div>
      </div>
    </aside>
  )
}
