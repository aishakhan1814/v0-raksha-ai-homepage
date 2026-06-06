"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/blood/client"
import type { DashboardStats } from "@/lib/blood/types"

export function DemandPanel() {
  const { data, isLoading } = useSWR<DashboardStats>("/api/dashboard/stats", fetcher)

  if (isLoading || !data) {
    return <div className="h-64 animate-pulse rounded-xl bg-card" />
  }

  const rows = data.bloodGroupDemand
  const maxVal = Math.max(1, ...rows.map((r) => Math.max(r.demand, r.eligibleSupply)))

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-card p-5">
        <div className="mb-1 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-raksha-crimson">
          Blood Group Supply vs Demand
        </div>
        <p className="mb-5 font-sans text-xs text-raksha-muted">
          Demand = patient bridge needs. Supply = eligible donors today. Rare groups are
          treated as critical shortage by default.
        </p>
        <div className="flex flex-col gap-4">
          {rows.map((r) => (
            <div key={r.bloodGroup} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-sans text-xs text-raksha-white/90">
                  {r.bloodGroup}
                  {r.critical && (
                    <span className="rounded-full bg-raksha-blood/20 px-2 py-0.5 font-sans text-[0.58rem] text-raksha-coral">
                      Critical
                    </span>
                  )}
                </span>
                <span className="font-mono text-[0.65rem] text-raksha-muted">
                  {r.eligibleSupply} supply / {r.demand} demand
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-raksha-teal"
                    style={{ width: `${(r.eligibleSupply / maxVal) * 100}%` }}
                  />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${r.critical ? "bg-raksha-blood" : "bg-raksha-gold"}`}
                    style={{ width: `${(r.demand / maxVal) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-4">
          <span className="flex items-center gap-1.5 font-sans text-[0.65rem] text-raksha-muted">
            <span className="h-2 w-4 rounded-full bg-raksha-teal" /> Eligible supply
          </span>
          <span className="flex items-center gap-1.5 font-sans text-[0.65rem] text-raksha-muted">
            <span className="h-2 w-4 rounded-full bg-raksha-gold" /> Patient demand
          </span>
        </div>
      </div>
    </div>
  )
}
