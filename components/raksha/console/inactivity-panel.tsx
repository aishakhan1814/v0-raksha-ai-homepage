"use client";

import { useState } from "react";
import { ShieldAlert, RefreshCw, Send, Check, AlertCircle, Sparkles, Brain, Info } from "lucide-react";

interface InactiveUser {
  name: string;
  role: "Donor" | "Patient";
  lastActive: string;
  reason: string;
}

interface MLPrediction {
  is_inactive: number;
  status_label: "Active" | "Inactive";
  probabilities: {
    active: number;
    inactive: number;
  };
  model_version: string;
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

  // ML Assessment state
  const [mlPredictions, setMlPredictions] = useState<Record<string, MLPrediction>>({});
  const [mlLoading, setMlLoading] = useState<Record<string, boolean>>({});
  const [mlErrors, setMlErrors] = useState<Record<string, string | null>>({});

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

  const handleEvaluateML = async (u: InactiveUser) => {
    // Avoid repeated requests if already cached
    if (mlPredictions[u.name]) return;

    setMlLoading((prev) => ({ ...prev, [u.name]: true }));
    setMlErrors((prev) => ({ ...prev, [u.name]: null }));

    try {
      const response = await fetch(`/api/ml/predict-donor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          donorId: u.name,
          features: {
            cycle_of_donations: 0.0,
            frequency_in_days: 0.0,
            registration_days: 366.0,
            role: "missing",
            blood_group: "O Positive",
            gender: "Male",
            donor_type: "Regular Donor",
            eligibility_status: "eligible",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `ML assessment failed with HTTP ${response.status}`);
      }

      if (data.prediction) {
        setMlPredictions((prev) => ({ ...prev, [u.name]: data.prediction }));
      }
    } catch (err: any) {
      console.error("Error evaluating ML assessment:", err);
      setMlErrors((prev) => ({ ...prev, [u.name]: err.message || "Failed to reach ML inference service" }));
    } finally {
      setMlLoading((prev) => ({ ...prev, [u.name]: false }));
    }
  };

  return (
    <div className="bg-raksha-navy/20 border border-raksha-wine/20 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-raksha-white">Inactivity Coordinator Panel</h2>
        <p className="text-sm text-raksha-muted mt-1">
          Identify inactive donors or deferred status updates that require care coordinator intervention.
        </p>
      </div>

      <div className="space-y-4">
        {displayInactive.map((u) => {
          const prediction = mlPredictions[u.name];
          const isDonor = u.role === "Donor";

          return (
            <div key={u.name} className="p-4 bg-raksha-deep/55 border border-raksha-wine/10 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-raksha-gold shrink-0" />
                  <div>
                    <h3 className="font-semibold text-raksha-white text-base">
                      {u.name} · <span className="text-xs text-raksha-muted">{u.role}</span>
                    </h3>
                    <p className="text-xs text-raksha-muted mt-0.5">
                      <span className="text-raksha-muted font-medium">Operational Status:</span> {u.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 sm:mt-0 flex-wrap">
                  <span className="text-xs text-raksha-muted mr-1">Active {u.lastActive}</span>

                  {isDonor && (
                    <button
                      onClick={() => handleEvaluateML(u)}
                      disabled={mlLoading[u.name] || !!prediction}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-raksha-teal/10 border border-raksha-teal/40 text-raksha-teal text-xs font-semibold rounded hover:bg-raksha-teal/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {mlLoading[u.name] ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Brain className="w-3.5 h-3.5" />
                      )}
                      {mlLoading[u.name] ? "Evaluating..." : prediction ? "Assessed" : "Evaluate ML"}
                    </button>
                  )}

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

              {/* ML Assessment Display (strictly separated from operational status) */}
              {prediction && (
                <div className="p-3.5 bg-raksha-navy/40 border border-raksha-teal/30 rounded-lg text-xs space-y-2 text-raksha-white animate-fade-in w-full">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-raksha-teal font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Experimental Retrospective Assessment</span>
                      <span className="text-[10px] bg-raksha-teal/20 text-raksha-teal px-1.5 py-0.5 rounded ml-1">
                        v{prediction.model_version}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                          prediction.is_inactive === 1
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        Retrospective Status: {prediction.status_label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-1 bg-black/20 rounded p-2 text-center text-[11px]">
                    <div>
                      <span className="text-raksha-muted">Inactive Prob:</span>{" "}
                      <span className="font-mono font-bold text-amber-300">
                        {(prediction.probabilities.inactive * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-raksha-muted">Active Prob:</span>{" "}
                      <span className="font-mono font-bold text-emerald-300">
                        {(prediction.probabilities.active * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-[11px] text-raksha-muted border-t border-raksha-wine/10 pt-1.5">
                    <Info className="w-3.5 h-3.5 text-raksha-teal shrink-0 mt-0.5" />
                    <p>
                      Classifies historical platform activity patterns. Does not predict future donation behavior or establish medical/clinical eligibility.
                    </p>
                  </div>
                </div>
              )}

              {/* ML Assessment Error State */}
              {mlErrors[u.name] && (
                <div className="p-3 bg-raksha-blood/10 border border-raksha-blood/30 rounded-lg text-xs text-raksha-blood flex items-center gap-2 w-full">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>ML Assessment Unavailable: {mlErrors[u.name]}</p>
                </div>
              )}

              {successStates[u.name] && (
                <div className="p-3 bg-raksha-teal/10 border border-raksha-teal/30 rounded-lg text-xs space-y-1 text-raksha-teal animate-fade-in w-full">
                  <p className="font-semibold flex items-center gap-1">
                    <span>✓</span> Outreach broadcast sent successfully!
                  </p>
                  <p>
                    <span className="text-raksha-muted">Channel:</span>{" "}
                    <span className="font-mono text-raksha-white bg-raksha-navy/40 px-1.5 py-0.5 rounded">
                      {successStates[u.name]!.channel}
                    </span>{" "}
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
          );
        })}
      </div>
    </div>
  );
}
