"use client";

import { useState } from "react";
import { SLAAuditLog, type AuditRow } from "./sla-audit-log";

// ─── COLOR SYSTEM ───────────────────────────────────────────────────────────
const C = {
  bg: "#0a0d12",
  surface: "#111620",
  border: "#1e2535",
  red: "#e53935",
  green: "#10b981",
  amber: "#f59e0b",
  text: "#f0f4ff",
  muted: "#8892a4",
};

type Status = "breached" | "atrisk" | "ontrack";

interface Stage {
  label: string;
  state: "done" | "fail" | "active" | "empty";
}

export interface SLARequest {
  status: Status;
  initials: string;
  name: string;
  blood: string;
  hospital: string;
  timestamp: string;
  badge: string;
  stages: Stage[];
  progress: number; // 0-100
  progressLabel: string;
  footer: string;
  actionLabel: string;
  auditRows: AuditRow[];
}

const STATUS_COLOR: Record<Status, string> = {
  breached: C.red,
  atrisk: C.amber,
  ontrack: C.green,
};

// ─── STAGE TRACKER ──────────────────────────────────────────────────────────
function StageTracker({ stages }: { stages: Stage[] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexWrap: "wrap",
        margin: "18px 0",
      }}
    >
      {stages.map((s, i) => {
        const color =
          s.state === "done"
            ? C.green
            : s.state === "fail"
              ? C.red
              : s.state === "active"
                ? C.amber
                : C.muted;
        const marker =
          s.state === "done" ? "✓" : s.state === "fail" ? "✗" : "";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: s.state === "empty" ? C.muted : "#0a0d12",
                  background:
                    s.state === "empty" ? "transparent" : color,
                  border:
                    s.state === "empty"
                      ? `1.5px solid ${C.border}`
                      : "none",
                  flexShrink: 0,
                  ...(s.state === "fail" || s.state === "active"
                    ? { animation: "slaPulse 1.4s ease-in-out infinite" }
                    : {}),
                }}
              >
                {marker}
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: s.state === "empty" ? C.muted : C.text,
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <span
                style={{
                  width: 18,
                  height: 1,
                  background: C.border,
                  margin: "0 4px",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── ESCALATION PANEL ───────────────────────────────────────────────────────
const ESCALATION_OPTIONS = [
  {
    id: "radius",
    title: "Expand donor radius",
    desc: "50km to 100km",
    auditAction: "Donor search radius expanded 50km → 100km",
  },
  {
    id: "backup",
    title: "Alert backup donor pool",
    desc: "Notify 12 reserve donors",
    auditAction: "Backup pool alerted — 12 reserve donors notified",
  },
  {
    id: "coordinator",
    title: "Notify coordinator",
    desc: "Urgent SMS to hospital staff",
    auditAction: "Urgent SMS dispatched to hospital coordinator",
  },
];

function nowTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function EscalationPanel({ accent }: { accent: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [timeline, setTimeline] = useState<{ time: string; text: string }[]>([]);

  const handleConfirm = () => {
    if (!selected) return;
    const opt = ESCALATION_OPTIONS.find((o) => o.id === selected)!;
    const base = nowTime();
    setTimeline([
      { time: base, text: `Escalation triggered by coordinator` },
      { time: base, text: opt.auditAction },
      {
        time: base,
        text: notes.trim()
          ? `Note logged: "${notes.trim()}"`
          : "No additional notes provided",
      },
    ]);
    setConfirmed(true);
  };

  return (
    <div
      style={{
        marginTop: 16,
        background: "#0d121b",
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 20,
        animation: "slaExpand 0.3s ease-out",
      }}
    >
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: accent }}>⚡</span>
        SLA breached — select escalation action
      </div>

      {!confirmed ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {ESCALATION_OPTIONS.map((opt) => {
              const active = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  style={{
                    textAlign: "left",
                    background: active ? "rgba(229,57,53,0.08)" : C.surface,
                    border: `1.5px solid ${active ? C.red : C.border}`,
                    borderRadius: 8,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.text,
                      marginBottom: 4,
                    }}
                  >
                    {opt.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11.5,
                      color: C.muted,
                    }}
                  >
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escalation notes…"
            rows={3}
            style={{
              width: "100%",
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "10px 12px",
              color: C.text,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11.5,
                color: C.muted,
              }}
            >
              {nowTime()}
            </span>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              style={{
                background: selected ? C.red : "#3a2025",
                color: selected ? "#fff" : C.muted,
                border: "none",
                padding: "10px 20px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: selected ? "pointer" : "not-allowed",
                borderRadius: 8,
              }}
            >
              Confirm escalation
            </button>
          </div>
        </>
      ) : (
        <div style={{ animation: "slaExpand 0.3s ease-out" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: C.green,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            <span>✓</span> Escalation confirmed and logged
          </div>
          <div style={{ position: "relative", paddingLeft: 20 }}>
            <div
              style={{
                position: "absolute",
                left: 4,
                top: 4,
                bottom: 4,
                width: 1.5,
                background: C.border,
              }}
            />
            {timeline.map((t, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  paddingBottom: i < timeline.length - 1 ? 16 : 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: -20,
                    top: 4,
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: C.green,
                  }}
                />
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 2,
                  }}
                >
                  {t.time}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: C.text,
                  }}
                >
                  {t.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REQUEST CARD ───────────────────────────────────────────────────────────
export function SLARequestCard({ data }: { data: SLARequest }) {
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const accent = STATUS_COLOR[data.status];

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 12,
        padding: 22,
        marginBottom: 16,
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: `${accent}22`,
              border: `1.5px solid ${accent}`,
              color: accent,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {data.initials}
          </span>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: C.text,
                }}
              >
                {data.name}
              </span>
              <span
                style={{
                  background: "rgba(229,57,53,0.12)",
                  border: `1px solid ${C.red}55`,
                  color: C.red,
                  padding: "2px 9px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {data.blood}
              </span>
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12.5,
                color: C.muted,
                marginTop: 3,
              }}
            >
              {data.hospital} · {data.timestamp}
            </div>
          </div>
        </div>

        <span
          style={{
            background: `${accent}1a`,
            border: `1px solid ${accent}66`,
            color: accent,
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {data.badge}
        </span>
      </div>

      {/* Stage tracker */}
      <StageTracker stages={data.stages} />

      {/* Progress bar */}
      <div>
        <div
          style={{
            height: 8,
            background: C.bg,
            borderRadius: 999,
            overflow: "hidden",
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${data.progress}%`,
              background: accent,
              borderRadius: 999,
              transition: "width 0.8s ease-out",
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11.5,
            color: accent,
            marginTop: 6,
          }}
        >
          {data.progressLabel}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 18,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12.5,
            color: C.muted,
          }}
        >
          {data.footer}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setAuditOpen((v) => !v)}
            style={{
              background: "transparent",
              color: C.text,
              border: `1px solid ${C.border}`,
              padding: "8px 14px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              borderRadius: 8,
            }}
          >
            {data.status === "ontrack" ? "Export audit log" : "Audit log"}
          </button>
          <button
            onClick={() => setEscalateOpen((v) => !v)}
            style={{
              background: accent,
              color: data.status === "atrisk" ? "#0a0d12" : "#fff",
              border: "none",
              padding: "8px 16px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: 8,
            }}
          >
            {data.actionLabel}
          </button>
        </div>
      </div>

      {/* Inline expanding audit log */}
      {auditOpen && (
        <SLAAuditLog patientName={data.name} rows={data.auditRows} />
      )}

      {/* Inline expanding escalation panel */}
      {escalateOpen && <EscalationPanel accent={accent} />}
    </div>
  );
}
