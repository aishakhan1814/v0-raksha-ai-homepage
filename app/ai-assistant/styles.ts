export const AI_CSS = `
  .ai-root {
    --crimson: #C0152A;
    --wine: #8B1A2A;
    --teal: #2CA8A0;
    --gold: #D4A847;
    --deep: #0D0D0D;
    --navy: #0A1628;
    --card: #111827;
    --border: #1e293b;
    --white: #FAF9F7;
    --muted: #6B7280;
    --muted-light: #9CA3AF;

    position: fixed;
    inset: 0;
    display: flex;
    height: 100dvh;
    width: 100%;
    background: var(--deep);
    color: var(--white);
    font-family: var(--font-sans), 'DM Sans', sans-serif;
    overflow: hidden;
  }

  .ai-mono { font-family: var(--font-mono), 'JetBrains Mono', monospace; }
  .ai-display { font-family: var(--font-display), 'Cormorant Garamond', serif; }

  /* ── SIDEBAR ── */
  .ai-sidebar {
    width: 280px;
    flex-shrink: 0;
    background: var(--navy);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 22px 20px;
  }
  .ai-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .ai-brand-text { font-family: var(--font-display), serif; font-size: 1.35rem; font-weight: 700; line-height: 1; }
  .ai-brand-text .r { color: var(--white); }
  .ai-brand-text .a { color: var(--teal); }
  .ai-section-label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--crimson);
  }

  .ai-identity {
    background: var(--card);
    border: 1px solid var(--teal);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .ai-pulse {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: rgba(192,21,42,0.12);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .ai-pulse svg { animation: shieldPulse 2.4s ease-in-out infinite; }
  @keyframes shieldPulse {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(192,21,42,0)); }
    50% { transform: scale(1.08); filter: drop-shadow(0 0 6px rgba(192,21,42,0.55)); }
  }
  .ai-identity-name { font-family: var(--font-display), serif; font-size: 1.05rem; font-weight: 700; color: var(--white); line-height: 1.2; }
  .ai-identity-sub { font-size: 0.72rem; color: var(--muted); margin-top: 2px; line-height: 1.4; }
  .ai-status { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
  .ai-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #1A7A4A; box-shadow: 0 0 0 0 rgba(26,122,74,0.7); animation: dotPulse 2s infinite; }
  @keyframes dotPulse {
    0% { box-shadow: 0 0 0 0 rgba(26,122,74,0.6); }
    70% { box-shadow: 0 0 0 6px rgba(26,122,74,0); }
    100% { box-shadow: 0 0 0 0 rgba(26,122,74,0); }
  }
  .ai-status-text { font-size: 0.72rem; color: #4ade80; font-weight: 500; }

  .ai-chip {
    width: 100%;
    text-align: left;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--muted-light);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 0.8rem;
    font-family: inherit;
    line-height: 1.4;
    cursor: pointer;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
  }
  .ai-chip:hover { border-color: var(--crimson); color: var(--white); background: #161f30; }

  .ai-cap-row { display: flex; align-items: flex-start; gap: 10px; }
  .ai-cap-icon { width: 16px; flex-shrink: 0; margin-top: 2px; }
  .ai-cap-text { font-size: 0.82rem; color: var(--muted-light); line-height: 1.4; }

  .ai-disclaimer {
    font-size: 0.7rem;
    font-style: italic;
    color: var(--muted);
    line-height: 1.5;
    border-top: 1px solid var(--border);
    padding-top: 16px;
  }

  /* ── MAIN ── */
  .ai-main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--deep); }
  .ai-topbar {
    height: 56px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
  }
  .ai-topbar-title { font-size: 0.92rem; font-weight: 600; color: var(--white); }
  .ai-topbar-sub { font-size: 0.72rem; color: var(--muted); }
  .ai-iconbtn {
    background: transparent; border: none; color: var(--muted); cursor: pointer;
    width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
    border-radius: 8px; transition: color 0.18s, background 0.18s;
  }
  .ai-iconbtn:hover { color: var(--white); background: #161f30; }

  .ai-messages { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }

  .ai-empty { margin: auto; text-align: center; max-width: 440px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .ai-empty svg { animation: shieldPulse 2.4s ease-in-out infinite; }
  .ai-empty-title { font-family: var(--font-display), serif; font-size: 1.6rem; font-weight: 700; color: var(--white); }
  .ai-empty-sub { font-size: 0.92rem; color: var(--muted); line-height: 1.6; }

  .ai-msg-row { display: flex; flex-direction: column; max-width: 78%; }
  .ai-msg-row.user { align-self: flex-end; align-items: flex-end; }
  .ai-msg-row.assistant { align-self: flex-start; align-items: flex-start; }

  .ai-avatar-line { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
  .ai-avatar-name { font-size: 0.72rem; color: var(--muted); font-weight: 500; }

  .ai-bubble { font-size: 0.9rem; line-height: 1.7; white-space: pre-wrap; word-wrap: break-word; }
  .ai-bubble.user {
    background: var(--crimson);
    color: var(--white);
    border-radius: 12px 12px 0 12px;
    padding: 12px 16px;
  }
  .ai-bubble.assistant {
    background: var(--card);
    border: 1px solid var(--border);
    border-left: 3px solid var(--teal);
    color: var(--white);
    border-radius: 0 12px 12px 12px;
    padding: 12px 16px;
  }
  .ai-bubble.error {
    background: rgba(192,21,42,0.1);
    border: 1px solid var(--crimson);
    border-left: 3px solid var(--crimson);
    color: #fca5a5;
    border-radius: 0 12px 12px 12px;
    padding: 12px 16px;
  }
  .ai-time { font-size: 0.65rem; color: var(--muted); margin-top: 6px; font-family: var(--font-mono), monospace; }

  .ai-typing { display: flex; gap: 5px; padding: 14px 16px; }
  .ai-typing span {
    width: 7px; height: 7px; border-radius: 50%; background: var(--teal);
    animation: typingBounce 1.4s infinite ease-in-out;
  }
  .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
  .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
    30% { transform: translateY(-6px); opacity: 1; }
  }

  /* ── INPUT ── */
  .ai-input-area { flex-shrink: 0; background: var(--navy); border-top: 1px solid var(--border); padding: 16px 24px; }
  .ai-input-wrap { position: relative; max-width: 820px; margin: 0 auto; }
  .ai-textarea {
    width: 100%;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--white);
    border-radius: 8px;
    padding: 14px 52px 14px 18px;
    font-family: inherit;
    font-size: 0.9rem;
    line-height: 1.5;
    resize: none;
    max-height: 120px;
    outline: none;
    transition: border-color 0.18s;
  }
  .ai-textarea:focus { border-color: var(--crimson); }
  .ai-textarea::placeholder { color: var(--muted); }
  .ai-send {
    position: absolute;
    right: 8px;
    bottom: 8px;
    width: 36px; height: 36px;
    background: var(--crimson);
    border: none;
    border-radius: 0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background 0.18s;
  }
  .ai-send:hover:not(:disabled) { background: var(--wine); }
  .ai-send:disabled { background: #374151; cursor: not-allowed; }
  .ai-counter { text-align: right; font-size: 0.68rem; color: var(--muted); margin-top: 6px; font-family: var(--font-mono), monospace; max-width: 820px; margin-left: auto; margin-right: auto; }
  .ai-foot-note { text-align: center; font-size: 0.68rem; color: var(--muted); margin-top: 8px; }

  /* ── MOBILE TOGGLE ── */
  .ai-mobile-bar { display: none; }

  @media (max-width: 860px) {
    .ai-sidebar {
      position: fixed;
      top: 0; left: 0; bottom: 0;
      z-index: 60;
      width: 84%;
      max-width: 320px;
      transform: translateX(-100%);
      transition: transform 0.28s ease;
    }
    .ai-sidebar.open { transform: translateX(0); }
    .ai-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 55;
    }
    .ai-mobile-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 52px;
      flex-shrink: 0;
      border-bottom: 1px solid var(--border);
      padding: 0 16px;
      background: var(--navy);
    }
    .ai-topbar { padding: 0 16px; }
    .ai-topbar-sub { display: none; }
    .ai-messages { padding: 16px; }
    .ai-msg-row { max-width: 88%; }
    .ai-input-area { padding: 12px 16px; }
  }
`
