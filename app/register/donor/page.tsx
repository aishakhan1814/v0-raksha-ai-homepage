"use client";

import { useState, useEffect, useRef } from "react";

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --crimson:   #9B2335;
  --wine:      #8B1A2A;
  --blood:     #C0152A;
  --teal:      #2CA8A0;
  --teal-l:    #4CC9C1;
  --coral:     #E8897A;
  --deep:      #0D0D0D;
  --navy:      #0A1628;
  --surface:   #111827;
  --surface2:  #1e293b;
  --border:    #2d3748;
  --warm:      #F5ECD7;
  --white:     #FAF9F7;
  --muted:     #6B7280;
  --muted2:    #9CA3AF;
  --gold:      #D4A847;
  --green:     #22C55E;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: 'DM Sans', sans-serif;
  background: var(--navy);
  color: var(--white);
  min-height: 100vh;
  overflow-x: hidden;
}

/* GRAIN */
.grain {
  position: relative;
}
.grain::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

/* ── TOP BAR ── */
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10,22,40,0.97);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(139,26,42,0.3);
  padding: 0 48px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.logo-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}
.logo-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
}
.logo-text .r { color: var(--white); }
.logo-text .a { color: var(--teal); }

.progress-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  max-width: 360px;
}
.progress-bar {
  display: flex;
  align-items: center;
  gap: 0;
  width: 100%;
}
.prog-seg {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  transition: background 0.4s ease;
}
.prog-seg + .prog-seg { margin-left: 4px; }
.prog-dot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.prog-dot {
  width: 20px; height: 20px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 500;
  transition: background 0.4s, color 0.4s;
  flex-shrink: 0;
}
.prog-dot.done   { background: var(--teal);  color: var(--white); }
.prog-dot.active { background: var(--blood); color: var(--white); }
.prog-dot.future { background: var(--surface2); color: var(--muted); }
.prog-line-seg {
  flex: 1;
  height: 2px;
  transition: background 0.4s;
}

.step-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  color: var(--muted);
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.topbar-right {
  flex-shrink: 0;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: var(--muted);
}
.topbar-right a {
  color: var(--teal);
  text-decoration: none;
}
.topbar-right a:hover { color: var(--teal-l); }

/* ── MAIN LAYOUT ── */
.page-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 48px 0;
  display: grid;
  grid-template-columns: 60fr 40fr;
  gap: 40px;
  align-items: start;
  position: relative;
  z-index: 1;
}

/* ── FORM PANEL ── */
.form-panel {
  min-height: 600px;
}
.step-heading {
  margin-bottom: 36px;
}
.step-eyebrow {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--blood);
  margin-bottom: 10px;
  display: block;
}
.step-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 700;
  color: var(--white);
  line-height: 1.15;
  margin-bottom: 8px;
}
.step-subtitle {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 300;
  color: var(--muted);
  line-height: 1.6;
}

/* FIELD */
.field-group {
  margin-bottom: 20px;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.field-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--muted2);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: block;
  margin-bottom: 6px;
}
.field-label .req { color: var(--blood); margin-left: 2px; }
.field-input {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--white);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.92rem;
  font-weight: 400;
  padding: 12px 14px;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
  -webkit-appearance: none;
}
.field-input::placeholder { color: #4B5563; }
.field-input:focus { border-color: var(--blood); }
.field-input.error { border-color: var(--blood); box-shadow: 0 0 0 3px rgba(192,21,42,0.15); }
.field-select {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--white);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.92rem;
  padding: 12px 14px;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
}
.field-select:focus { border-color: var(--blood); }
.field-select option { background: var(--surface2); color: var(--white); }
.field-error {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  color: var(--blood);
  margin-top: 4px;
  display: block;
}

/* RADIO GROUP */
.radio-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.radio-pill {
  position: relative;
}
.radio-pill input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0; height: 0;
}
.radio-pill label {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  color: var(--muted2);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  user-select: none;
}
.radio-pill input[type="radio"]:checked + label {
  border-color: var(--blood);
  background: rgba(192,21,42,0.12);
  color: var(--white);
}
.radio-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  border: 2px solid currentColor;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.2s;
}
.radio-dot::after {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--blood);
  opacity: 0;
  transition: opacity 0.2s;
}
.radio-pill input[type="radio"]:checked + label .radio-dot::after {
  opacity: 1;
}
.radio-pill input[type="radio"]:checked + label .radio-dot {
  border-color: var(--blood);
}

/* AVAILABILITY PILLS */
.pill-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.avail-pill {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 14px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  color: var(--muted2);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.avail-pill.selected {
  background: var(--blood);
  border-color: var(--blood);
  color: var(--white);
}
.avail-pill:hover:not(.selected) {
  border-color: rgba(192,21,42,0.5);
  color: var(--white);
}

/* CHECKBOX */
.check-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(45,55,72,0.5);
}
.check-item:last-child { border-bottom: none; }
.check-box {
  width: 20px; height: 20px;
  border-radius: 4px;
  border: 2px solid var(--border);
  background: var(--surface2);
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 1px;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.2s, background 0.2s;
}
.check-box.checked {
  background: var(--teal);
  border-color: var(--teal);
}
.check-tick {
  display: none;
}
.check-box.checked .check-tick {
  display: block;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
}
.check-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 300;
  color: var(--muted2);
  line-height: 1.55;
  flex: 1;
}
.check-text strong { color: var(--white); font-weight: 500; }

/* CONSENT CARD */
.consent-card {
  background: var(--surface);
  border: 1px solid var(--wine);
  border-radius: 12px;
  padding: 28px 24px;
  margin-bottom: 24px;
}
.consent-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--white);
  margin-bottom: 4px;
}
.consent-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: var(--muted);
  margin-bottom: 20px;
}

/* SUMMARY CARD */
.summary-card {
  background: var(--surface);
  border: 1px solid var(--wine);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}
.summary-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 16px;
}
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}
.summary-item { }
.summary-key {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 2px;
  display: block;
}
.summary-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.88rem;
  color: var(--white);
}
.summary-val.blood-type {
  color: var(--blood);
  font-weight: 500;
}

/* BUTTONS */
.btn-continue {
  width: 100%;
  background: var(--blood);
  color: var(--white);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 16px 24px;
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 28px;
}
.btn-continue:hover { background: var(--wine); }
.btn-continue:active { transform: scale(0.99); }
.btn-continue:disabled { background: #374151; color: var(--muted); cursor: not-allowed; }

.btn-submit {
  width: 100%;
  background: var(--blood);
  color: var(--white);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 20px 24px;
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.btn-submit:hover { background: var(--wine); }
.btn-submit:disabled { background: #374151; cursor: not-allowed; }

.btn-back {
  background: none;
  border: none;
  color: var(--muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  cursor: pointer;
  padding: 8px 0;
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
}
.btn-back:hover { color: var(--white); }

/* ── SUCCESS SCREEN ── */
.success-screen {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 40px;
  animation: fadeInUp 0.6s ease forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.success-shield {
  margin-bottom: 32px;
  animation: pulseCrimson 2s ease-in-out infinite;
}
@keyframes pulseCrimson {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(192,21,42,0.4)); }
  50%       { filter: drop-shadow(0 0 24px rgba(192,21,42,0.8)); }
}
.success-check-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 32px;
}
.success-check {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: rgba(44, 168, 160, 0.12);
  border: 2px solid var(--teal);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.8rem;
  color: var(--teal);
  animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}
@keyframes popIn {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
.success-h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(32px, 4vw, 52px);
  font-weight: 700;
  color: var(--white);
  margin-bottom: 16px;
  line-height: 1.1;
}
.success-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 300;
  color: var(--muted);
  line-height: 1.7;
  max-width: 480px;
  margin: 0 auto 36px;
}
.success-id {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--teal);
  background: rgba(44,168,160,0.08);
  border: 1px solid rgba(44,168,160,0.25);
  border-radius: 6px;
  padding: 10px 20px;
  display: inline-block;
  margin-bottom: 32px;
  letter-spacing: 0.1em;
}
.success-ctas {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.btn-teal {
  background: var(--teal);
  color: var(--white);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 13px 28px;
  border: none;
  border-radius: 0;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s;
}
.btn-teal:hover { background: var(--teal-l); }
.btn-outline-sm {
  background: transparent;
  color: var(--white);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 13px 28px;
  border: 1px solid rgba(250,249,247,0.3);
  border-radius: 0;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: border-color 0.2s;
}
.btn-outline-sm:hover { border-color: var(--white); }

/* ── SIDEBAR ── */
.sidebar {
  position: sticky;
  top: 96px;
  background: var(--surface);
  border: 1px solid var(--surface2);
  border-radius: 16px;
  overflow: hidden;
}
.sidebar-steps {
  padding: 28px 24px;
  border-bottom: 1px solid var(--surface2);
}
.sidebar-steps-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 20px;
}
.sidebar-step-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
}
.sidebar-step-item:last-child { margin-bottom: 0; }
.sidebar-step-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 500;
  flex-shrink: 0;
  margin-top: 1px;
  transition: all 0.3s;
}
.sidebar-step-dot.done   { background: var(--teal);    color: white; }
.sidebar-step-dot.active { background: var(--blood);   color: white; }
.sidebar-step-dot.future { background: var(--surface2); color: var(--muted); }
.sidebar-step-info {}
.sidebar-step-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--white);
  margin-bottom: 2px;
  transition: color 0.3s;
}
.sidebar-step-desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 300;
  color: var(--muted);
  line-height: 1.5;
}
.sidebar-step-item.future .sidebar-step-name { color: var(--muted); }

.sidebar-trust {
  padding: 24px;
  border-bottom: 1px solid var(--surface2);
}
.sidebar-trust-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 16px;
}
.trust-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.trust-item:last-child { margin-bottom: 0; }
.trust-icon {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: rgba(34,197,94,0.12);
  border: 1px solid rgba(34,197,94,0.3);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  font-size: 0.6rem;
  color: var(--green);
}
.trust-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 300;
  color: var(--muted2);
  line-height: 1.4;
}

.sidebar-quote {
  padding: 24px;
  border-bottom: 1px solid var(--surface2);
  border-left: 4px solid var(--gold);
  margin: 0 0 0 0;
}
.sidebar-quote-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.05rem;
  font-style: italic;
  font-weight: 600;
  color: var(--warm);
  line-height: 1.55;
  margin-bottom: 10px;
}
.sidebar-quote-author {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--muted);
  letter-spacing: 0.08em;
}

.sidebar-stats {
  padding: 20px 24px;
  display: flex;
  gap: 0;
}
.sidebar-stat {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
}
.sidebar-stat + .sidebar-stat {
  border-left: 1px solid var(--surface2);
}
.sidebar-stat-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--blood);
  display: block;
  margin-bottom: 3px;
}
.sidebar-stat-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.65rem;
  color: var(--muted);
  letter-spacing: 0.06em;
  line-height: 1.3;
  text-align: center;
}

/* ── WHAT HAPPENS NEXT ── */
.next-section {
  background: #060C16;
  border-top: 1px solid var(--wine);
  padding: 72px 48px;
  margin-top: 64px;
}
.next-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.next-title-wrap {
  text-align: center;
  margin-bottom: 52px;
}
.next-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--blood);
  display: block;
  margin-bottom: 12px;
}
.next-h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 700;
  color: var(--white);
}
.next-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  position: relative;
}
.next-steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: calc(12.5% + 20px);
  right: calc(12.5% + 20px);
  height: 1px;
  background: linear-gradient(to right, var(--teal), rgba(44,168,160,0.2));
}
.next-step {
  text-align: center;
  position: relative;
}
.next-step-circle {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--teal);
  color: white;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  font-weight: 500;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  position: relative;
  z-index: 1;
}
.next-step-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--white);
  margin-bottom: 8px;
}
.next-step-body {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  font-weight: 300;
  color: var(--muted);
  line-height: 1.65;
}

/* ── BOTTOM BAR ── */
.bottom-bar {
  background: var(--navy);
  border-top: 1px solid var(--wine);
  padding: 24px 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.bottom-bar-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  color: var(--muted);
}
.bottom-bar-links {
  display: flex;
  align-items: center;
  gap: 24px;
  list-style: none;
}
.bottom-bar-links li {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  color: var(--muted);
}
.bottom-bar-links a {
  color: var(--teal);
  text-decoration: none;
}
.bottom-bar-links a:hover { color: var(--teal-l); }
.bottom-bar-phone {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--white);
}

/* ── RESPONSIVE ── */
@media (max-width: 960px) {
  .page-body { grid-template-columns: 1fr; padding: 32px 24px 0; }
  .sidebar { position: static; margin-top: 40px; }
  .topbar { padding: 0 20px; }
  .field-row { grid-template-columns: 1fr; }
  .next-steps { grid-template-columns: 1fr 1fr; }
  .next-steps::before { display: none; }
  .next-section { padding: 48px 24px; }
  .bottom-bar { padding: 20px 24px; flex-direction: column; text-align: center; }
}
@media (max-width: 480px) {
  .next-steps { grid-template-columns: 1fr; }
  .summary-grid { grid-template-columns: 1fr; }
  .success-ctas { flex-direction: column; }
}

/* LOADING SPINNER */
.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* FORM SLIDE TRANSITION */
.form-step-enter {
  animation: slideIn 0.3s ease forwards;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;

// ─── DATA ─────────────────────────────────────────────────────────────────────
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STATES = ["Andhra Pradesh","Bihar","Delhi","Gujarat","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal","Other"];
const CITIES: Record<string, string[]> = {
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam"],
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Tirupati","Kurnool"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad"],
  "Karnataka": ["Bangalore","Mysore","Hubli","Mangalore","Belgaum"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Trichy","Salem"],
  "Delhi": ["New Delhi","Dwarka","Rohini","Noida","Gurugram"],
};

// ─── SHIELD LOGO ─────────────────────────────────────────────────────────────
function Shield({ size = 32 }: { size?: number }) {
  const h = size * (56 / 48);
  return (
    <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={h}>
      <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A"/>
      <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95"/>
      <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const steps = ["Personal Details", "Medical & Availability", "Consent & Confirm"];
  return (
    <div className="progress-area">
      <div className="prog-dot-row">
        {steps.map((s, i) => {
          const state = i + 1 < step ? "done" : i + 1 === step ? "active" : "future";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "initial" }}>
              <div className={`prog-dot ${state}`} title={s}>
                {state === "done" ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="prog-line-seg" style={{ background: i + 1 < step ? "var(--teal)" : "var(--surface2)" }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="step-label">Step {step} of 3 — {steps[step - 1]}</div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ step }: { step: number }) {
  const steps = [
    { name: "Personal Details", desc: "Name, age, blood type, location" },
    { name: "Medical & Availability", desc: "Health history, donation schedule" },
    { name: "Consent & Confirm", desc: "Review and submit registration" },
  ];
  const trust = [
    "Your data is encrypted and secure",
    "Never shared without your consent",
    "Opt-out anytime from your dashboard",
    "PDPA & health data compliant",
    "Verified by Blood Warriors Foundation",
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-steps">
        <div className="sidebar-steps-title">Registration Steps</div>
        {steps.map((s, i) => {
          const state = i + 1 < step ? "done" : i + 1 === step ? "active" : "future";
          return (
            <div className={`sidebar-step-item ${state}`} key={i}>
              <div className={`sidebar-step-dot ${state}`}>
                {state === "done" ? "✓" : i + 1}
              </div>
              <div className="sidebar-step-info">
                <div className="sidebar-step-name">{s.name}</div>
                <div className="sidebar-step-desc">{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="sidebar-trust">
        <div className="sidebar-trust-title">Why we need this</div>
        {trust.map((t, i) => (
          <div className="trust-item" key={i}>
            <div className="trust-icon">✓</div>
            <span className="trust-text">{t}</span>
          </div>
        ))}
      </div>
      <div className="sidebar-quote">
        <p className="sidebar-quote-text">"I donated for the first time last year. Raksha matched me in 22 minutes. The family called me. I cried."</p>
        <span className="sidebar-quote-author">— Pradeep S., Donor · Hyderabad</span>
      </div>
      <div className="sidebar-stats">
        <div className="sidebar-stat">
          <span className="sidebar-stat-num">22m</span>
          <span className="sidebar-stat-label">Avg. match time</span>
        </div>
        <div className="sidebar-stat">
          <span className="sidebar-stat-num">8,400+</span>
          <span className="sidebar-stat-label">Active donors</span>
        </div>
        <div className="sidebar-stat">
          <span className="sidebar-stat-num">0</span>
          <span className="sidebar-stat-label">Data sold</span>
        </div>
      </div>
    </aside>
  );
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface FormData {
  // Step 1
  firstName: string; lastName: string; phone: string; email: string;
  age: string; gender: string; bloodType: string; state: string; city: string;
  // Step 2
  lastDonated: string; donationCount: string; weight: string;
  hasConditions: string; conditions: string;
  availability: string[]; preferredTime: string; maxDistance: string;
  // Step 3 consents
  consentShare: boolean; consentNotify: boolean; consentData: boolean; consentAge: boolean;
}

type Errors = Partial<Record<keyof FormData, string>>;

// ─── STEP 1 ───────────────────────────────────────────────────────────────────
function Step1({ data, onChange, errors }: { data: FormData; onChange: (k: keyof FormData, v: any) => void; errors: Errors }) {
  const cities = data.state ? (CITIES[data.state] || []) : [];
  return (
    <div className="form-step-enter">
      <div className="step-heading">
        <span className="step-eyebrow">Step 1 of 3</span>
        <h2 className="step-title">Your Personal Details</h2>
        <p className="step-subtitle">This helps us verify your eligibility and match you with patients near you.</p>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">First Name <span className="req">*</span></label>
          <input className={`field-input ${errors.firstName ? "error" : ""}`} placeholder="Arjun" value={data.firstName} onChange={e => onChange("firstName", e.target.value)} />
          {errors.firstName && <span className="field-error">{errors.firstName}</span>}
        </div>
        <div className="field-group">
          <label className="field-label">Last Name <span className="req">*</span></label>
          <input className={`field-input ${errors.lastName ? "error" : ""}`} placeholder="Reddy" value={data.lastName} onChange={e => onChange("lastName", e.target.value)} />
          {errors.lastName && <span className="field-error">{errors.lastName}</span>}
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Phone Number <span className="req">*</span></label>
          <input className={`field-input ${errors.phone ? "error" : ""}`} type="tel" placeholder="+91 98765 43210" value={data.phone} onChange={e => onChange("phone", e.target.value)} />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>
        <div className="field-group">
          <label className="field-label">Email Address</label>
          <input className="field-input" type="email" placeholder="arjun@email.com" value={data.email} onChange={e => onChange("email", e.target.value)} />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Age <span className="req">*</span></label>
          <input className={`field-input ${errors.age ? "error" : ""}`} type="number" min="18" max="65" placeholder="28" value={data.age} onChange={e => onChange("age", e.target.value)} />
          {errors.age && <span className="field-error">{errors.age}</span>}
        </div>
        <div className="field-group">
          <label className="field-label">Gender <span className="req">*</span></label>
          <select className={`field-select ${errors.gender ? "error" : ""}`} value={data.gender} onChange={e => onChange("gender", e.target.value)}>
            <option value="">Select gender</option>
            <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
          </select>
          {errors.gender && <span className="field-error">{errors.gender}</span>}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Blood Type <span className="req">*</span></label>
        <div className="radio-group">
          {BLOOD_TYPES.map(bt => (
            <div className="radio-pill" key={bt}>
              <input type="radio" id={`bt-${bt}`} name="bloodType" value={bt} checked={data.bloodType === bt} onChange={() => onChange("bloodType", bt)} />
              <label htmlFor={`bt-${bt}`}><span className="radio-dot" />{bt}</label>
            </div>
          ))}
        </div>
        {errors.bloodType && <span className="field-error">{errors.bloodType}</span>}
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">State <span className="req">*</span></label>
          <select className={`field-select ${errors.state ? "error" : ""}`} value={data.state} onChange={e => { onChange("state", e.target.value); onChange("city", ""); }}>
            <option value="">Select state</option>
            {STATES.map(s => <option key={s}>{s}</option>)}
          </select>
          {errors.state && <span className="field-error">{errors.state}</span>}
        </div>
        <div className="field-group">
          <label className="field-label">City <span className="req">*</span></label>
          {cities.length > 0 ? (
            <select className={`field-select ${errors.city ? "error" : ""}`} value={data.city} onChange={e => onChange("city", e.target.value)}>
              <option value="">Select city</option>
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
          ) : (
            <input className={`field-input ${errors.city ? "error" : ""}`} placeholder="Enter your city" value={data.city} onChange={e => onChange("city", e.target.value)} />
          )}
          {errors.city && <span className="field-error">{errors.city}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── STEP 2 ───────────────────────────────────────────────────────────────────
function Step2({ data, onChange, errors }: { data: FormData; onChange: (k: keyof FormData, v: any) => void; errors: Errors }) {
  const toggleDay = (day: string) => {
    const next = data.availability.includes(day) ? data.availability.filter(d => d !== day) : [...data.availability, day];
    onChange("availability", next);
  };
  return (
    <div className="form-step-enter">
      <div className="step-heading">
        <span className="step-eyebrow">Step 2 of 3</span>
        <h2 className="step-title">Medical & Availability</h2>
        <p className="step-subtitle">Help us ensure you're eligible and understand when you can donate.</p>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Last Donation Date</label>
          <input className="field-input" type="date" value={data.lastDonated} onChange={e => onChange("lastDonated", e.target.value)} style={{ colorScheme: "dark" }} />
        </div>
        <div className="field-group">
          <label className="field-label">Total Donations</label>
          <input className="field-input" type="number" min="0" placeholder="0" value={data.donationCount} onChange={e => onChange("donationCount", e.target.value)} />
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Weight (kg) <span className="req">*</span></label>
        <input className={`field-input ${errors.weight ? "error" : ""}`} type="number" min="45" placeholder="Minimum 45kg to donate" value={data.weight} onChange={e => onChange("weight", e.target.value)} style={{ maxWidth: 240 }} />
        {errors.weight && <span className="field-error">{errors.weight}</span>}
      </div>

      <div className="field-group">
        <label className="field-label">Do you have any medical conditions? <span className="req">*</span></label>
        <div className="radio-group">
          {["No", "Yes"].map(v => (
            <div className="radio-pill" key={v}>
              <input type="radio" id={`hc-${v}`} name="hasConditions" value={v} checked={data.hasConditions === v} onChange={() => onChange("hasConditions", v)} />
              <label htmlFor={`hc-${v}`}><span className="radio-dot" />{v}</label>
            </div>
          ))}
        </div>
        {errors.hasConditions && <span className="field-error">{errors.hasConditions}</span>}
      </div>

      {data.hasConditions === "Yes" && (
        <div className="field-group">
          <label className="field-label">Please describe your conditions</label>
          <textarea className="field-input" rows={3} placeholder="e.g. controlled hypertension, diabetes..." value={data.conditions} onChange={e => onChange("conditions", e.target.value)} style={{ resize: "vertical", fontFamily: "'DM Sans', sans-serif" }} />
        </div>
      )}

      <div className="field-group">
        <label className="field-label">Available Days <span className="req">*</span></label>
        <div className="pill-grid">
          {DAYS.map(d => (
            <div key={d} className={`avail-pill ${data.availability.includes(d) ? "selected" : ""}`} onClick={() => toggleDay(d)}>{d}</div>
          ))}
        </div>
        {errors.availability && <span className="field-error">{errors.availability}</span>}
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Preferred Time</label>
          <select className="field-select" value={data.preferredTime} onChange={e => onChange("preferredTime", e.target.value)}>
            <option value="">Any time</option>
            <option value="morning">Morning (6am–12pm)</option>
            <option value="afternoon">Afternoon (12pm–6pm)</option>
            <option value="evening">Evening (6pm–10pm)</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">Max Travel Distance</label>
          <select className="field-select" value={data.maxDistance} onChange={e => onChange("maxDistance", e.target.value)}>
            <option value="">Select range</option>
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="20">Within 20 km</option>
            <option value="50">Within 50 km</option>
            <option value="any">Anywhere in city</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 3 ───────────────────────────────────────────────────────────────────
function Step3({ data, onChange, errors }: { data: FormData; onChange: (k: keyof FormData, v: any) => void; errors: Errors }) {
  const consents = [
    { key: "consentShare" as keyof FormData, label: "Share with patients", body: "I consent to my <strong>blood type and general location</strong> being shared with verified Thalassemia patients and their caregivers when I am matched." },
    { key: "consentNotify" as keyof FormData, label: "Receive notifications", body: "I consent to receive <strong>WhatsApp and SMS alerts</strong> when a patient near me urgently needs my blood type." },
    { key: "consentData" as keyof FormData, label: "Data usage", body: "I understand my data is stored securely and <strong>never sold</strong>. I can withdraw consent at any time from my dashboard." },
    { key: "consentAge" as keyof FormData, label: "Age & health declaration", body: "I confirm I am <strong>between 18–65 years old</strong>, weigh above 45kg, and am in generally good health as per the information provided." },
  ];
  return (
    <div className="form-step-enter">
      <div className="step-heading">
        <span className="step-eyebrow">Step 3 of 3</span>
        <h2 className="step-title">Review & Consent</h2>
        <p className="step-subtitle">Almost there. Review your details and provide consent to complete registration.</p>
      </div>

      <div className="summary-card">
        <div className="summary-title">Your Registration Summary</div>
        <div className="summary-grid">
          <div className="summary-item"><span className="summary-key">Full Name</span><span className="summary-val">{data.firstName} {data.lastName}</span></div>
          <div className="summary-item"><span className="summary-key">Blood Type</span><span className="summary-val blood-type">{data.bloodType}</span></div>
          <div className="summary-item"><span className="summary-key">Phone</span><span className="summary-val">{data.phone}</span></div>
          <div className="summary-item"><span className="summary-key">Age / Gender</span><span className="summary-val">{data.age} / {data.gender}</span></div>
          <div className="summary-item"><span className="summary-key">Location</span><span className="summary-val">{data.city}, {data.state}</span></div>
          <div className="summary-item"><span className="summary-key">Available</span><span className="summary-val">{data.availability.join(", ") || "—"}</span></div>
        </div>
      </div>

      <div className="consent-card">
        <div className="consent-title">Consent & Declarations</div>
        <div className="consent-sub">All 4 consents required to complete registration</div>
        {consents.map((c) => (
          <div className="check-item" key={c.key as string} onClick={() => onChange(c.key, !data[c.key])}>
            <div className={`check-box ${data[c.key] ? "checked" : ""}`} style={{ cursor: "pointer" }}>
              <span className="check-tick">✓</span>
            </div>
            <span className="check-text" dangerouslySetInnerHTML={{ __html: c.body }} />
          </div>
        ))}
      </div>
      {errors.consentShare && <span className="field-error" style={{ marginBottom: 8, display: "block" }}>{errors.consentShare}</span>}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function DonorRegisterPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [donorId, setDonorId] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", phone: "", email: "",
    age: "", gender: "", bloodType: "", state: "", city: "",
    lastDonated: "", donationCount: "", weight: "",
    hasConditions: "", conditions: "",
    availability: [], preferredTime: "", maxDistance: "",
    consentShare: false, consentNotify: false, consentData: false, consentAge: false,
  });

  const set = (k: keyof FormData, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const ne = { ...e }; delete ne[k]; return ne; });
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const validate1 = (): boolean => {
    const errs: Errors = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.phone.match(/^[+]?[\d\s\-()]{8,15}$/)) errs.phone = "Enter a valid phone number";
    const age = parseInt(form.age);
    if (!form.age || isNaN(age) || age < 18 || age > 65) errs.age = "Age must be 18–65";
    if (!form.gender) errs.gender = "Please select gender";
    if (!form.bloodType) errs.bloodType = "Please select your blood type";
    if (!form.state) errs.state = "Please select your state";
    if (!form.city.trim()) errs.city = "Please enter your city";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validate2 = (): boolean => {
    const errs: Errors = {};
    const w = parseFloat(form.weight);
    if (!form.weight || isNaN(w) || w < 45) errs.weight = "Minimum weight to donate is 45kg";
    if (!form.hasConditions) errs.hasConditions = "Please answer this question";
    if (form.availability.length === 0) errs.availability = "Please select at least one available day";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validate3 = (): boolean => {
    if (!form.consentShare || !form.consentNotify || !form.consentData || !form.consentAge) {
      setErrors({ consentShare: "All 4 consents are required to register" });
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    const valid = step === 1 ? validate1() : step === 2 ? validate2() : false;
    if (valid) { setStep(s => s + 1); setTimeout(scrollToForm, 50); }
  };

  const handleSubmit = async () => {
    if (!validate3()) return;
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1800));
    const id = `RKD-${form.bloodType}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    setDonorId(id);
    setLoading(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextSteps = [
    { n: "01", title: "Verification SMS", body: "You'll receive a WhatsApp message to verify your number within 5 minutes." },
    { n: "02", title: "Profile Review", body: "Our team reviews your medical details within 24 hours." },
    { n: "03", title: "First Match", body: "When a patient needs your blood type nearby, you get an instant alert." },
    { n: "04", title: "You Save a Life", body: "Coordinate, donate, and become a lifeline for a Thalassemia patient." },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── TOP BAR ── */}
      <header className="topbar">
        <a href="/" className="logo-wrap">
          <Shield size={28} />
          <span className="logo-text"><span className="r">Raksha</span><span className="a">AI</span></span>
        </a>
        {!submitted && <ProgressBar step={step} />}
        <div className="topbar-right">
          Already registered? <a href="/login">Sign in</a>
        </div>
      </header>

      {/* ── SUCCESS SCREEN ── */}
      {submitted ? (
        <div className="success-screen grain">
          <div className="success-shield">
            <Shield size={64} />
          </div>
          <div className="success-check-wrap">
            <div className="success-check">✓</div>
          </div>
          <h2 className="success-h2">You're registered,<br />{form.firstName}.</h2>
          <p className="success-sub">
            Welcome to the Raksha AI donor network. Your profile is under review. You'll receive a WhatsApp confirmation shortly.
          </p>
          <div className="success-id">Donor ID: {donorId}</div>
          <div className="success-ctas">
            <a href="/dashboard" className="btn-teal">Go to Dashboard</a>
            <a href="/" className="btn-outline-sm">Back to Home</a>
          </div>
        </div>
      ) : (
        <>
          {/* ── FORM + SIDEBAR ── */}
          <div className="page-body grain" ref={formRef}>
            {/* FORM */}
            <div className="form-panel">
              {step === 1 && <Step1 data={form} onChange={set} errors={errors} />}
              {step === 2 && <Step2 data={form} onChange={set} errors={errors} />}
              {step === 3 && <Step3 data={form} onChange={set} errors={errors} />}

              {step < 3 ? (
                <>
                  <button className="btn-continue" onClick={handleContinue}>
                    Continue <span style={{ fontSize: "1rem" }}>→</span>
                  </button>
                  {step > 1 && (
                    <button className="btn-back" onClick={() => { setStep(s => s - 1); setErrors({}); setTimeout(scrollToForm, 50); }}>
                      ← Back
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
                    {loading ? <><span className="spinner" /> Submitting…</> : <>Complete Registration →</>}
                  </button>
                  <button className="btn-back" onClick={() => { setStep(2); setErrors({}); setTimeout(scrollToForm, 50); }}>
                    ← Back to Step 2
                  </button>
                </>
              )}
            </div>

            {/* SIDEBAR */}
            <Sidebar step={step} />
          </div>

          {/* ── WHAT HAPPENS NEXT ── */}
          <section className="next-section">
            <div className="next-inner">
              <div className="next-title-wrap">
                <span className="next-label">After You Register</span>
                <h2 className="next-h2">What happens next</h2>
              </div>
              <div className="next-steps">
                {nextSteps.map(s => (
                  <div className="next-step" key={s.n}>
                    <div className="next-step-circle">{s.n}</div>
                    <div className="next-step-title">{s.title}</div>
                    <p className="next-step-body">{s.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── BOTTOM REASSURANCE BAR ── */}
      <div className="bottom-bar">
        <span className="bottom-bar-text">Questions? We're here to help.</span>
        <ul className="bottom-bar-links">
          <li>WhatsApp: <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer">+91 98765 43210</a></li>
          <li>Email: <a href="mailto:support@raksha.ai">support@raksha.ai</a></li>
          <li><span className="bottom-bar-phone">Helpline: 1800-RAKSHA</span></li>
        </ul>
      </div>
    </>
  );
}