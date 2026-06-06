"use client";

import { useState } from "react";
import { SLARequestCard, type SLARequest } from "./sla-request-card";

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

// ─── METRIC CARDS DATA ──────────────────────────────────────────────────────
const METRICS = [
  {
    label: "SLA breaches today",
    value: "2",
    color: C.red,
    delta: "+1 from yesterday",
  },
  {
    label: "At risk (>80% window used)",
    value: "1",
    color: C.amber,
    delta: "23 min remaining",
  },
  {
    label: "Avg acknowledge time",
    value: "38s",
    color: C.green,
    delta: "SLA target: 60s ✓",
  },
  {
    label: "SLA compliance rate",
    value: "88%",
    color: C.text,
    delta: "↑ 4% from last week",
  },
];

// ─── FILTER TABS ────────────────────────────────────────────────────────────
const TABS = [
  { id: "all", label: "All requests", count: 4, color: C.muted },
  { id: "breached", label: "Breached", count: 2, color: C.red },
  { id: "atrisk", label: "At risk", count: 1, color: C.amber },
  { id: "ontrack", label: "On track", count: 1, color: C.green },
] as const;

// ─── REQUESTS DATA ──────────────────────────────────────────────────────────
const REQUESTS: SLARequest[] = [
  {
    status: "breached",
    initials: "AR",
    name: "Ananya R.",
    blood: "B+",
    hospital: "KEM Hospital Mumbai",
    timestamp: "requested 14 hours ago",
    badge: "SLA breached — 2h 14m overdue",
    stages: [
      { label: "Acknowledged", state: "done" },
      { label: "Outreach sent", state: "done" },
      { label: "Donor confirm", state: "fail" },
      { label: "Escalation needed", state: "empty" },
    ],
    progress: 100,
    progressLabel: "Breached — 134 min elapsed",
    footer: "4 donors contacted · 0 confirmed",
    actionLabel: "Escalate now",
    auditRows: [
      { stage: "Acknowledge", action: "Request received & logged", target: "60s", actual: "41s", pass: true },
      { stage: "Outreach", action: "4 donors notified via SMS", target: "10m", actual: "8m", pass: true },
      { stage: "Donor confirm", action: "Awaiting donor confirmation", target: "120m", actual: "134m+", pass: false },
      { stage: "Escalation", action: "Pending coordinator action", target: "150m", actual: "—", pass: false },
    ],
  },
  {
    status: "atrisk",
    initials: "KM",
    name: "Karan M.",
    blood: "O-",
    hospital: "AIIMS Delhi",
    timestamp: "requested 6 hours ago",
    badge: "At risk — 23 min left",
    stages: [
      { label: "Acknowledged", state: "done" },
      { label: "Outreach sent", state: "done" },
      { label: "Awaiting confirm", state: "active" },
      { label: "Escalation", state: "empty" },
    ],
    progress: 81,
    progressLabel: "81% of SLA window used",
    footer: "4 donors contacted · auto-escalation in 23 min",
    actionLabel: "Pre-escalate",
    auditRows: [
      { stage: "Acknowledge", action: "Request received & logged", target: "60s", actual: "29s", pass: true },
      { stage: "Outreach", action: "4 donors notified via SMS", target: "10m", actual: "6m", pass: true },
      { stage: "Donor confirm", action: "Awaiting donor confirmation", target: "120m", actual: "97m", pass: true },
      { stage: "Escalation", action: "Auto-escalation armed (23m)", target: "150m", actual: "—", pass: true },
    ],
  },
  {
    status: "ontrack",
    initials: "PS",
    name: "Priya S.",
    blood: "A+",
    hospital: "Manipal Hospital Bengaluru",
    timestamp: "confirmed 47 min ago",
    badge: "✓ SLA met — confirmed in 47 min",
    stages: [
      { label: "Acknowledged", state: "done" },
      { label: "Outreach sent", state: "done" },
      { label: "Donor confirm", state: "done" },
      { label: "Fulfilled", state: "done" },
    ],
    progress: 39,
    progressLabel: "39% of SLA window used",
    footer: "Acknowledge: 32s · Outreach: 4m · Confirm: 47m — all within SLA",
    actionLabel: "Export audit log",
    auditRows: [
      { stage: "Acknowledge", action: "Request received & logged", target: "60s", actual: "32s", pass: true },
      { stage: "Outreach", action: "5 donors notified via SMS", target: "10m", actual: "4m", pass: true },
      { stage: "Donor confirm", action: "Donor confirmed & matched", target: "120m", actual: "47m", pass: true },
      { stage: "Fulfilled", action: "Unit dispatched to hospital", target: "180m", actual: "62m", pass: true },
    ],
  },
];

// ─── METRIC CARD ────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  color,
  delta,
}: {
  label: string;
  value: string;
  color: string;
  delta: string;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderBottom: `2px solid ${color}`,
        borderRadius: 12,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11.5,
          color: C.muted,
          letterSpacing: "0.4px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 34,
          fontWeight: 500,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: C.muted,
        }}
      >
        {delta}
      </div>
    </div>
  );
}

// ─── SLA PAGE ───────────────────────────────────────────────────────────────
export function SLAPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>(
    "breached",
  );

  const visibleRequests =
    activeTab === "all"
      ? REQUESTS
      : REQUESTS.filter((r) => r.status === activeTab);

  return (
    <div style={{ background: C.bg, minHeight: "100%" }}>
      {/* Header bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 28px",
          borderBottom: `1px solid ${C.border}`,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 700,
              color: C.text,
            }}
          >
            Raksha<span style={{ color: "#2CA8A0" }}>AI</span>
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              fontWeight: 500,
              color: C.muted,
            }}
          >
            SLA Enforcement
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: C.green,
              boxShadow: `0 0 0 0 ${C.green}`,
              animation: "slaPulse 1.6s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12.5,
              color: C.green,
              fontWeight: 500,
            }}
          >
            Live
          </span>
        </div>
      </header>

      <div style={{ padding: "28px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Metric cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {METRICS.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            borderBottom: `1px solid ${C.border}`,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${active ? tab.color : "transparent"}`,
                  padding: "10px 14px",
                  marginBottom: -1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 400,
                  color: active ? tab.color : C.muted,
                }}
              >
                {tab.label}
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "1px 7px",
                    borderRadius: 999,
                    color:
                      tab.id === "all"
                        ? C.muted
                        : tab.id === "ontrack"
                          ? C.green
                          : tab.id === "atrisk"
                            ? C.amber
                            : C.red,
                    background:
                      tab.id === "all"
                        ? C.border
                        : tab.id === "ontrack"
                          ? "rgba(16,185,129,0.14)"
                          : tab.id === "atrisk"
                            ? "rgba(245,158,11,0.14)"
                            : "rgba(229,57,53,0.14)",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Request list */}
        <div>
          {visibleRequests.length > 0 ? (
            visibleRequests.map((req) => (
              <SLARequestCard key={req.name} data={req} />
            ))
          ) : (
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: C.muted,
                textAlign: "center",
                padding: "48px 0",
              }}
            >
              No requests in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
