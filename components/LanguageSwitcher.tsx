"use client";
// components/LanguageSwitcher.tsx
// Supports 9 languages. Persists selection to localStorage.
// Syncs across all tabs via storage event listener.

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Language {
  code: string;
  label: string;      // native script name
  english: string;    // English name for screen readers
  flag: string;       // emoji flag
}

interface LanguageSwitcherProps {
  variant?:  "dropdown" | "pills";
  position?: "left" | "right" | "center";
}

// ─── Language definitions ─────────────────────────────────────────────────────
const LANGUAGES: Language[] = [
  { code: "en", label: "English",    english: "English",    flag: "🇮🇳" },
  { code: "hi", label: "हिंदी",       english: "Hindi",      flag: "🇮🇳" },
  { code: "mr", label: "मराठी",       english: "Marathi",    flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்",       english: "Tamil",      flag: "🇮🇳" },
  { code: "te", label: "తెలుగు",      english: "Telugu",     flag: "🇮🇳" },
  { code: "bn", label: "বাংলা",       english: "Bengali",    flag: "🇮🇳" },
  { code: "gu", label: "ગુજરાતી",     english: "Gujarati",   flag: "🇮🇳" },
  { code: "pa", label: "ਪੰਜਾਬੀ",      english: "Punjabi",    flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ",       english: "Kannada",    flag: "🇮🇳" },
];

const STORAGE_KEY = "raksha-language";
const DEFAULT_CODE = "en";

// ─── Translations map ─────────────────────────────────────────────────────────
// Expose this so other components can consume the active language
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    "nav.how_it_works":   "How It Works",
    "nav.for_donors":     "For Donors",
    "nav.for_patients":   "For Patients",
    "nav.impact":         "Impact",
    "nav.library":        "Library",
    "nav.about":          "About",
    "cta.register_donor": "Register as Donor",
    "cta.request_blood":  "Request Blood",
    "lang.select":        "Language",
  },
  hi: {
    "nav.how_it_works":   "यह कैसे काम करता है",
    "nav.for_donors":     "दाताओं के लिए",
    "nav.for_patients":   "मरीज़ों के लिए",
    "nav.impact":         "प्रभाव",
    "nav.library":        "पुस्तकालय",
    "nav.about":          "हमारे बारे में",
    "cta.register_donor": "दाता के रूप में पंजीकरण करें",
    "cta.request_blood":  "रक्त का अनुरोध करें",
    "lang.select":        "भाषा",
  },
  mr: {
    "nav.how_it_works":   "हे कसे कार्य करते",
    "nav.for_donors":     "दात्यांसाठी",
    "nav.for_patients":   "रुग्णांसाठी",
    "nav.impact":         "प्रभाव",
    "nav.library":        "ग्रंथालय",
    "nav.about":          "आमच्याबद्दल",
    "cta.register_donor": "दाता म्हणून नोंदणी करा",
    "cta.request_blood":  "रक्ताची विनंती करा",
    "lang.select":        "भाषा",
  },
  ta: {
    "nav.how_it_works":   "இது எப்படி செயல்படுகிறது",
    "nav.for_donors":     "நன்கொடையாளர்களுக்கு",
    "nav.for_patients":   "நோயாளிகளுக்கு",
    "nav.impact":         "தாக்கம்",
    "nav.library":        "நூலகம்",
    "nav.about":          "எங்களைப் பற்றி",
    "cta.register_donor": "நன்கொடையாளராக பதிவு செய்யுங்கள்",
    "cta.request_blood":  "இரத்தம் கோரவும்",
    "lang.select":        "மொழி",
  },
  te: {
    "nav.how_it_works":   "ఇది ఎలా పని చేస్తుంది",
    "nav.for_donors":     "దాతలకు",
    "nav.for_patients":   "రోగులకు",
    "nav.impact":         "ప్రభావం",
    "nav.library":        "గ్రంథాలయం",
    "nav.about":          "మా గురించి",
    "cta.register_donor": "దాతగా నమోదు చేయండి",
    "cta.request_blood":  "రక్తం అభ్యర్థించండి",
    "lang.select":        "భాష",
  },
  bn: {
    "nav.how_it_works":   "এটি কীভাবে কাজ করে",
    "nav.for_donors":     "দাতাদের জন্য",
    "nav.for_patients":   "রোগীদের জন্য",
    "nav.impact":         "প্রভাব",
    "nav.library":        "গ্রন্থাগার",
    "nav.about":          "আমাদের সম্পর্কে",
    "cta.register_donor": "দাতা হিসেবে নিবন্ধন করুন",
    "cta.request_blood":  "রক্তের অনুরোধ করুন",
    "lang.select":        "ভাষা",
  },
  gu: {
    "nav.how_it_works":   "આ કેવી રીતે કામ કરે છે",
    "nav.for_donors":     "દાતાઓ માટે",
    "nav.for_patients":   "દર્દીઓ માટે",
    "nav.impact":         "અસર",
    "nav.library":        "પુસ્તકાલય",
    "nav.about":          "અમારા વિશે",
    "cta.register_donor": "દાતા તરીકે નોંધણી કરો",
    "cta.request_blood":  "લોહીની વિનંતી કરો",
    "lang.select":        "ભાષા",
  },
  pa: {
    "nav.how_it_works":   "ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ",
    "nav.for_donors":     "ਦਾਨੀਆਂ ਲਈ",
    "nav.for_patients":   "ਮਰੀਜ਼ਾਂ ਲਈ",
    "nav.impact":         "ਪ੍ਰਭਾਵ",
    "nav.library":        "ਲਾਇਬ੍ਰੇਰੀ",
    "nav.about":          "ਸਾਡੇ ਬਾਰੇ",
    "cta.register_donor": "ਦਾਨੀ ਵਜੋਂ ਰਜਿਸਟਰ ਕਰੋ",
    "cta.request_blood":  "ਖੂਨ ਦੀ ਬੇਨਤੀ ਕਰੋ",
    "lang.select":        "ਭਾਸ਼ਾ",
  },
  kn: {
    "nav.how_it_works":   "ಇದು ಹೇಗೆ ಕಾರ್ಯ ನಿರ್ವಹಿಸುತ್ತದೆ",
    "nav.for_donors":     "ದಾನಿಗಳಿಗೆ",
    "nav.for_patients":   "ರೋಗಿಗಳಿಗೆ",
    "nav.impact":         "ಪ್ರಭಾವ",
    "nav.library":        "ಗ್ರಂಥಾಲಯ",
    "nav.about":          "ನಮ್ಮ ಬಗ್ಗೆ",
    "cta.register_donor": "ದಾನಿಯಾಗಿ ನೋಂದಾಯಿಸಿ",
    "cta.request_blood":  "ರಕ್ತ ವಿನಂತಿಸಿ",
    "lang.select":        "ಭಾಷೆ",
  },
};

// ─── Hook — use anywhere to get/set active language ───────────────────────────
export function useLanguage() {
  const [code, setCode] = useState<string>(DEFAULT_CODE);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.find((l) => l.code === stored)) setCode(stored);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) setCode(e.newValue);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const t = useCallback(
    (key: string): string =>
      TRANSLATIONS[code]?.[key] ?? TRANSLATIONS[DEFAULT_CODE]?.[key] ?? key,
    [code]
  );

  const changeLanguage = useCallback((newCode: string) => {
    setCode(newCode);
    localStorage.setItem(STORAGE_KEY, newCode);
    // Dispatch so other components on the same page react
    window.dispatchEvent(new CustomEvent("raksha-lang-change", { detail: { code: newCode } }));
  }, []);

  const active = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

  return { code, active, changeLanguage, t, languages: LANGUAGES };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LanguageSwitcher({
  variant  = "dropdown",
  position = "right",
}: LanguageSwitcherProps) {
  const { code, active, changeLanguage } = useLanguage();
  const [open, setOpen]   = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const select = (langCode: string) => {
    changeLanguage(langCode);
    setOpen(false);
  };

  // ── Pills variant ──────────────────────────────────────────────────────────
  if (variant === "pills") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {LANGUAGES.map((lang) => {
          const isActive = lang.code === code;
          return (
            <button
              key={lang.code}
              onClick={() => select(lang.code)}
              aria-label={`Switch to ${lang.english}`}
              style={{
                background:   isActive ? "#C0152A" : "rgba(17,30,55,0.8)",
                color:        isActive ? "#FAF9F7" : "#9CA3AF",
                border:       `1px solid ${isActive ? "#C0152A" : "rgba(107,114,128,0.25)"}`,
                borderRadius: 0,
                padding:      "6px 14px",
                fontFamily:   "'DM Sans', sans-serif",
                fontSize:     "0.8rem",
                cursor:       "pointer",
                transition:   "all 0.2s",
                whiteSpace:   "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "#C0152A";
                  e.currentTarget.style.color = "#FAF9F7";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "rgba(107,114,128,0.25)";
                  e.currentTarget.style.color = "#9CA3AF";
                }
              }}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Dropdown variant (default — used in GlobalHeader) ─────────────────────
  const menuAlign: React.CSSProperties =
    position === "right"
      ? { right: 0, left: "auto" }
      : position === "left"
      ? { left: 0, right: "auto" }
      : { left: "50%", transform: "translateX(-50%)" };

  return (
    <div ref={wrapRef} style={{ position: "relative", userSelect: "none" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current language: ${active.english}. Click to change.`}
        style={{
          display:       "flex",
          alignItems:    "center",
          gap:           8,
          background:    open ? "rgba(192,21,42,0.12)" : "rgba(17,30,55,0.6)",
          border:        `1px solid ${open ? "#C0152A" : "rgba(139,26,42,0.4)"}`,
          color:         "#FAF9F7",
          padding:       "6px 14px 6px 10px",
          cursor:        "pointer",
          fontFamily:    "'DM Sans', sans-serif",
          fontSize:      "0.82rem",
          fontWeight:    500,
          borderRadius:  0,
          transition:    "all 0.2s",
          whiteSpace:    "nowrap",
          minWidth:      120,
          justifyContent: "space-between",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.borderColor = "#C0152A";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.borderColor = "rgba(139,26,42,0.4)";
        }}
      >
        {/* Left: flag + native label */}
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: "1rem", lineHeight: 1 }}>{active.flag}</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif" }}>{active.label}</span>
        </span>

        {/* Right: chevron */}
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ transition: "transform 0.22s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0, marginLeft: 6 }}
        >
          <path d="M1 1L5 5L9 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          style={{
            position:       "absolute",
            top:            "calc(100% + 6px)",
            ...menuAlign,
            width:          200,
            background:     "#0D1B2E",
            border:         "1px solid rgba(139,26,42,0.5)",
            boxShadow:      "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,26,42,0.15)",
            zIndex:         10000,
            overflow:       "hidden",
            animation:      "langDropIn 0.18s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <style>{`
            @keyframes langDropIn {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0);    }
            }
          `}</style>

          {/* Header row */}
          <div style={{
            padding:      "10px 14px 8px",
            fontFamily:   "'DM Sans', sans-serif",
            fontSize:     "0.65rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:        "#6B7280",
            borderBottom: "1px solid rgba(139,26,42,0.25)",
          }}>
            Select Language
          </div>

          {/* Language options */}
          {LANGUAGES.map((lang) => {
            const isActive  = lang.code === code;
            const isHovered = hovered === lang.code;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => select(lang.code)}
                onMouseEnter={() => setHovered(lang.code)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display:       "flex",
                  alignItems:    "center",
                  justifyContent: "space-between",
                  width:         "100%",
                  padding:       "10px 14px",
                  background:    isActive
                    ? "rgba(192,21,42,0.15)"
                    : isHovered
                    ? "rgba(255,255,255,0.04)"
                    : "transparent",
                  border:        "none",
                  borderLeft:    isActive ? "2px solid #C0152A" : "2px solid transparent",
                  cursor:        "pointer",
                  transition:    "all 0.15s",
                  textAlign:     "left",
                }}
              >
                {/* Flag + native name + english name */}
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "1rem", lineHeight: 1 }}>{lang.flag}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize:   "0.88rem",
                      fontWeight: isActive ? 600 : 400,
                      color:      isActive ? "#FAF9F7" : "#D1D5DB",
                      lineHeight: 1.2,
                    }}>
                      {lang.label}
                    </span>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize:   "0.68rem",
                      color:      "#6B7280",
                      lineHeight: 1,
                    }}>
                      {lang.english}
                    </span>
                  </span>
                </span>

                {/* Active checkmark */}
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6.5" stroke="#2CA8A0" />
                    <path d="M4 7L6.2 9.2L10 5" stroke="#2CA8A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}

          {/* Footer note */}
          <div style={{
            padding:      "8px 14px 10px",
            fontFamily:   "'DM Sans', sans-serif",
            fontSize:     "0.62rem",
            color:        "#4B5563",
            borderTop:    "1px solid rgba(139,26,42,0.2)",
            lineHeight:   1.5,
          }}>
            Language preference saved automatically
          </div>
        </div>
      )}
    </div>
  );
}