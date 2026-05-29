<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Patient Registration — Raksha AI</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

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
    --surface:           #111827;
    --surface-input:     #1e293b;
    --border-subtle:     rgba(139,26,42,0.3);
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--raksha-deep);
    color: var(--raksha-white);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  /* Grain overlay */
  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 9999; opacity: 0.35;
  }

  /* ─── HEADER ─── */
  .site-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(10,22,40,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-subtle);
    padding: 0 2rem;
    height: 60px;
    display: flex; align-items: center; justify-content: space-between;
  }

  .logo {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none;
  }
  .logo-text { display: flex; align-items: baseline; gap: 0; }
  .logo-raksha { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 1.35rem; color: #FAF9F7; letter-spacing: 0.02em; }
  .logo-ai { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 1.35rem; color: var(--raksha-teal); }

  .header-right { display: flex; align-items: center; gap: 1.5rem; }
  .header-link { font-size: 0.8rem; color: var(--raksha-muted); text-decoration: none; letter-spacing: 0.05em; transition: color 0.2s; }
  .header-link:hover { color: var(--raksha-white); }
  .header-tag { font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; color: var(--raksha-coral); background: rgba(232,137,122,0.1); border: 1px solid rgba(232,137,122,0.25); padding: 3px 10px; border-radius: 2px; letter-spacing: 0.08em; }

  /* ─── PROGRESS BAR SECTION ─── */
  .progress-section {
    background: var(--raksha-navy);
    border-bottom: 1px solid var(--border-subtle);
    padding: 1.5rem 2rem;
  }

  .progress-inner {
    max-width: 900px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    position: relative;
  }

  .progress-line {
    position: absolute;
    top: 20px; left: 20px; right: 20px;
    height: 1px; background: rgba(255,255,255,0.1);
    z-index: 0;
  }
  .progress-line-fill {
    height: 100%;
    background: var(--raksha-teal);
    transition: width 0.6s ease;
  }

  .progress-step {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    position: relative; z-index: 1;
  }

  .step-circle {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 500;
    border: 1.5px solid rgba(255,255,255,0.15);
    background: var(--surface);
    transition: all 0.4s ease;
  }
  .step-circle.complete { background: var(--raksha-teal); border-color: var(--raksha-teal); color: white; }
  .step-circle.active { background: var(--raksha-blood); border-color: var(--raksha-blood); color: white; }
  .step-circle.pending { color: var(--raksha-muted); }

  .step-label {
    font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--raksha-muted); white-space: nowrap;
  }
  .step-label.active { color: var(--raksha-white); }
  .step-label.complete { color: var(--raksha-teal); }

  /* ─── MAIN LAYOUT ─── */
  .main-wrapper {
    max-width: 1180px; margin: 0 auto;
    padding: 3rem 2rem 4rem;
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 3rem;
    align-items: start;
  }

  /* ─── FORM SIDE ─── */
  .form-col {}

  .form-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.8rem, 3vw, 2.4rem);
    font-weight: 600;
    color: var(--raksha-white);
    line-height: 1.2;
    margin-bottom: 0.4rem;
  }
  .form-heading em { color: var(--raksha-coral); font-style: italic; }

  .form-sub {
    font-size: 0.85rem; color: var(--raksha-muted);
    margin-bottom: 2.5rem; line-height: 1.6;
  }

  /* Step tabs */
  .step-tabs {
    display: flex; gap: 0;
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: 2rem;
  }
  .step-tab {
    font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--raksha-muted); padding: 0.6rem 1.2rem;
    border: none; background: none; cursor: pointer;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
    transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .step-tab.active { color: var(--raksha-blood); border-bottom-color: var(--raksha-blood); }
  .step-tab.done { color: var(--raksha-teal); }

  /* Form steps */
  .form-step { display: none; animation: fadeUp 0.35s ease; }
  .form-step.active { display: block; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .step-intro {
    font-family: 'DM Sans', sans-serif; font-weight: 300;
    font-size: 0.95rem; color: var(--raksha-coral);
    margin-bottom: 1.75rem; line-height: 1.55;
  }

  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  .field-row.single { grid-template-columns: 1fr; }
  .field-row.triple { grid-template-columns: 1fr 1fr 1fr; }

  .field-group { display: flex; flex-direction: column; gap: 6px; }
  .field-label {
    font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--raksha-muted); font-weight: 500;
  }
  .field-label span { color: var(--raksha-blood); margin-left: 2px; }

  .field-input, .field-select, .field-textarea {
    background: var(--surface-input);
    border: 1px solid rgba(255,255,255,0.08);
    color: var(--raksha-white);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    padding: 0.7rem 0.9rem;
    border-radius: 6px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  .field-input::placeholder, .field-select option:first-child { color: rgba(107,114,128,0.8); }
  .field-input:focus, .field-select:focus, .field-textarea:focus {
    border-color: var(--raksha-blood);
    box-shadow: 0 0 0 3px rgba(192,21,42,0.12);
  }
  .field-select { cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; padding-right: 2rem;
  }
  .field-select option { background: #1e293b; }
  .field-textarea { resize: vertical; min-height: 90px; }

  /* Checkbox group */
  .checkbox-group { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 4px; }
  .checkbox-item {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface-input); border: 1px solid rgba(255,255,255,0.08);
    padding: 0.5rem 0.85rem; border-radius: 4px; cursor: pointer;
    font-size: 0.82rem; transition: all 0.2s; user-select: none;
  }
  .checkbox-item input[type="checkbox"] { display: none; }
  .checkbox-box {
    width: 16px; height: 16px; border-radius: 3px;
    border: 1.5px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.2s;
  }
  .checkbox-item input:checked ~ .checkbox-box { background: var(--raksha-teal); border-color: var(--raksha-teal); }
  .checkbox-item input:checked ~ .checkbox-box::after {
    content: '✓'; font-size: 10px; color: white; font-weight: 700;
  }
  .checkbox-item:hover { border-color: rgba(44,168,160,0.4); }

  /* Radio group */
  .radio-group { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 4px; }
  .radio-item {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface-input); border: 1px solid rgba(255,255,255,0.08);
    padding: 0.5rem 0.85rem; border-radius: 4px; cursor: pointer;
    font-size: 0.82rem; transition: all 0.2s;
  }
  .radio-item input[type="radio"] { display: none; }
  .radio-dot {
    width: 14px; height: 14px; border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.25);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.2s;
  }
  .radio-item input:checked ~ .radio-dot { border-color: var(--raksha-teal); }
  .radio-item input:checked ~ .radio-dot::after {
    content: ''; display: block; width: 7px; height: 7px; border-radius: 50%; background: var(--raksha-teal);
  }
  .radio-item:hover { border-color: rgba(44,168,160,0.3); }

  /* Form navigation buttons */
  .form-nav {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 2rem; padding-top: 1.5rem;
    border-top: 1px solid var(--border-subtle);
  }

  .btn-primary {
    background: var(--raksha-blood); color: white;
    border: none; padding: 0.75rem 2rem;
    font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
    font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer; border-radius: 0; transition: all 0.2s;
  }
  .btn-primary:hover { background: #a01020; transform: translateY(-1px); }

  .btn-secondary {
    background: transparent; color: var(--raksha-white);
    border: 1px solid rgba(255,255,255,0.2); padding: 0.75rem 1.5rem;
    font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
    cursor: pointer; border-radius: 0; transition: all 0.2s; letter-spacing: 0.04em;
  }
  .btn-secondary:hover { border-color: rgba(255,255,255,0.5); }

  /* ─── SUCCESS SCREEN ─── */
  .success-screen {
    display: none; text-align: center; padding: 2rem 1rem 3rem;
    animation: fadeUp 0.5s ease;
  }
  .success-screen.visible { display: block; }

  .success-shield {
    margin: 0 auto 1.5rem;
    animation: shieldPulse 2s ease-in-out infinite;
  }
  @keyframes shieldPulse {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(139,26,42,0.4)); }
    50% { transform: scale(1.06); filter: drop-shadow(0 0 18px rgba(192,21,42,0.6)); }
  }

  .success-title {
    font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600;
    color: var(--raksha-white); margin-bottom: 0.5rem;
  }
  .success-sub { font-size: 0.9rem; color: var(--raksha-muted); margin-bottom: 1.75rem; line-height: 1.6; }

  .success-checks { display: flex; flex-direction: column; gap: 0.75rem; text-align: left; max-width: 380px; margin: 0 auto 2rem; }
  .success-check {
    display: flex; align-items: center; gap: 10px;
    background: rgba(44,168,160,0.06); border: 1px solid rgba(44,168,160,0.2);
    padding: 0.7rem 1rem; border-radius: 6px;
    font-size: 0.85rem;
  }
  .success-check-icon { color: var(--raksha-teal); font-size: 1rem; font-weight: 700; }
  .success-id {
    font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;
    color: var(--raksha-muted); letter-spacing: 0.1em;
    background: var(--surface-input); border: 1px solid var(--border-subtle);
    padding: 0.4rem 0.9rem; display: inline-block; margin-top: 0.5rem;
  }

  /* ─── SIDEBAR ─── */
  .sidebar-col { position: sticky; top: 80px; }

  .sidebar-quote {
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }
  .quote-text {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-size: 1.15rem; font-weight: 600; color: var(--raksha-warm);
    line-height: 1.5; margin-bottom: 1rem;
  }
  .quote-attr { font-size: 0.75rem; color: var(--raksha-muted); letter-spacing: 0.05em; }

  .sidebar-badges {
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 8px; padding: 1.25rem;
    margin-bottom: 1rem;
  }
  .sidebar-badges-title {
    font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--raksha-muted); margin-bottom: 0.9rem; font-weight: 500;
  }
  .badge-item {
    display: flex; align-items: center; gap: 10px;
    font-size: 0.82rem; color: var(--raksha-white);
    padding: 0.45rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);
    line-height: 1.4;
  }
  .badge-item:last-child { border-bottom: none; }
  .badge-check {
    width: 20px; height: 20px; border-radius: 50%;
    background: #22C55E; display: flex; align-items: center; justify-content: center;
    font-size: 0.65rem; color: white; font-weight: 700; flex-shrink: 0;
  }

  .sidebar-emergency {
    background: var(--raksha-blood);
    border-radius: 8px; padding: 1.25rem;
    margin-bottom: 1rem;
    animation: emergencyPulse 2.5s ease-in-out infinite;
    position: relative;
  }
  @keyframes emergencyPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(192,21,42,0.4); }
    50% { box-shadow: 0 0 0 6px rgba(192,21,42,0); }
  }
  .emergency-label {
    font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase;
    color: rgba(250,249,247,0.7); margin-bottom: 0.4rem; font-weight: 600;
  }
  .emergency-title {
    font-size: 0.92rem; font-weight: 600; color: var(--raksha-white);
    margin-bottom: 0.4rem; line-height: 1.3;
  }
  .emergency-number {
    font-family: 'JetBrains Mono', monospace; font-size: 1.05rem;
    color: var(--raksha-white); letter-spacing: 0.05em;
  }
  .emergency-sub { font-size: 0.73rem; color: rgba(250,249,247,0.7); margin-top: 4px; }

  .sidebar-family-quote {
    background: var(--surface);
    border-left: 3px solid var(--raksha-coral);
    border-radius: 0 8px 8px 0;
    padding: 1rem 1.25rem;
  }
  .family-quote-text {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-size: 0.95rem; color: var(--raksha-warm); line-height: 1.55;
  }
  .family-quote-by { font-size: 0.72rem; color: var(--raksha-muted); margin-top: 0.5rem; letter-spacing: 0.04em; }

  /* ─── WHAT HAPPENS AFTER ─── */
  .after-section {
    background: var(--raksha-navy);
    border-top: 1px solid var(--raksha-wine);
    padding: 4rem 2rem;
  }
  .after-inner { max-width: 900px; margin: 0 auto; }
  .section-eyebrow {
    font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--raksha-crimson); margin-bottom: 0.75rem; font-weight: 500;
  }
  .section-title {
    font-family: 'Cormorant Garamond', serif; font-size: clamp(1.6rem, 3vw, 2rem);
    font-weight: 600; color: var(--raksha-white); margin-bottom: 2.5rem; line-height: 1.2;
  }
  .section-title em { color: var(--raksha-coral); font-style: italic; }

  .after-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; position: relative; }

  .after-steps::before {
    content: '';
    position: absolute;
    top: 20px; left: 24px; right: 24px; height: 1px;
    background: linear-gradient(to right, var(--raksha-teal) 0%, rgba(44,168,160,0.3) 100%);
    z-index: 0;
  }

  .after-step { position: relative; z-index: 1; }
  .after-step-num {
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--raksha-teal); color: white;
    display: flex; align-items: center; justify-content: center;
    font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 500;
    margin-bottom: 1rem;
  }
  .after-step-title { font-size: 0.88rem; font-weight: 600; color: var(--raksha-white); margin-bottom: 0.4rem; }
  .after-step-body { font-size: 0.8rem; color: var(--raksha-muted); line-height: 1.55; }

  /* ─── SUPPORT LINE ─── */
  .support-bar {
    background: var(--raksha-deep);
    border-top: 1px solid var(--border-subtle);
    padding: 1.2rem 2rem;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 0.75rem;
  }
  .support-bar-left { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; }
  .support-label { font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--raksha-muted); }
  .support-phone {
    font-family: 'JetBrains Mono', monospace; font-size: 0.9rem;
    color: var(--raksha-white); display: flex; align-items: center; gap: 6px;
  }
  .support-phone-dot { width: 7px; height: 7px; border-radius: 50%; background: #22C55E; animation: blink 1.8s ease-in-out infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .support-lang { font-size: 0.75rem; color: var(--raksha-muted); }
  .support-bar-right { font-size: 0.72rem; color: var(--raksha-muted); letter-spacing: 0.04em; }

  /* Field hint */
  .field-hint { font-size: 0.72rem; color: var(--raksha-muted); margin-top: 4px; line-height: 1.4; }

  /* Info stripe */
  .info-stripe {
    background: rgba(44,168,160,0.06); border: 1px solid rgba(44,168,160,0.2);
    border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 1.25rem;
    font-size: 0.8rem; color: rgba(250,249,247,0.7); line-height: 1.5;
    display: flex; align-items: flex-start; gap: 8px;
  }
  .info-stripe-icon { color: var(--raksha-teal); font-size: 0.9rem; flex-shrink: 0; margin-top: 1px; }

  /* Consent block */
  .consent-block {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 6px; padding: 1rem 1.1rem; margin-bottom: 1rem;
  }

  /* ─── RESPONSIVE ─── */
  @media (max-width: 860px) {
    .main-wrapper { grid-template-columns: 1fr; }
    .sidebar-col { position: static; }
    .after-steps { grid-template-columns: repeat(2, 1fr); }
    .after-steps::before { display: none; }
    .field-row.triple { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 560px) {
    .main-wrapper { padding: 2rem 1rem 3rem; }
    .field-row { grid-template-columns: 1fr; }
    .field-row.triple { grid-template-columns: 1fr; }
    .after-steps { grid-template-columns: 1fr; }
    .progress-inner { gap: 0.25rem; }
    .step-label { display: none; }
    .support-bar { flex-direction: column; align-items: flex-start; }
  }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════ HEADER ═══════════════════════════════════════ -->
<header class="site-header">
  <a href="/" class="logo">
    <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="33">
      <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A"/>
      <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95"/>
      <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </svg>
    <div class="logo-text">
      <span class="logo-raksha">Raksha</span><span class="logo-ai">AI</span>
    </div>
  </a>
  <div class="header-right">
    <a href="/login" class="header-link">Sign In</a>
    <span class="header-tag">PATIENT PORTAL</span>
  </div>
</header>

<!-- ═══════════════════════════════════════ PROGRESS BAR ═══════════════════════════════════════ -->
<section class="progress-section">
  <div class="progress-inner">
    <div class="progress-line">
      <div class="progress-line-fill" id="progressFill" style="width:50%"></div>
    </div>

    <div class="progress-step">
      <div class="step-circle complete" id="pStep1">✓</div>
      <div class="step-label complete">Verify</div>
    </div>
    <div class="progress-step">
      <div class="step-circle active" id="pStep2">2</div>
      <div class="step-label active">Register</div>
    </div>
    <div class="progress-step">
      <div class="step-circle pending" id="pStep3">3</div>
      <div class="step-label">Confirm</div>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════ MAIN FORM + SIDEBAR ═══════════════════════════════════════ -->
<div class="main-wrapper">

  <!-- FORM COLUMN -->
  <div class="form-col">

    <h1 class="form-heading">Register your <em>loved one</em></h1>
    <p class="form-sub">Complete the three steps below. It takes about 4 minutes. Our care coordinators review every profile within 2 hours.</p>

    <!-- Step tabs -->
    <div class="step-tabs">
      <button class="step-tab active" id="tab1" onclick="goToFormStep(1)">01 — Patient Info</button>
      <button class="step-tab" id="tab2" onclick="goToFormStep(2)">02 — Medical Details</button>
      <button class="step-tab" id="tab3" onclick="goToFormStep(3)">03 — Care Preferences</button>
    </div>

    <!-- ──── STEP 1: Patient Info ──── -->
    <div class="form-step active" id="formStep1">
      <p class="step-intro">Let's begin with who this profile is for. Your answers help us build the most accurate care and donor match for them.</p>

      <div class="field-row">
        <div class="field-group">
          <label class="field-label">First Name <span>*</span></label>
          <input class="field-input" type="text" placeholder="e.g. Arjun" id="firstName"/>
        </div>
        <div class="field-group">
          <label class="field-label">Last Name <span>*</span></label>
          <input class="field-input" type="text" placeholder="e.g. Sharma"/>
        </div>
      </div>

      <div class="field-row triple">
        <div class="field-group">
          <label class="field-label">Date of Birth <span>*</span></label>
          <input class="field-input" type="date"/>
        </div>
        <div class="field-group">
          <label class="field-label">Gender</label>
          <select class="field-select">
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Blood Group <span>*</span></label>
          <select class="field-select" id="bloodGroup">
            <option value="">Select</option>
            <option>A+</option><option>A−</option>
            <option>B+</option><option>B−</option>
            <option>AB+</option><option>AB−</option>
            <option>O+</option><option>O−</option>
          </select>
        </div>
      </div>

      <div class="field-row">
        <div class="field-group">
          <label class="field-label">City / District <span>*</span></label>
          <input class="field-input" type="text" placeholder="e.g. Hyderabad"/>
        </div>
        <div class="field-group">
          <label class="field-label">State <span>*</span></label>
          <select class="field-select">
            <option value="">Select state</option>
            <option>Telangana</option><option>Andhra Pradesh</option>
            <option>Maharashtra</option><option>Karnataka</option>
            <option>Tamil Nadu</option><option>Gujarat</option>
            <option>Delhi</option><option>West Bengal</option>
            <option>Rajasthan</option><option>Other</option>
          </select>
        </div>
      </div>

      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Registered Hospital / Centre <span>*</span></label>
          <input class="field-input" type="text" placeholder="Name of treating hospital"/>
        </div>
        <div class="field-group">
          <label class="field-label">Your Relation to Patient</label>
          <select class="field-select">
            <option value="">Select</option>
            <option>Parent</option><option>Sibling</option>
            <option>Spouse</option><option>Child</option>
            <option>Self</option><option>Other caregiver</option>
          </select>
        </div>
      </div>

      <div class="field-row single">
        <div class="field-group">
          <label class="field-label">Contact Mobile (Caregiver) <span>*</span></label>
          <input class="field-input" type="tel" placeholder="+91 XXXXX XXXXX"/>
          <span class="field-hint">We'll send critical donor alerts to this number. WhatsApp preferred.</span>
        </div>
      </div>

      <div class="form-nav">
        <div></div>
        <button class="btn-primary" onclick="nextStep(1)">Continue to Medical Details →</button>
      </div>
    </div>

    <!-- ──── STEP 2: Medical Details ──── -->
    <div class="form-step" id="formStep2">
      <p class="step-intro">Medical details help us build the right donor match and ensure your care coordinator understands the urgency and frequency of need.</p>

      <div class="info-stripe">
        <span class="info-stripe-icon">ℹ</span>
        All medical information is encrypted and only accessible to your assigned care coordinator and treating hospital.
      </div>

      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Thalassemia Type <span>*</span></label>
          <select class="field-select">
            <option value="">Select type</option>
            <option>Beta Thalassemia Major</option>
            <option>Beta Thalassemia Intermedia</option>
            <option>Alpha Thalassemia</option>
            <option>Sickle Cell Thalassemia</option>
            <option>Other / Not confirmed</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Transfusion Frequency <span>*</span></label>
          <select class="field-select">
            <option value="">Select</option>
            <option>Every 2 weeks</option>
            <option>Every 3 weeks</option>
            <option>Every 4 weeks</option>
            <option>Monthly (approx.)</option>
            <option>On demand / irregular</option>
          </select>
        </div>
      </div>

      <div class="field-row triple">
        <div class="field-group">
          <label class="field-label">Units per Transfusion</label>
          <input class="field-input" type="number" placeholder="e.g. 2" min="1" max="10"/>
        </div>
        <div class="field-group">
          <label class="field-label">Last Transfusion Date</label>
          <input class="field-input" type="date"/>
        </div>
        <div class="field-group">
          <label class="field-label">Next Due Date (approx.)</label>
          <input class="field-input" type="date"/>
        </div>
      </div>

      <div class="field-row single">
        <div class="field-group">
          <label class="field-label">Chelation Therapy</label>
          <div class="radio-group">
            <label class="radio-item"><input type="radio" name="chelation" value="yes"/><span class="radio-dot"></span> Yes — ongoing</label>
            <label class="radio-item"><input type="radio" name="chelation" value="no"/><span class="radio-dot"></span> No</label>
            <label class="radio-item"><input type="radio" name="chelation" value="past"/><span class="radio-dot"></span> Past, stopped</label>
          </div>
        </div>
      </div>

      <div class="field-row single">
        <div class="field-group">
          <label class="field-label">Comorbidities or Complications</label>
          <div class="checkbox-group">
            <label class="checkbox-item"><input type="checkbox"/><span class="checkbox-box"></span> Splenomegaly</label>
            <label class="checkbox-item"><input type="checkbox"/><span class="checkbox-box"></span> Hepatomegaly</label>
            <label class="checkbox-item"><input type="checkbox"/><span class="checkbox-box"></span> Cardiac issues</label>
            <label class="checkbox-item"><input type="checkbox"/><span class="checkbox-box"></span> Diabetes</label>
            <label class="checkbox-item"><input type="checkbox"/><span class="checkbox-box"></span> Growth delay</label>
            <label class="checkbox-item"><input type="checkbox"/><span class="checkbox-box"></span> Bone disease</label>
            <label class="checkbox-item"><input type="checkbox"/><span class="checkbox-box"></span> None</label>
          </div>
        </div>
      </div>

      <div class="field-row single">
        <div class="field-group">
          <label class="field-label">Any special requirements or notes</label>
          <textarea class="field-textarea" placeholder="e.g. Patient has rare antibody — requires special cross-matching. Family has limited mobility for hospital visits."></textarea>
          <span class="field-hint">Include anything that helps donors or coordinators understand care needs better.</span>
        </div>
      </div>

      <div class="form-nav">
        <button class="btn-secondary" onclick="prevStep(2)">← Back</button>
        <button class="btn-primary" onclick="nextStep(2)">Continue to Care Preferences →</button>
      </div>
    </div>

    <!-- ──── STEP 3: Care Preferences ──── -->
    <div class="form-step" id="formStep3">
      <p class="step-intro">Almost done. Tell us how you'd like Raksha AI to support you — so we can personalize every alert, match, and update to your situation.</p>

      <div class="field-row single">
        <div class="field-group">
          <label class="field-label">Preferred Notification Channel <span>*</span></label>
          <div class="checkbox-group">
            <label class="checkbox-item"><input type="checkbox" checked/><span class="checkbox-box"></span> WhatsApp</label>
            <label class="checkbox-item"><input type="checkbox"/><span class="checkbox-box"></span> SMS</label>
            <label class="checkbox-item"><input type="checkbox"/><span class="checkbox-box"></span> Call</label>
            <label class="checkbox-item"><input type="checkbox"/><span class="checkbox-box"></span> Email</label>
            <label class="checkbox-item"><input type="checkbox"/><span class="checkbox-box"></span> App notification</label>
          </div>
        </div>
      </div>

      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Preferred Language for Alerts</label>
          <select class="field-select">
            <option>English</option>
            <option>Hindi</option>
            <option>Telugu</option>
            <option>Tamil</option>
            <option>Marathi</option>
            <option>Bengali</option>
            <option>Gujarati</option>
            <option>Kannada</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Alert Urgency Threshold</label>
          <select class="field-select">
            <option>All alerts (recommended)</option>
            <option>Only critical/urgent</option>
            <option>Daily digest</option>
          </select>
        </div>
      </div>

      <div class="field-row single">
        <div class="field-group">
          <label class="field-label">Alternate Caregiver Contact</label>
          <input class="field-input" type="tel" placeholder="+91 XXXXX XXXXX (optional backup contact)"/>
        </div>
      </div>

      <div class="field-row single">
        <div class="field-group">
          <label class="field-label">How did you hear about Raksha AI?</label>
          <select class="field-select">
            <option value="">Select</option>
            <option>Doctor / Hospital</option>
            <option>Thalassemia society</option>
            <option>Another family</option>
            <option>Social media</option>
            <option>News / Article</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div class="consent-block">
        <label class="checkbox-item" style="background:none;border:none;padding:0;">
          <input type="checkbox" id="consentCheck"/>
          <span class="checkbox-box"></span>
          <span style="font-size:0.82rem; color: rgba(250,249,247,0.75); line-height:1.5;">
            I consent to Raksha AI storing this medical profile, sharing anonymised data with verified donors and care coordinators, and sending alerts on donor availability. I understand I may withdraw consent at any time.
          </span>
        </label>
      </div>

      <div class="form-nav">
        <button class="btn-secondary" onclick="prevStep(3)">← Back</button>
        <button class="btn-primary" onclick="submitForm()" style="background:var(--raksha-teal);">Complete Registration ✓</button>
      </div>
    </div>

    <!-- ──── SUCCESS SCREEN ──── -->
    <div class="success-screen" id="successScreen">
      <div class="success-shield">
        <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="84">
          <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A"/>
          <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95"/>
          <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" stroke-width="1.8" stroke-linecap="round" fill="none"/>
          <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        </svg>
      </div>

      <h2 class="success-title">You're now protected.</h2>
      <p class="success-sub">Registration received. A care coordinator will reach you within 2 hours to confirm details and begin building the donor circle.</p>

      <div class="success-checks">
        <div class="success-check">
          <span class="success-check-icon" style="color:var(--raksha-teal)">✓</span>
          We're building their donor circle
        </div>
        <div class="success-check">
          <span class="success-check-icon" style="color:var(--raksha-teal)">✓</span>
          AI match initiated — donors within 15km notified
        </div>
        <div class="success-check">
          <span class="success-check-icon" style="color:var(--raksha-teal)">✓</span>
          Care coordinator assigned to your profile
        </div>
        <div class="success-check">
          <span class="success-check-icon" style="color:var(--raksha-teal)">✓</span>
          Alerts configured on your preferred channels
        </div>
      </div>

      <div class="success-id" id="successId">PATIENT ID: RAK-2024-XXXXX</div>
      <br/>
      <button class="btn-primary" style="margin-top:1.25rem;" onclick="window.location.href='/dashboard'">Go to Patient Dashboard →</button>
    </div>
  </div>

  <!-- SIDEBAR COLUMN -->
  <div class="sidebar-col">

    <div class="sidebar-quote">
      <div class="quote-text">"You're not doing this alone anymore."</div>
      <div class="quote-attr">— Raksha AI Care Coordination Team</div>
    </div>

    <div class="sidebar-badges">
      <div class="sidebar-badges-title">What you get after registering</div>
      <div class="badge-item"><span class="badge-check">✓</span> Dedicated care coordinator assigned</div>
      <div class="badge-item"><span class="badge-check">✓</span> AI-matched donor alerts within hours</div>
      <div class="badge-item"><span class="badge-check">✓</span> 24/7 blood availability monitoring</div>
      <div class="badge-item"><span class="badge-check">✓</span> Pre-transfusion checklist & reminders</div>
      <div class="badge-item"><span class="badge-check">✓</span> Secure medical profile — always accessible</div>
      <div class="badge-item"><span class="badge-check">✓</span> Family notification system</div>
    </div>

    <div class="sidebar-emergency">
      <div class="emergency-label">Emergency Support</div>
      <div class="emergency-title">Need blood urgently right now?</div>
      <div class="emergency-number">1800 - RAKSHA</div>
      <div class="emergency-sub">Toll-free · 24 / 7 · All India</div>
    </div>

    <div class="sidebar-family-quote">
      <div class="family-quote-text">"Before Raksha AI, every transfusion was a 3-day panic. Now we get a WhatsApp the night before. My son just sleeps."</div>
      <div class="family-quote-by">— Meenakshi R., mother of a 9-year-old patient, Chennai</div>
    </div>

  </div>
</div>

<!-- ═══════════════════════════════════════ WHAT HAPPENS AFTER ═══════════════════════════════════════ -->
<section class="after-section">
  <div class="after-inner">
    <div class="section-eyebrow">After Registration</div>
    <h2 class="section-title">What happens <em>next</em></h2>

    <div class="after-steps">
      <div class="after-step">
        <div class="after-step-num">1</div>
        <div class="after-step-title">Profile Review (2 hrs)</div>
        <div class="after-step-body">Our care team verifies medical details and flags any urgent requirements before activating matching.</div>
      </div>
      <div class="after-step">
        <div class="after-step-num">2</div>
        <div class="after-step-title">Donor Circle Built</div>
        <div class="after-step-body">AI scans our verified donor network by blood group, location, and availability. Initial matches sent within 4 hours.</div>
      </div>
      <div class="after-step">
        <div class="after-step-num">3</div>
        <div class="after-step-title">Coordinator Connects</div>
        <div class="after-step-body">Your assigned coordinator calls or WhatsApps to confirm profile accuracy and walk you through the dashboard.</div>
      </div>
      <div class="after-step">
        <div class="after-step-num">4</div>
        <div class="after-step-title">Alerts Go Live</div>
        <div class="after-step-body">From your next transfusion cycle, alerts land 72 hours in advance. No more last-minute searches.</div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════ SUPPORT BAR ═══════════════════════════════════════ -->
<div class="support-bar">
  <div class="support-bar-left">
    <span class="support-label">Help Line</span>
    <span class="support-phone"><span class="support-phone-dot"></span>1800 - RAKSHA (toll-free)</span>
    <span class="support-lang">Available in English, Hindi, Telugu, Tamil, Marathi</span>
  </div>
  <div class="support-bar-right">© 2024 Raksha AI · Blood Intelligence & Care Coordination</div>
</div>

<script>
  let currentStep = 1;

  function goToFormStep(n) {
    if (n > currentStep) return; // can't jump ahead without completing
    switchStep(n);
  }

  function nextStep(from) {
    if (!validateStep(from)) return;
    switchStep(from + 1);
  }

  function prevStep(from) {
    switchStep(from - 1);
  }

  function switchStep(n) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    // Update tabs
    document.querySelectorAll('.step-tab').forEach((t, i) => {
      t.classList.remove('active', 'done');
      if (i + 1 < n) t.classList.add('done');
      if (i + 1 === n) t.classList.add('active');
    });

    currentStep = n;
    document.getElementById('formStep' + n)?.classList.add('active');

    // Update top progress bar
    const fills = [0, 50, 75, 100];
    document.getElementById('progressFill').style.width = fills[n] + '%';

    // Update step circles
    const circles = [1,2,3];
    circles.forEach(c => {
      const el = document.getElementById('pStep' + c);
      el.classList.remove('complete','active');
      if (c < n) { el.classList.add('complete'); el.textContent = '✓'; }
      else if (c === n) { el.classList.add('active'); el.textContent = c; }
      else { el.textContent = c; }
      // labels
      const label = el.nextElementSibling;
      label.classList.remove('complete','active');
      if (c < n) label.classList.add('complete');
      else if (c === n) label.classList.add('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateStep(n) {
    // Minimal validation: check required fields
    if (n === 1) {
      const firstName = document.getElementById('firstName').value.trim();
      const bloodGroup = document.getElementById('bloodGroup').value;
      if (!firstName) { alert('Please enter the patient\'s first name.'); return false; }
      if (!bloodGroup) { alert('Please select a blood group.'); return false; }
    }
    if (n === 3) {
      const consent = document.getElementById('consentCheck').checked;
      if (!consent) { alert('Please accept the consent declaration to proceed.'); return false; }
    }
    return true;
  }

  function submitForm() {
    if (!validateStep(3)) return;

    // Generate mock patient ID
    const id = 'RAK-2024-' + Math.floor(10000 + Math.random() * 89999);
    document.getElementById('successId').textContent = 'PATIENT ID: ' + id;

    // Hide form steps and tabs
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step-tab').forEach(t => { t.classList.remove('active','done'); t.classList.add('done'); });

    // Show success
    document.getElementById('successScreen').classList.add('visible');

    // Update progress to 100%
    document.getElementById('progressFill').style.width = '100%';
    [1,2,3].forEach(c => {
      const el = document.getElementById('pStep' + c);
      el.classList.remove('active'); el.classList.add('complete'); el.textContent = '✓';
      el.nextElementSibling.classList.remove('active'); el.nextElementSibling.classList.add('complete');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Intersection observer fade-in for after-steps
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.after-step').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s`;
    observer.observe(el);
  });
</script>
</body>
</html>