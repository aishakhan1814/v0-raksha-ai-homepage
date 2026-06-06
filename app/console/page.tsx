"use client";

import { useState } from "react";
import { SLAPage } from "@/components/raksha/console/sla-page";

const C = {
  bg: "#0a0d12",
  surface: "#111620",
  border: "#1e2535",
  red: "#e53935",
  text: "#f0f4ff",
  muted: "#8892a4",
};

const TABS = [
  "Overview",
  "User Directory",
  "Bridges",
  "Eligible Donors",
  "Inactivity",
  "Demand Map",
  "SLA Enforcement",
];

export default function ConsolePage() {
  const [active, setActive] = useState("SLA Enforcement");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* Console top nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 28px",
          borderBottom: `1px solid ${C.border}`,
          overflowX: "auto",
          background: C.surface,
        }}
      >
        {TABS.map((tab) => {
          const isActive = active === tab;
          const isSla = tab === "SLA Enforcement";
          return (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${isActive ? C.red : "transparent"}`,
                padding: "16px 14px",
                marginBottom: -1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? C.text : C.muted,
                whiteSpace: "nowrap",
              }}
            >
              {tab}
              {isSla && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 999,
                    color: "#fff",
                    background: C.red,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  2
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active panel */}
      {active === "SLA Enforcement" ? (
        <SLAPage />
      ) : (
        <div
          style={{
            padding: "64px 28px",
            fontFamily: "'DM Sans', sans-serif",
            color: C.muted,
            fontSize: 15,
          }}
        >
          {active} panel coming soon.
        </div>
      )}
    </div>
  );
}
