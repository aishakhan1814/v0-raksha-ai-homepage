"use client"
import SLAPage from "@/components/raksha/console/sla-page";
import { useState } from "react"
import { StatsPanel } from "@/components/raksha/console/stats-panel"
import { DonorTable } from "@/components/raksha/console/donor-table"
import { BridgesPanel } from "@/components/raksha/console/bridges-panel"
import { InactivityPanel } from "@/components/raksha/console/inactivity-panel"
import { DemandPanel } from "@/components/raksha/console/demand-panel"
import { EmergencyPanel } from "@/components/raksha/console/emergency-panel"
import  SLAEnforcement from "@/components/raksha/console/sla-page"

type Tab = "overview" | "directory" | "bridges" | "emergency" | "inactivity" | "demand" | "sla"

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "directory", label: "User Directory" },
  { id: "bridges", label: "Bridges" },
  { id: "emergency", label: "Eligible Donors" },
  { id: "inactivity", label: "Inactivity" },
  { id: "demand", label: "Demand Map" },
  { id: "sla", label: "SLA Enforcement" },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 48 56" fill="none" width={30} height={35} className="shrink-0">
        <path d="M24 2L44 11V30C44 43 24 54 24 54S4 43 4 30V11Z" fill="#8B1A2A" />
        <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
        <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold">
          <span className="text-raksha-white">Raksha</span>
          <span className="text-raksha-teal">AI</span>
        </span>
        <span className="font-sans text-[0.55rem] uppercase tracking-[0.1em] text-raksha-muted">
          Coordinator Console
        </span>
      </div>
    </div>
  )
}

export default function ConsolePage() {
  const [tab, setTab] = useState<Tab>("overview")

  return (
    <div className="min-h-screen bg-raksha-deep">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-raksha-wine bg-raksha-navy">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="/">
            <Logo />
          </a>
          <a
            href="/"
            className="font-sans text-xs text-raksha-white/70 hover:text-raksha-teal"
          >
            Back to site
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="mb-6">
          <span className="font-sans text-[0.68rem] uppercase tracking-[0.18em] text-raksha-crimson">
            Blood Bridge Coordination
          </span>
          <h1 className="mt-1 text-balance font-display text-3xl font-bold text-raksha-white">
            Operations Console
          </h1>
          <p className="mt-1 font-sans text-sm text-raksha-muted">
            Live data across donors, patients, bridges, and outreach.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-muted">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-3 py-2.5 font-sans text-sm transition-colors ${
                tab === t.id
                  ? "border-raksha-blood text-raksha-white"
                  : "border-transparent text-raksha-muted hover:text-raksha-white/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        {tab === "overview" && <StatsPanel />}
        {tab === "directory" && <DonorTable />}
        {tab === "bridges" && <BridgesPanel />}
        {tab === "emergency" && <EmergencyPanel />}
        {tab === "inactivity" && <InactivityPanel />}
        {tab === "demand" && <DemandPanel />}
        {tab === "sla" && < />}
      </main>
    </div>
  )
}
