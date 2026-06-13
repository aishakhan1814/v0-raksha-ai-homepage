"use client";

import { Activity, ShieldAlert, Users, TrendingUp } from "lucide-react";

interface StatsPanelProps {
  stats?: {
    activeMatchEvents: string;
    criticalPatients: string;
    activeDonorBridgePool: string;
    avgBridgeResponse: string;
  };
  stepFunctions?: Array<{
    id: string;
    patient: string;
    status: string;
    duration: string;
    step: string;
  }>;
  logActivity?: string[];
}

export function StatsPanel({ stats, stepFunctions, logActivity }: StatsPanelProps) {
  const cards = [
    { label: "Active Match Events", value: stats?.activeMatchEvents || "8", change: "Updated live", color: "text-raksha-teal border-raksha-teal", icon: <Activity className="w-5 h-5" /> },
    { label: "Critical Priority Patients", value: stats?.criticalPatients || "3", change: "Requires attention", color: "text-raksha-blood border-raksha-blood", icon: <ShieldAlert className="w-5 h-5" /> },
    { label: "Active Donor Bridge Pool", value: stats?.activeDonorBridgePool || "482", change: "Registered donors", color: "text-raksha-white border-raksha-wine", icon: <Users className="w-5 h-5" /> },
    { label: "Average Bridge Response", value: stats?.avgBridgeResponse || "92s", change: "SLA target: <120s", color: "text-raksha-gold border-raksha-gold", icon: <TrendingUp className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`bg-raksha-navy/40 border-l-4 ${c.color} p-5 rounded-r-xl border-y border-r border-raksha-wine/20`}>
            <div className="flex justify-between items-start">
              <span className="text-[0.7rem] uppercase tracking-wider text-raksha-muted">{c.label}</span>
              <div className="opacity-75">{c.icon}</div>
            </div>
            <p className="text-3xl font-bold text-raksha-white mt-2 font-mono">{c.value}</p>
            <span className="text-xs text-raksha-muted block mt-1">{c.change}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="lg:col-span-2 bg-raksha-navy/20 border border-raksha-wine/20 p-6 rounded-xl">
          <h2 className="font-display text-xl font-bold text-raksha-white mb-4">AWS Step Functions Execution Health</h2>
          <div className="space-y-4">
            {(stepFunctions || [
              { id: "SF-9872", patient: "Arjun Sharma", status: "RUNNING", duration: "12m 42s", step: "Outreach WaitPeriod" },
              { id: "SF-9871", patient: "Ananya R.", status: "ESCALATED", duration: "2h 14m", step: "EscalateOutreach" },
              { id: "SF-9869", patient: "Priya S.", status: "SUCCEEDED", duration: "47m 12s", step: "EndFulfilled" },
            ]).map((sf) => (
              <div key={sf.id} className="flex items-center justify-between p-3 bg-raksha-deep/55 rounded-lg border border-raksha-wine/10">
                <div>
                  <span className="text-xs font-mono text-raksha-teal">{sf.id}</span>
                  <p className="text-sm font-semibold text-raksha-white mt-0.5">{sf.patient} · <span className="text-raksha-muted font-normal">{sf.step}</span></p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 text-[0.65rem] font-bold tracking-wider rounded font-mono ${
                    sf.status === "RUNNING" ? "bg-raksha-teal/10 text-raksha-teal" :
                    sf.status === "ESCALATED" ? "bg-raksha-blood/10 text-raksha-blood" :
                    "bg-raksha-gold/10 text-raksha-gold"
                  }`}>
                    {sf.status}
                  </span>
                  <span className="text-xs text-raksha-muted block mt-1">{sf.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live System Logs */}
        <div className="bg-raksha-navy/20 border border-raksha-wine/20 p-6 rounded-xl flex flex-col">
          <h2 className="font-display text-xl font-bold text-raksha-white mb-4">CloudWatch Activity Stream</h2>
          <div className="font-mono text-[0.7rem] space-y-3 flex-1 overflow-y-auto max-h-[220px] text-raksha-muted">
            {(logActivity || [
              "[INFO] AWS Lambda warm-start complete in 42ms.",
              "[METRIC] ConsumedReadCapacityUnits: 4.2 units/sec (donors table)",
              "[WARN] Bedrock AccessDenied: Falling back to local model simulation.",
              "[INFO] SMS outreach sent to +919999999999 via Amazon SNS.",
              "[SUCCESS] Step Function instance SF-9869 completed successfully.",
            ]).map((log, i) => {
              let color = "text-raksha-muted";
              if (log.includes("[SUCCESS]") || log.includes("[INFO]")) {
                color = "text-raksha-teal";
              } else if (log.includes("[WARN]")) {
                color = "text-raksha-gold";
              } else if (log.includes("[ERROR]")) {
                color = "text-raksha-blood";
              }
              return <p key={i} className={color}>{log}</p>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
