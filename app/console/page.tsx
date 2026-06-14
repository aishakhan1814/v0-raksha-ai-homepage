"use client";

import { useState, useEffect } from "react";
import { useLanguage, Language } from "@/context/LanguageContext";
import { StatsPanel } from "@/components/raksha/console/stats-panel";
import { DonorTable } from "@/components/raksha/console/donor-table";
import { BridgesPanel } from "@/components/raksha/console/bridges-panel";
import { InactivityPanel } from "@/components/raksha/console/inactivity-panel";
import { DemandPanel } from "@/components/raksha/console/demand-panel";
import { EmergencyPanel } from "@/components/raksha/console/emergency-panel";
import SLAEnforcement from "@/components/raksha/console/sla-page";

type Tab = "overview" | "directory" | "bridges" | "emergency" | "inactivity" | "demand" | "sla";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "directory", label: "User Directory" },
  { id: "bridges", label: "Bridges" },
  { id: "emergency", label: "Eligible Donors" },
  { id: "inactivity", label: "Inactivity" },
  { id: "demand", label: "Demand Map" },
  { id: "sla", label: "SLA Enforcement" },
];

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
  );
}

export default function ConsolePage() {
  const { lang: language, setLang: setLanguage } = useLanguage();
  const [tab, setTab] = useState<Tab>("overview");
  const [consoleData, setConsoleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/console/data");
      const json = await res.json();
      if (json.success) {
        setConsoleData(json);
      } else {
        setError(json.error || "Failed to load console data");
      }
    } catch (err: any) {
      console.error("Failed loading console data:", err);
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Parse tab from URL query params on mount
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryTab = params.get("tab") as Tab;
      if (queryTab && TABS.some((t) => t.id === queryTab)) {
        setTab(queryTab);
      }
    }

    loadData();
    // Poll data every 10 seconds for real-time console updates
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-raksha-deep flex flex-col items-center justify-center gap-4 text-raksha-white">
        <span className="w-8 h-8 border-2 border-raksha-wine/30 border-t-raksha-teal rounded-full animate-spin" style={{ borderTopColor: "#2CA8A0" }} />
        <p className="font-mono text-sm text-raksha-muted">Connecting to Raksha Core Operations DB...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-raksha-deep flex flex-col items-center justify-center gap-4 text-raksha-white p-4">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-xl font-bold text-raksha-blood font-display">Database Sync Failure</h2>
        <p className="font-mono text-sm text-raksha-muted text-center max-w-md">{error}</p>
        <button onClick={() => { setLoading(true); loadData(); }} className="px-4 py-2 bg-raksha-blood hover:bg-raksha-crimson text-xs font-semibold uppercase tracking-wider text-raksha-white">
          Retry Sync
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raksha-deep">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-raksha-wine bg-raksha-navy">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="/">
            <Logo />
          </a>
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-raksha-muted">🌐</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-raksha-deep text-raksha-white border border-raksha-wine/40 px-2 py-1 text-xs outline-none cursor-pointer"
                style={{ background: "#060C16", border: "1px solid rgba(139, 26, 42, 0.4)", borderRadius: "4px" }}
              >
                <option value="en">EN</option>
                <option value="hi">HI</option>
                <option value="te">TE</option>
                <option value="mr">MR</option>
                <option value="ta">TA</option>
                <option value="bn">BN</option>
                <option value="gu">GU</option>
                <option value="pa">PA</option>
                <option value="kn">KN</option>
              </select>
            </div>
            <a
              href="/"
              className="font-sans text-xs text-raksha-white/70 hover:text-raksha-teal"
            >
              Back to site
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="mb-6 flex flex-wrap justify-between items-end gap-4 border-b border-raksha-wine/20 pb-4">
          <div>
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
          <a
            href="/patient/search"
            className="px-4 py-2 border text-xs font-semibold uppercase tracking-wider transition-all"
            style={{ borderRadius: "0px", borderColor: "#2CA8A0", color: "#2CA8A0" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#2CA8A0"; (e.currentTarget as HTMLAnchorElement).style.color = "#FAF9F7"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#2CA8A0"; }}
          >
            🔍 Search Patient Registry
          </a>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-muted">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
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
        {tab === "overview" && (
          <StatsPanel 
            stats={consoleData?.stats} 
            stepFunctions={consoleData?.stepFunctions} 
            logActivity={consoleData?.logActivity} 
          />
        )}
        {tab === "directory" && (
          <DonorTable donors={consoleData?.donors} />
        )}
        {tab === "bridges" && (
          <BridgesPanel bridges={consoleData?.bridges} />
        )}
        {tab === "emergency" && (
          <EmergencyPanel eligibleDonors={consoleData?.eligibleDonors} />
        )}
        {tab === "inactivity" && (
          <InactivityPanel 
            inactiveUsers={consoleData?.inactiveUsers} 
            onRefresh={loadData} 
          />
        )}
        {tab === "demand" && (
          <DemandPanel demandCities={consoleData?.demandCities} />
        )}
        {tab === "sla" && (
          <SLAEnforcement 
            bloodRequests={consoleData?.bloodRequests} 
            onRefresh={loadData} 
          />
        )}
      </main>
    </div>
  );
}
