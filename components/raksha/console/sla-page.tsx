"use client";

import { useState } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#0a0d12",
  surface: "#111620",
  border: "#1e2535",
  red: "#e53935",
  green: "#10b981",
  amber: "#f59e0b",
  white: "#f0f4ff",
  muted: "#8892a4",
};

// ─── METRIC CARDS ─────────────────────────────────────────────────────────────
const METRICS = [
  { label: "SLA breaches today", value: "2", color: T.red, delta: "+1 from yesterday" },
  { label: "At risk (>80% window used)", value: "1", color: T.amber, delta: "23 min remaining" },
  { label: "Avg acknowledge time", value: "38s", color: T.green, delta: "SLA target: 60s ✓" },
  { label: "SLA compliance rate", value: "88%", color: T.white, delta: "↑ 4% from last week" },
];

function MetricCard({ label, value, color, delta }: typeof METRICS[0]) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
      padding: "20px 24px", position: "relative", overflow: "hidden",
      borderBottom: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: "0.75rem", color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: "2.2rem", fontWeight: 700, color, lineHeight: 1, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: "0.78rem", color: T.muted }}>{delta}</div>
    </div>
  );
}

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
interface AuditRow { stage: string; action: string; target: string; actual: string; pass: boolean; }

function SLAAuditLog({ patientName, rows }: { patientName: string; rows: AuditRow[] }) {
  const exportCSV = () => {
    const header = `"Stage","Action taken","SLA target","Actual time","Status"`;
    const body = rows.map(r =>
      `"${r.stage}","${r.action}","${r.target}","${r.actual}","${r.pass ? "PASS" : "FAIL"}"`
    ).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `sla-audit-${patientName.replace(/\s/g, "-")}-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: 12, background: "#0d1017", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ color: T.white, fontSize: "0.85rem", fontWeight: 600 }}>Audit Log</span>
        <button onClick={exportCSV} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, fontSize: "0.75rem", padding: "5px 12px", borderRadius: 4, cursor: "pointer" }}>
          Export CSV ↓
        </button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
        <thead>
          <tr style={{ background: "#0a0d12" }}>
            {["Stage", "Action taken", "SLA target", "Actual time", "Status"].map(h => (
              <th key={h} style={{ padding: "8px 16px", textAlign: "left", color: T.muted, fontWeight: 500, borderBottom: `1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <td style={{ padding: "10px 16px", color: T.white }}>{r.stage}</td>
              <td style={{ padding: "10px 16px", color: T.muted }}>{r.action}</td>
              <td style={{ padding: "10px 16px", color: T.muted }}>{r.target}</td>
              <td style={{ padding: "10px 16px", color: T.muted }}>{r.actual}</td>
              <td style={{ padding: "10px 16px" }}>
                <span style={{
                  background: r.pass ? "rgba(16,185,129,0.12)" : "rgba(229,57,53,0.12)",
                  color: r.pass ? T.green : T.red,
                  fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 3, letterSpacing: "0.06em",
                }}>{r.pass ? "PASS" : "FAIL"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ESCALATION PANEL ─────────────────────────────────────────────────────────
const ESCALATION_OPTIONS = [
  { id: "radius", title: "Expand donor radius", desc: "50km → 100km" },
  { id: "backup", title: "Alert backup donor pool", desc: "Notify 12 reserve donors" },
  { id: "coordinator", title: "Notify coordinator", desc: "Urgent SMS to hospital staff" },
];

function EscalationPanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const now = new Date();

  const auditTimeline = [
    { time: now.toLocaleTimeString(), action: "Escalation triggered — donor radius expanded to 100km" },
    { time: new Date(now.getTime() + 5000).toLocaleTimeString(), action: "12 backup donors notified via WhatsApp" },
    { time: new Date(now.getTime() + 12000).toLocaleTimeString(), action: "Hospital coordinator alerted via SMS" },
  ];

  return (
    <div style={{
      marginTop: 12, background: "#0d1017", border: `1px solid ${T.red}`,
      borderRadius: 8, overflow: "hidden",
      animation: "expandIn 0.25s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <style>{`@keyframes expandIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {!confirmed ? (
        <>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: T.red, fontWeight: 600, fontSize: "0.9rem" }}>⚡ SLA breached — select escalation action</span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: "1rem" }}>✕</button>
          </div>

          <div style={{ padding: 18 }}>
            {/* Option cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
              {ESCALATION_OPTIONS.map(opt => (
                <div key={opt.id} onClick={() => setSelected(opt.id)}
                  style={{
                    background: T.surface, border: `2px solid ${selected === opt.id ? T.red : T.border}`,
                    borderRadius: 8, padding: "14px 16px", cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}>
                  <div style={{ color: T.white, fontWeight: 600, fontSize: "0.85rem", marginBottom: 4 }}>{opt.title}</div>
                  <div style={{ color: T.muted, fontSize: "0.75rem" }}>{opt.desc}</div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add escalation notes (optional)..."
              rows={3}
              style={{
                width: "100%", background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 6, color: T.white, fontFamily: "inherit", fontSize: "0.85rem",
                padding: "10px 14px", resize: "vertical", outline: "none", boxSizing: "border-box",
              }}
            />

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span style={{ color: T.muted, fontSize: "0.75rem" }}>{now.toLocaleString()}</span>
              <button
                onClick={() => selected && setConfirmed(true)}
                style={{
                  background: selected ? T.red : "#3a1a1a", color: selected ? "#fff" : T.muted,
                  border: "none", borderRadius: 6, padding: "9px 20px",
                  fontWeight: 600, fontSize: "0.85rem", cursor: selected ? "pointer" : "not-allowed",
                  transition: "background 0.15s",
                }}>
                Confirm escalation →
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: 20 }}>
          <div style={{ color: T.green, fontWeight: 700, fontSize: "0.95rem", marginBottom: 16 }}>✓ Escalation confirmed</div>
          {auditTimeline.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ color: T.muted, fontSize: "0.72rem", marginBottom: 2 }}>{e.time}</div>
                <div style={{ color: T.white, fontSize: "0.82rem" }}>{e.action}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SLA REQUEST CARD ─────────────────────────────────────────────────────────
interface RequestCardProps {
  initials: string;
  name: string;
  bloodType: string;
  hospital: string;
  timeAgo: string;
  statusLabel: string;
  statusColor: string;
  stages: { label: string; state: "done" | "fail" | "warn" | "pending" }[];
  progressPct: number;
  progressColor: string;
  progressLabel: string;
  footerLeft: string;
  actionLabel: string;
  actionColor: string;
  actionType: "escalate" | "pre-escalate" | "audit";
  auditRows?: AuditRow[];
}

function SLARequestCard(p: RequestCardProps) {
  const [showEscalate, setShowEscalate] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const stateIcon = (state: RequestCardProps["stages"][0]["state"]) => {
    if (state === "done") return <span style={{ color: T.green, fontWeight: 700 }}>✓</span>;
    if (state === "fail") return (
      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: T.red, animation: "pulse 1.2s infinite" }} />
    );
    if (state === "warn") return (
      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: T.amber, animation: "pulse 1.2s infinite" }} />
    );
    return <span style={{ color: T.border }}>○</span>;
  };

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${p.statusColor}`,
      borderRadius: 10, marginBottom: 14, overflow: "hidden",
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>

      <div style={{ padding: "18px 20px" }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: `${p.statusColor}22`, color: p.statusColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
            }}>{p.initials}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: T.white, fontWeight: 600, fontSize: "0.95rem" }}>{p.name}</span>
                <span style={{ background: `${p.statusColor}22`, color: p.statusColor, fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 3 }}>{p.bloodType}</span>
              </div>
              <div style={{ color: T.muted, fontSize: "0.78rem", marginTop: 2 }}>{p.hospital} · {p.timeAgo}</div>
            </div>
          </div>
          <span style={{
            background: `${p.statusColor}18`, color: p.statusColor,
            fontSize: "0.75rem", fontWeight: 600, padding: "5px 12px",
            borderRadius: 4, whiteSpace: "nowrap",
          }}>{p.statusLabel}</span>
        </div>

        {/* Stage tracker */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16 }}>
          {p.stages.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < p.stages.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0d1017", border: `2px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>
                  {stateIcon(s.state)}
                </div>
                <span style={{ color: T.muted, fontSize: "0.65rem", whiteSpace: "nowrap" }}>{s.label}</span>
              </div>
              {i < p.stages.length - 1 && (
                <div style={{ flex: 1, height: 1, background: T.border, margin: "0 6px", marginBottom: 18 }} />
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 6, background: "#0d1017", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${p.progressPct}%`, background: p.progressColor, borderRadius: 3, transition: "width 0.5s" }} />
          </div>
          <div style={{ color: T.muted, fontSize: "0.72rem", marginTop: 5 }}>{p.progressLabel}</div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: T.muted, fontSize: "0.78rem" }}>{p.footerLeft}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowAudit(v => !v)}
              style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, fontSize: "0.75rem", padding: "6px 14px", borderRadius: 5, cursor: "pointer" }}>
              Audit log
            </button>
            <button
              onClick={() => {
                if (p.actionType === "audit") { setShowAudit(v => !v); }
                else { setShowEscalate(v => !v); }
              }}
              style={{
                background: p.actionType === "audit" ? "none" : `${p.actionColor}18`,
                border: `1px solid ${p.actionColor}`,
                color: p.actionColor, fontSize: "0.75rem", padding: "6px 14px",
                borderRadius: 5, cursor: "pointer", fontWeight: 600,
              }}>
              {p.actionLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Escalation panel */}
      {showEscalate && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "0 20px 18px" }}>
          <EscalationPanel onClose={() => setShowEscalate(false)} />
        </div>
      )}

      {/* Audit log */}
      {showAudit && p.auditRows && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "0 20px 18px" }}>
          <SLAAuditLog patientName={p.name} rows={p.auditRows} />
        </div>
      )}
    </div>
  );
}

// ─── STATIC REQUEST DATA ──────────────────────────────────────────────────────
const ANANYA_AUDIT: AuditRow[] = [
  { stage: "Acknowledge", action: "Request received and logged", target: "60s", actual: "38s", pass: true },
  { stage: "Outreach", action: "4 donors contacted via WhatsApp", target: "10 min", actual: "8m 12s", pass: true },
  { stage: "Donor confirm", action: "No donor confirmed", target: "90 min", actual: "134 min", pass: false },
  { stage: "Escalation", action: "Pending action", target: "Immediate", actual: "—", pass: false },
];

const KARAN_AUDIT: AuditRow[] = [
  { stage: "Acknowledge", action: "Request received and logged", target: "60s", actual: "41s", pass: true },
  { stage: "Outreach", action: "4 donors contacted via WhatsApp", target: "10 min", actual: "9m 05s", pass: true },
  { stage: "Donor confirm", action: "Awaiting donor response", target: "90 min", actual: "67 min (ongoing)", pass: true },
  { stage: "Escalation", action: "Not triggered yet", target: "If breach", actual: "—", pass: true },
];

const PRIYA_AUDIT: AuditRow[] = [
  { stage: "Acknowledge", action: "Request received and logged", target: "60s", actual: "32s", pass: true },
  { stage: "Outreach", action: "3 donors contacted via WhatsApp", target: "10 min", actual: "4m", pass: true },
  { stage: "Donor confirm", action: "Donor Rahul V. confirmed", target: "90 min", actual: "47m", pass: true },
  { stage: "Escalation", action: "Not required", target: "N/A", actual: "N/A", pass: true },
];

// ─── FILTER TABS ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "all", label: "All requests", count: 4, color: T.muted },
  { id: "breached", label: "Breached", count: 2, color: T.red },
  { id: "at-risk", label: "At risk", count: 1, color: T.amber },
  { id: "on-track", label: "On track", count: 1, color: T.green },
];

// ─── MAIN SLA PAGE ────────────────────────────────────────────────────────────
export default function SLAPage() {
  const [activeTab, setActiveTab] = useState("breached");

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.white, fontFamily: "'Inter', 'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: T.red }}>RakshaAI</span>
          <span style={{ color: T.border }}>›</span>
          <span style={{ fontWeight: 600, fontSize: "1rem", color: T.white }}>SLA Enforcement</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, display: "inline-block", boxShadow: `0 0 6px ${T.green}` }} />
          <span style={{ color: T.green, fontSize: "0.8rem", fontWeight: 600 }}>Live</span>
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          {METRICS.map(m => <MetricCard key={m.label} {...m} />)}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  background: "none", border: "none", borderBottom: active ? `2px solid ${tab.color}` : "2px solid transparent",
                  color: active ? tab.color : T.muted,
                  fontWeight: active ? 600 : 400, fontSize: "0.85rem",
                  padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  transition: "color 0.15s", marginBottom: -1,
                }}>
                {tab.label}
                <span style={{
                  background: `${tab.color}22`, color: tab.color,
                  fontSize: "0.7rem", fontWeight: 700, padding: "1px 7px", borderRadius: 10,
                }}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Request cards */}
        {(activeTab === "all" || activeTab === "breached") && (
          <SLARequestCard
            initials="AR" name="Ananya R." bloodType="B+" hospital="KEM Hospital Mumbai" timeAgo="14 hours ago"
            statusLabel="SLA breached — 2h 14m overdue" statusColor={T.red}
            stages={[
              { label: "Acknowledged", state: "done" },
              { label: "Outreach sent", state: "done" },
              { label: "Donor confirm", state: "fail" },
              { label: "Escalation needed", state: "pending" },
            ]}
            progressPct={100} progressColor={T.red} progressLabel="Breached — 134 min elapsed"
            footerLeft="4 donors contacted · 0 confirmed"
            actionLabel="Escalate now" actionColor={T.red} actionType="escalate"
            auditRows={ANANYA_AUDIT}
          />
        )}

        {(activeTab === "all" || activeTab === "at-risk") && (
          <SLARequestCard
            initials="KM" name="Karan M." bloodType="O-" hospital="AIIMS Delhi" timeAgo="6 hours ago"
            statusLabel="At risk — 23 min left" statusColor={T.amber}
            stages={[
              { label: "Acknowledged", state: "done" },
              { label: "Outreach sent", state: "done" },
              { label: "Awaiting confirm", state: "warn" },
              { label: "Escalation", state: "pending" },
            ]}
            progressPct={81} progressColor={T.amber} progressLabel="81% of SLA window used"
            footerLeft="4 donors contacted · auto-escalation in 23 min"
            actionLabel="Pre-escalate" actionColor={T.amber} actionType="pre-escalate"
            auditRows={KARAN_AUDIT}
          />
        )}

        {(activeTab === "all" || activeTab === "on-track") && (
          <SLARequestCard
            initials="PS" name="Priya S." bloodType="A+" hospital="Manipal Hospital Bengaluru" timeAgo="confirmed 47 min ago"
            statusLabel="✓ SLA met — confirmed in 47 min" statusColor={T.green}
            stages={[
              { label: "Acknowledged", state: "done" },
              { label: "Outreach sent", state: "done" },
              { label: "Donor confirm", state: "done" },
              { label: "Complete", state: "done" },
            ]}
            progressPct={39} progressColor={T.green} progressLabel="39% of SLA window used — all within SLA"
            footerLeft="Acknowledge: 32s · Outreach: 4m · Confirm: 47m — all within SLA"
            actionLabel="Export audit log" actionColor={T.green} actionType="audit"
            auditRows={PRIYA_AUDIT}
          />
        )}
      </div>
    </div>
  );
}