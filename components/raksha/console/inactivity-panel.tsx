"use client";

import { useState } from "react";
import { ShieldAlert, RefreshCw, Send, Check, AlertCircle } from "lucide-react";

interface InactiveUser {
  name: string;
  role: "Donor" | "Patient";
  lastActive: string;
  reason: string;
}

const INACTIVE_USERS: InactiveUser[] = [
  { name: "Rahul V.", role: "Donor", lastActive: "23 days ago", reason: "Deferred status, needs confirmation check" },
  { name: "Karan M.", role: "Patient", lastActive: "14 days ago", reason: "SLA window warning alert" },
  { name: "Amit Sen", role: "Donor", lastActive: "60 days ago", reason: "No response to latest match outreach" },
];

interface InactivityPanelProps {
  inactiveUsers?: InactiveUser[];
  onRefresh?: () => void;
}

export function InactivityPanel({ inactiveUsers, onRefresh }: InactivityPanelProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [successStates, setSuccessStates] = useState<Record<string, { channel: string; message: string; recipient: string; phone: string; email: string } | null>>({});
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>({});

  const displayInactive = inactiveUsers || INACTIVE_USERS;

  const handleReengage = async (u: InactiveUser) => {
    setLoadingStates((prev) => ({ ...prev, [u.name]: true }));
    setErrorStates((prev) => ({ ...prev, [u.name]: null }));
    setSuccessStates((prev) => ({ ...prev, [u.name]: null }));

    try {
      const response = await fetch(`/api/outreach/reengage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: u.name,
          role: u.role,
          reason: u.reason,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to re-engage: ${response.statusText}`);
      }

      const data = await response.json();
      setSuccessStates((prev) => ({ ...prev, [u.name]: data }));
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Error re-engaging user:", err);
      setErrorStates((prev) => ({ ...prev, [u.name]: err.message || "Something went wrong" }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [u.name]: false }));
    }
  };

  return (
    <div className="bg-raksha-navy/20 border border-raksha-wine/20 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-raksha-white">Inactivity Coordinator Panel</h2>
        <p className="text-sm text-raksha-muted mt-1">Identify inactive donors or deferred status updates that require care coordinator intervention.</p>
      </div>

      <div className="space-y-4">
        {displayInactive.map((u) => (
          <div key={u.name} className="p-4 bg-raksha-deep/55 border border-raksha-wine/10 rounded-xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-raksha-gold shrink-0" />
                <div>
                  <h3 className="font-semibold text-raksha-white text-base">
                    {u.name} · <span className="text-xs text-raksha-muted">{u.role}</span>
                  </h3>
                  <p className="text-xs text-raksha-muted mt-0.5">{u.reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 sm:mt-0">
                <span className="text-xs text-raksha-muted">Active {u.lastActive}</span>
                <button
                  onClick={() => handleReengage(u)}
                  disabled={loadingStates[u.name]}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-raksha-blood/10 border border-raksha-blood text-raksha-blood text-xs font-semibold rounded hover:bg-raksha-blood/20 transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {loadingStates[u.name] ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : successStates[u.name] ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {loadingStates[u.name] ? "Sending..." : successStates[u.name] ? "Re-engaged" : "Re-engage"}
                </button>
              </div>
            </div>

            {successStates[u.name] && (
              <div className="p-3 bg-raksha-teal/10 border border-raksha-teal/30 rounded-lg text-xs space-y-1 text-raksha-teal animate-fade-in w-full">
                <p className="font-semibold flex items-center gap-1">
                  <span>✓</span> Outreach broadcast sent successfully!
                </p>
                <p>
                  <span className="text-raksha-muted">Channel:</span>{" "}
                  <span className="font-mono text-raksha-white bg-raksha-navy/40 px-1.5 py-0.5 rounded">{successStates[u.name]!.channel}</span>{" "}
                  · <span className="text-raksha-muted">Recipient:</span>{" "}
                  <span className="font-semibold text-raksha-white">{successStates[u.name]!.recipient}</span> (
                  {successStates[u.name]!.phone || "No Phone"})
                </p>
                <p className="italic text-raksha-white/80 mt-1.5 font-mono text-[0.65rem] border-t border-raksha-teal/20 pt-1.5">
                  {successStates[u.name]!.message}
                </p>
              </div>
            )}

            {errorStates[u.name] && (
              <div className="p-3 bg-raksha-blood/10 border border-raksha-blood/30 rounded-lg text-xs text-raksha-blood flex items-center gap-2 w-full">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>Failed to re-engage: {errorStates[u.name]}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
