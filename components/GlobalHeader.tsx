"use client";

// components/GlobalHeader.tsx
// This is the sticky header that appears on EVERY page.
// It's a separate client component so layout.tsx can stay a server component
// (required for metadata + fonts to work in Next.js App Router)

import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function GlobalHeader() {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        background: "rgba(10, 22, 40, 0.97)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #8B1A2A",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
      }}
    >
      {/* Logo */}
      <a
        href="/"
        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
      >
        <svg
          viewBox="0 0 48 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="33"
        >
          <path
            d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z"
            fill="#8B1A2A"
          />
          <path
            d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z"
            fill="white"
            opacity="0.95"
          />
          <path
            d="M16 39Q20 36 24 39Q28 42 32 39"
            stroke="#2CA8A0"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M18 44Q21 41.5 24 44Q27 46.5 30 44"
            stroke="#E8897A"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "1.15rem",
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#FAF9F7" }}>Raksha</span>
          <span style={{ color: "#2CA8A0" }}> AI</span>
        </span>
      </a>

      {/* Language Switcher — syncs across all pages via localStorage */}
      <LanguageSwitcher variant="dropdown" position="right" />
    </div>
  );
}