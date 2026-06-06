"use client";

import { useEffect, useRef, useState } from "react";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --raksha-crimson:    #9B2335;
    --raksha-wine:       #8B1A2A;
    --raksha-blood:      #C0152A;
    --raksha-teal:       #2CA8A0;
    --raksha-teal-light: #4CC9C1;
    --raksha-coral:      #E8897A;
    --raksha-deep:       #0D0D0D;
    --raksha-navy:       #0A1628;
    --raksha-warm:       #F5ECD7;
    --raksha-white:      #FAF9F7;
    --raksha-muted:      #6B7280;
    --raksha-gold:       #D4A847;
    --raksha-green:      #1A7A4A;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    background: var(--raksha-deep);
    color: var(--raksha-white);
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
  }

  /* GRAIN OVERLAY */
  .grain::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
  }

  .section-rule {
    height: 1px;
    background: var(--raksha-wine);
    width: 100%;
  }

  /* FADE-IN ANIMATION */
  .fade-up {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .fade-up.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .fade-up.delay-1 { transition-delay: 0.1s; }
  .fade-up.delay-2 { transition-delay: 0.2s; }
  .fade-up.delay-3 { transition-delay: 0.3s; }
  .fade-up.delay-4 { transition-delay: 0.4s; }
  .fade-up.delay-5 { transition-delay: 0.5s; }

  /* NAVBAR */
  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 60px;
    background: rgba(10, 22, 40, 0.92);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(139, 26, 42, 0.3);
    transition: background 0.3s;
  }

  .navbar-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
  }
  .navbar-logo-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1;
  }
  .navbar-logo-text .raksha { color: #FAF9F7; }
  .navbar-logo-text .ai-text { color: var(--raksha-teal); }
  .navbar-logo-subtitle {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.55rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: var(--raksha-muted);
    text-transform: uppercase;
    margin-top: 2px;
  }

  .navbar-links {
    display: flex;
    align-items: center;
    gap: 36px;
    list-style: none;
  }
  .navbar-links a {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(250,249,247,0.65);
    text-decoration: none;
    transition: color 0.2s;
  }
  .navbar-links a:hover,
  .navbar-links a.active { color: var(--raksha-white); }
  .navbar-links a.active { color: var(--raksha-blood); }

  .navbar-cta {
    background: var(--raksha-blood);
    color: var(--raksha-white) !important;
    padding: 10px 22px;
    font-size: 0.78rem !important;
    border-radius: 0 !important;
    transition: background 0.2s !important;
  }
  .navbar-cta:hover { background: var(--raksha-wine) !important; color: var(--raksha-white) !important; }

  /* ── SECTION 1: HERO ── */
  .hero-section {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--raksha-navy);
  }
  .hero-video {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    z-index: 0;
  }
  .hero-overlay {
    position: absolute;
    inset: 0;
    background: rgba(10, 22, 40, 0.85);
    z-index: 1;
  }
  .hero-content {
    position: relative;
    z-index: 2;
    max-width: 960px;
    padding: 0 40px;
    text-align: center;
  }
  .hero-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--raksha-crimson);
    margin-bottom: 28px;
    display: block;
  }
  .hero-h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(40px, 6vw, 72px);
    font-weight: 700;
    line-height: 1.1;
    color: var(--raksha-white);
    letter-spacing: -0.01em;
  }
  .hero-h1 em {
    font-style: italic;
    color: var(--raksha-coral);
  }
  .hero-scroll-hint {
    position: absolute;
    bottom: 36px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    opacity: 0.5;
  }
  .hero-scroll-line {
    width: 1px;
    height: 48px;
    background: linear-gradient(to bottom, transparent, var(--raksha-white));
    animation: scrollPulse 2s ease-in-out infinite;
  }
  @keyframes scrollPulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  /* ── SECTION 2: BLOOD WARRIORS ── */
  .warriors-section {
    position: relative;
    background: var(--raksha-navy);
    padding: 120px 0;
    overflow: hidden;
  }
  .warriors-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 60px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
  }
  .warriors-left {}
  .section-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--raksha-crimson);
    margin-bottom: 20px;
    display: block;
  }
  .warriors-h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(32px, 3.5vw, 48px);
    font-weight: 700;
    color: var(--raksha-white);
    line-height: 1.15;
    margin-bottom: 24px;
  }
  .warriors-body {
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    font-weight: 300;
    line-height: 1.8;
    color: var(--raksha-muted);
    margin-bottom: 16px;
  }
  .warriors-right {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .warriors-logo-box {
    background: #111827;
    border: 1px solid var(--raksha-wine);
    border-radius: 12px;
    padding: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    min-height: 140px;
  }
  .warriors-logo-icon {
    width: 56px; height: 56px;
    background: var(--raksha-wine);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .warriors-logo-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--raksha-white);
    line-height: 1.2;
  }
  .warriors-logo-sub {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--raksha-muted);
    margin-top: 4px;
  }
  .warriors-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .stat-card {
    background: #111827;
    border: 1px solid rgba(139,26,42,0.3);
    border-radius: 10px;
    padding: 24px 20px;
    transition: border-color 0.2s;
  }
  .stat-card:hover { border-color: var(--raksha-blood); }
  .stat-number {
    font-family: 'JetBrains Mono', monospace;
    font-size: 2.2rem;
    font-weight: 500;
    color: var(--raksha-blood);
    display: block;
    line-height: 1;
    margin-bottom: 6px;
  }
  .stat-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 400;
    color: var(--raksha-muted);
    letter-spacing: 0.06em;
  }

  /* ── SECTION 3: ORIGIN ── */
  .origin-section {
    position: relative;
    background: var(--raksha-deep);
    padding: 120px 0;
    overflow: hidden;
  }
  .origin-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 60px;
  }
  .origin-header {
    margin-bottom: 80px;
    max-width: 680px;
  }
  .origin-quote {
    border-left: 4px solid var(--raksha-blood);
    padding-left: 32px;
    margin-bottom: 60px;
  }
  .origin-quote p {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(28px, 3.5vw, 52px);
    font-style: italic;
    font-weight: 600;
    color: var(--raksha-warm);
    line-height: 1.3;
  }
  .origin-quote cite {
    display: block;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 400;
    font-style: normal;
    color: var(--raksha-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 20px;
  }

  /* TIMELINE */
  .timeline {
    position: relative;
    padding-left: 40px;
    margin-top: 60px;
  }
  .timeline::before {
    content: '';
    position: absolute;
    left: 12px; top: 8px;
    bottom: 8px;
    width: 1px;
    background: var(--raksha-wine);
  }
  .timeline-item {
    position: relative;
    margin-bottom: 56px;
  }
  .timeline-item:last-child { margin-bottom: 0; }
  .timeline-dot {
    position: absolute;
    left: -36px; top: 4px;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--raksha-blood);
    border: 2px solid var(--raksha-wine);
    z-index: 1;
  }
  .timeline-date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--raksha-blood);
    letter-spacing: 0.12em;
    margin-bottom: 8px;
    display: block;
  }
  .timeline-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--raksha-white);
    margin-bottom: 8px;
  }
  .timeline-body {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 300;
    color: var(--raksha-muted);
    line-height: 1.75;
    max-width: 560px;
  }

  /* ── SECTION 4: VALUES ── */
  .values-section {
    position: relative;
    background: var(--raksha-navy);
    padding: 120px 0;
    overflow: hidden;
  }
  .values-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 60px;
  }
  .values-header {
    text-align: center;
    margin-bottom: 72px;
  }
  .values-h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(32px, 3.5vw, 52px);
    font-weight: 700;
    color: var(--raksha-white);
    margin-top: 16px;
  }
  .values-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  .value-card {
    background: #111827;
    border: 1px solid rgba(139,26,42,0.2);
    border-radius: 16px;
    padding: 40px 36px;
    transition: border-color 0.3s, transform 0.3s;
    cursor: default;
  }
  .value-card:hover {
    border-color: var(--raksha-blood);
    transform: translateY(-4px);
  }
  .value-number {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--raksha-blood);
    letter-spacing: 0.1em;
    margin-bottom: 16px;
    display: block;
  }
  .value-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--raksha-white);
    margin-bottom: 12px;
  }
  .value-body {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 300;
    color: var(--raksha-muted);
    line-height: 1.75;
  }
  .value-icon {
    font-size: 1.8rem;
    margin-bottom: 16px;
    display: block;
  }

  /* ── SECTION 5: TEAM ── */
  .team-section {
    position: relative;
    background: var(--raksha-deep);
    padding: 120px 0;
    overflow: hidden;
  }
  .team-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 60px;
  }
  .team-header {
    text-align: center;
    margin-bottom: 72px;
  }
  .team-h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(32px, 3.5vw, 52px);
    font-weight: 700;
    color: var(--raksha-white);
    margin-top: 16px;
  }
  .team-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }
  .team-card {
    background: #111827;
    border: 1px solid rgba(139,26,42,0.2);
    border-radius: 16px;
    padding: 40px 28px;
    text-align: center;
    transition: border-color 0.3s, transform 0.3s;
  }
  .team-card:hover {
    border-color: var(--raksha-blood);
    transform: translateY(-4px);
  }
  .team-avatar {
    width: 88px; height: 88px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--raksha-blood), var(--raksha-navy));
    margin: 0 auto 20px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--raksha-white);
    border: 2px solid rgba(192,21,42,0.4);
  }
  .team-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--raksha-white);
    margin-bottom: 6px;
  }
  .team-role {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--raksha-teal);
    margin-bottom: 16px;
    display: block;
  }
  .team-bio {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 300;
    color: var(--raksha-muted);
    line-height: 1.7;
  }

  /* ── ASSISTANT CARD ── */
  .assistant-section {
    position: relative;
    background: var(--raksha-navy);
    padding: 100px 0;
    overflow: hidden;
  }
  .assistant-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 60px;
  }
  .assistant-card {
    display: block;
    background: #111827;
    border: 1px solid #1e293b;
    border-radius: 16px;
    padding: 44px 40px;
    text-decoration: none;
    max-width: 560px;
    transition: border-color 0.3s, transform 0.3s;
  }
  .assistant-card:hover {
    border-color: var(--raksha-blood);
    transform: translateY(-3px);
  }
  .assistant-card-icon {
    margin-bottom: 20px;
  }
  .assistant-card-icon svg { animation: assistantPulse 2.4s ease-in-out infinite; }
  @keyframes assistantPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.07); }
  }
  .assistant-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: #FAF9F7;
    margin-bottom: 10px;
  }
  .assistant-card-sub {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 300;
    color: var(--raksha-muted);
    line-height: 1.7;
    margin-bottom: 20px;
  }
  .assistant-card-cta {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--raksha-blood);
  }

  /* ── SECTION 6: CLOSING ── */
  .closing-section {
    position: relative;
    background: #6B0F1A;
    padding: 120px 0;
    overflow: hidden;
  }
  .closing-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(192,21,42,0.25) 0%, transparent 70%);
    pointer-events: none;
  }
  .closing-inner {
    position: relative;
    z-index: 1;
    max-width: 800px;
    margin: 0 auto;
    padding: 0 60px;
    text-align: center;
  }
  .closing-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(250,249,247,0.5);
    margin-bottom: 24px;
    display: block;
  }
  .closing-h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 5vw, 64px);
    font-weight: 700;
    color: var(--raksha-white);
    line-height: 1.1;
    margin-bottom: 24px;
  }
  .closing-body {
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    font-weight: 300;
    color: rgba(250,249,247,0.7);
    line-height: 1.8;
    margin-bottom: 48px;
  }
  .closing-ctas {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .btn-primary {
    background: var(--raksha-white);
    color: var(--raksha-blood);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 16px 36px;
    border: none;
    cursor: pointer;
    border-radius: 0;
    transition: background 0.2s, color 0.2s;
    text-decoration: none;
    display: inline-block;
  }
  .btn-primary:hover {
    background: var(--raksha-warm);
  }
  .btn-outline {
    background: transparent;
    color: var(--raksha-white);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 16px 36px;
    border: 1px solid rgba(250,249,247,0.6);
    cursor: pointer;
    border-radius: 0;
    transition: border-color 0.2s, background 0.2s;
    text-decoration: none;
    display: inline-block;
  }
  .btn-outline:hover {
    border-color: var(--raksha-white);
    background: rgba(250,249,247,0.08);
  }

  /* FOOTER */
  .footer {
    background: #060C16;
    border-top: 1px solid var(--raksha-wine);
    padding: 40px 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-copy {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    color: var(--raksha-muted);
  }
  .footer-links {
    display: flex;
    gap: 24px;
    list-style: none;
  }
  .footer-links a {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    color: var(--raksha-muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .footer-links a:hover { color: var(--raksha-white); }

  /* MOBILE */
  @media (max-width: 900px) {
    .navbar { padding: 16px 24px; }
    .navbar-links { display: none; }
    .warriors-inner { grid-template-columns: 1fr; gap: 48px; padding: 0 24px; }
    .values-grid { grid-template-columns: 1fr; }
    .team-grid { grid-template-columns: 1fr; }
    .origin-inner, .team-inner, .values-inner { padding: 0 24px; }
    .closing-inner { padding: 0 24px; }
    .footer { flex-direction: column; gap: 20px; padding: 32px 24px; text-align: center; }
    .hero-h1 { font-size: clamp(28px, 7vw, 52px); }
    .closing-ctas { flex-direction: column; align-items: center; }
  }
`;

// ─── SHIELD LOGO SVG ──────────────────────────────────────────────────────────
function ShieldLogo() {
  return (
    <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="42">
      <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A"/>
      <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95"/>
      <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ─── COUNTER HOOK ─────────────────────────────────────────────────────────────
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

// ─── INTERSECTION OBSERVER HOOK ───────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ value, suffix = "", label, inView }: { value: number; suffix?: string; label: string; inView: boolean }) {
  const count = useCounter(value, 2000, inView);
  return (
    <div className="stat-card fade-up">
      <span className="stat-number">{count.toLocaleString()}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className="navbar" style={{ background: scrolled ? "rgba(6,12,22,0.97)" : "rgba(10,22,40,0.92)" }}>
      <a href="/" className="navbar-logo">
        <ShieldLogo />
        <div>
          <div className="navbar-logo-text">
            <span className="raksha">Raksha</span>
            <span className="ai-text">AI</span>
          </div>
          <div className="navbar-logo-subtitle">Blood Intelligence & Care Coordination</div>
        </div>
      </a>
      <ul className="navbar-links">
        <li><a href="/">Home</a></li>
        <li><a href="/about" className="active">About</a></li>
        <li><a href="/register/donor">Donate Blood</a></li>
        <li><a href="/register/patient">For Patients</a></li>
        <li><a href="/ai-assistant">AI Assistant</a></li>
        <li><a href="/register/donor" className="navbar-cta">Get Started</a></li>
      </ul>
    </nav>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // scroll animations
  const animRefs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.1 });
    document.querySelectorAll(".fade-up").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // video playback rate
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.75;
  }, []);

  // stat counter trigger
  const { ref: statsRef, inView: statsInView } = useInView(0.3);

  const teamMembers = [
    { initials: "AR", name: "Arjun Reddy", role: "Founder & CEO", bio: "Thalassemia caregiver and public health technologist. Built Raksha AI after his daughter's crisis in 2021." },
    { initials: "PK", name: "Priya Krishnan", role: "Chief Medical Officer", bio: "Hematologist with 14 years at AIIMS Hyderabad. Leads clinical protocol design and safety oversight." },
    { initials: "SM", name: "Siddharth Mehta", role: "Head of AI & Data", bio: "Former ML researcher at Google Health. Architect of the Raksha donor-matching algorithm." },
    { initials: "NV", name: "Nandini Varma", role: "Head of Community", bio: "Patient advocate and social worker. Manages the Blood Warriors volunteer network across 12 states." },
    { initials: "RG", name: "Rahul Gupta", role: "Engineering Lead", bio: "Full-stack engineer building the real-time coordination infrastructure powering Raksha's alerts." },
    { initials: "AT", name: "Ananya Tiwari", role: "Product Design", bio: "Human-centered designer ensuring every interaction in Raksha feels humane, fast, and trustworthy." },
  ];

  const values = [
    { num: "01", icon: "🩸", title: "Life Before Logistics", body: "Every feature decision starts with one question: does this help a patient get blood faster? We optimise for lives, not metrics." },
    { num: "02", icon: "🤝", title: "Community as Infrastructure", body: "Donors are not a resource — they are partners. We build relationships, not transactions, with every person who gives blood." },
    { num: "03", icon: "🧠", title: "AI That Earns Trust", body: "Our models explain every match recommendation. No black boxes when a child's life depends on the answer." },
    { num: "04", icon: "🔍", title: "Radical Transparency", body: "Patients and families can see exactly where their request stands, who has been contacted, and what happens next." },
  ];

  const timeline = [
    { date: "2021-03-14", title: "The Crisis", body: "Arjun's 4-year-old daughter ran out of blood on a Tuesday night. 11 phone calls. 3 hospitals. 6 hours. The system failed her. That night, Raksha was conceived." },
    { date: "2021-08", title: "Blood Warriors Founded", body: "A WhatsApp group became a non-profit. Blood Warriors began manually coordinating donors for Thalassemia patients across Hyderabad." },
    { date: "2022-04", title: "First Algorithm", body: "A basic donor-matching script reduced average response time from 6 hours to 90 minutes for 47 enrolled patients." },
    { date: "2023-01", title: "Raksha AI v0.1 Launches", body: "First production deployment. Real-time donor alerts, AI triage, and hospital coordination — serving 3 cities." },
    { date: "2024-06", title: "National Scale", body: "12 states. 8,400 registered donors. 2,100 patients. Zero recorded fatalities due to blood shortage among enrolled patients." },
    { date: "2025", title: "Today", body: "Raksha AI processes 200+ emergency requests monthly. We are building the national infrastructure for thalassemia care coordination." },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <Navbar />

      {/* ── SECTION 1: HERO ── */}
      <section className="hero-section grain">
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay muted loop playsInline
          style={{ filter: "saturate(0.4) brightness(0.6)" }}
        >
          <source src="https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-label fade-up">Our Story</span>
          <h1 className="hero-h1 fade-up delay-1">
            This platform exists because a{" "}
            <em>4-year-old ran out of blood</em>{" "}
            on a Tuesday.
          </h1>
        </div>
        <div className="hero-scroll-hint">
          <div className="hero-scroll-line" />
        </div>
      </section>

      <div className="section-rule" />

      {/* ── SECTION 2: BLOOD WARRIORS ── */}
      <section className="warriors-section grain">
        <div className="warriors-inner">
          <div className="warriors-left">
            <span className="section-label fade-up">Blood Warriors Foundation</span>
            <h2 className="warriors-h2 fade-up delay-1">
              The non-profit that became<br />a movement
            </h2>
            <p className="warriors-body fade-up delay-2">
              Blood Warriors Foundation was born from a single WhatsApp group in 2021 — a small network of volunteers in Hyderabad manually connecting Thalassemia patients with compatible blood donors.
            </p>
            <p className="warriors-body fade-up delay-3">
              What started as a crisis response became a 3,000-volunteer network operating across 12 Indian states. Raksha AI is the technology layer built on top of that human foundation — not to replace it, but to amplify it.
            </p>
          </div>
          <div className="warriors-right" ref={statsRef}>
            <div className="warriors-logo-box fade-up">
              <div className="warriors-logo-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                  <path d="M12 2L20 7V17C20 20.5 12 23 12 23C12 23 4 20.5 4 17V7L12 2Z" fill="#FAF9F7" opacity="0.9"/>
                  <path d="M12 8C12 8 9 12 9 14C9 15.7 10.3 17 12 17C13.7 17 15 15.7 15 14C15 12 12 8 12 8Z" fill="#8B1A2A"/>
                </svg>
              </div>
              <div>
                <div className="warriors-logo-text">Blood Warriors<br />Foundation</div>
                <div className="warriors-logo-sub">Since 2021 · Hyderabad, India</div>
              </div>
            </div>
            <div className="warriors-stats">
              <StatCard value={3200} suffix="+" label="Active Volunteers" inView={statsInView} />
              <StatCard value={12} label="States Covered" inView={statsInView} />
              <StatCard value={8400} suffix="+" label="Registered Donors" inView={statsInView} />
              <StatCard value={2100} suffix="+" label="Patients Enrolled" inView={statsInView} />
            </div>
          </div>
        </div>
      </section>

      <div className="section-rule" />

      {/* ── SECTION 3: ORIGIN ── */}
      <section className="origin-section grain">
        <div className="origin-inner">
          <div className="origin-header">
            <span className="section-label fade-up">Origin of Raksha AI</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px,3.5vw,48px)", fontWeight: 700, color: "var(--raksha-white)", marginTop: 16 }} className="fade-up delay-1">
              From a crisis on a Tuesday<br />to national infrastructure
            </h2>
          </div>

          <div className="origin-quote fade-up delay-2">
            <p>"We did not build Raksha to be a startup. We built it because the alternative was watching children die waiting for a phone call that never came."</p>
            <cite>— Arjun Reddy, Founder</cite>
          </div>

          <div className="timeline">
            {timeline.map((item, i) => (
              <div className="timeline-item fade-up" style={{ transitionDelay: `${i * 0.08}s` }} key={item.date}>
                <div className="timeline-dot" />
                <span className="timeline-date">{item.date}</span>
                <div className="timeline-title">{item.title}</div>
                <p className="timeline-body">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-rule" />

      {/* ── SECTION 4: VALUES ── */}
      <section className="values-section grain">
        <div className="values-inner">
          <div className="values-header">
            <span className="section-label fade-up">What We Stand For</span>
            <h2 className="values-h2 fade-up delay-1">Our Four Values</h2>
          </div>
          <div className="values-grid">
            {values.map((v, i) => (
              <div className="value-card fade-up" style={{ transitionDelay: `${i * 0.1}s` }} key={v.num}>
                <span className="value-icon">{v.icon}</span>
                <span className="value-number">{v.num}</span>
                <div className="value-title">{v.title}</div>
                <p className="value-body">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-rule" />

      {/* ── SECTION 5: TEAM ── */}
      <section className="team-section grain">
        <div className="team-inner">
          <div className="team-header">
            <span className="section-label fade-up">The People Behind Raksha</span>
            <h2 className="team-h2 fade-up delay-1">Our Team</h2>
          </div>
          <div className="team-grid">
            {teamMembers.map((m, i) => (
              <div className="team-card fade-up" style={{ transitionDelay: `${i * 0.08}s` }} key={m.name}>
                <div className="team-avatar">{m.initials}</div>
                <div className="team-name">{m.name}</div>
                <span className="team-role">{m.role}</span>
                <p className="team-bio">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-rule" />

      {/* ── ASSISTANT CARD ── */}
      <section className="assistant-section grain">
        <div className="assistant-inner">
          <span className="section-label fade-up">Have a Question?</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px,3.5vw,48px)", fontWeight: 700, color: "var(--raksha-white)", marginTop: 16, marginBottom: 40 }} className="fade-up delay-1">
            Talk to the Raksha Assistant
          </h2>
          <a href="/ai-assistant" className="assistant-card fade-up delay-2">
            <div className="assistant-card-icon">
              <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="40">
                <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A"/>
                <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95"/>
                <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className="assistant-card-title">Raksha Assistant</div>
            <p className="assistant-card-sub">
              Ask our AI anything about blood donation, Thalassemia, and how Raksha AI works.
            </p>
            <span className="assistant-card-cta">Start a conversation →</span>
          </a>
        </div>
      </section>

      <div className="section-rule" />

      {/* ── SECTION 6: CLOSING ── */}
      <section className="closing-section grain">
        <div className="closing-inner">
          <span className="closing-label fade-up">Join the Mission</span>
          <h2 className="closing-h2 fade-up delay-1">
            Every donor is a<br />lifeline. Be one.
          </h2>
          <p className="closing-body fade-up delay-2">
            Thalassemia patients need blood transfusions every 2–4 weeks for life. Behind every transfusion is a donor who showed up. Raksha AI makes showing up effortless — we find patients near you, notify you when you match, and coordinate everything end-to-end.
          </p>
          <div className="closing-ctas fade-up delay-3">
            <a href="/register/donor" className="btn-primary">Register as a Donor</a>
            <a href="/register/patient" className="btn-outline">Enroll Your Patient</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <ShieldLogo />
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontWeight: 700, color: "#FAF9F7" }}>
              Raksha<span style={{ color: "#2CA8A0" }}>AI</span>
            </span>
          </div>
          <p className="footer-copy">© 2025 Blood Warriors Foundation. Built for patients, powered by community.</p>
        </div>
        <ul className="footer-links">
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">Terms</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/donate">Donate</a></li>
        </ul>
      </footer>
    </>
  );
}
