"use client"

import { useState } from "react"
import useSWR from "swr"
import { del, fetcher, fmtBloodGroup, fmtDate, postJSON, shortId } from "@/lib/blood/client"
import { daysUntilEligible } from "@/lib/blood/computed"
import type { BridgePair } from "@/lib/blood/types"

export function BridgesPanel() {
  const { data, isLoading, mutate } = useSWR<{ bridges: BridgePair[] }>(
    "/api/bridges",
    fetcher,
  )
  const [busy, setBusy] = useState<string | null>(null)

  const rematch = async (patientId: string) => {
    setBusy(patientId)
    await postJSON("/api/bridges/match", { patientId })
    await mutate()
    setBusy(null)
  }

  const dissolve = async (bridgeId: string) => {
    setBusy(bridgeId)
    await del(`/api/bridges/${bridgeId}`)
    await mutate()
    setBusy(null)
  }

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    )
  }

  const atRisk = data.bridges.filter((b) => b.atRisk).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-card p-4">
        <span className="font-sans text-sm text-raksha-white/80">
          {data.bridges.length} bridges
        </span>
        <span className="rounded-full bg-raksha-blood/20 px-3 py-1 font-sans text-xs text-raksha-coral">
          {atRisk} at risk
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.bridges.map((b) => (
          <div
            key={b.bridge_id}
            className="rounded-xl bg-card p-5"
            style={{
              borderLeft: `3px solid ${b.atRisk ? "var(--raksha-blood)" : "var(--raksha-teal)"}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-raksha-gold">
                Bridge {shortId(b.bridge_id)}
              </span>
              {b.atRisk ? (
                <span className="rounded-full bg-raksha-blood/20 px-2 py-0.5 font-sans text-[0.62rem] text-raksha-coral">
                  At Risk
                </span>
              ) : (
                <span className="rounded-full bg-raksha-teal/20 px-2 py-0.5 font-sans text-[0.62rem] text-raksha-teal-light">
                  Healthy
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="font-sans text-[0.6rem] uppercase tracking-[0.1em] text-raksha-muted">
                  Patient
                </div>
                <div className="mt-1 font-mono text-sm text-raksha-white/90">
                  {shortId(b.patient?.user_id ?? null)}
                </div>
                <div className="font-sans text-xs text-raksha-coral">
                  {fmtBloodGroup(b.patient?.bridge_blood_group ?? null)}
                </div>
                <div className="mt-1 font-sans text-[0.65rem] text-raksha-muted">
                  Next: {fmtDate(b.patient?.expected_next_transfusion_date ?? null)}
                </div>
                <div className="font-sans text-[0.65rem] text-raksha-muted">
                  Units: {b.patient?.quantity_required ?? "—"}
                </div>
              </div>
              <div>
                <div className="font-sans text-[0.6rem] uppercase tracking-[0.1em] text-raksha-muted">
                  Bridge Donor
                </div>
                {b.donor ? (
                  <>
                    <div className="mt-1 font-mono text-sm text-raksha-white/90">
                      {shortId(b.donor.user_id)}
                    </div>
                    <div className="font-sans text-xs text-raksha-teal-light">
                      {fmtBloodGroup(b.donor.blood_group)}
                    </div>
                    <div className="mt-1 font-sans text-[0.65rem] text-raksha-muted">
                      {b.donor.donations_till_date ?? 0} donations
                    </div>
                    <div className="font-sans text-[0.65rem] text-raksha-muted">
                      Eligible in: {daysUntilEligible(b.donor) ?? "—"}d
                    </div>
                  </>
                ) : (
                  <div className="mt-1 font-sans text-xs text-raksha-coral">
                    No donor linked
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {b.atRisk && b.patient && (
                <button
                  onClick={() => rematch(b.patient!.user_id)}
                  disabled={busy === b.patient.user_id}
                  className="rounded-md bg-raksha-teal px-3 py-1.5 font-sans text-xs font-medium text-raksha-white disabled:opacity-50"
                >
                  {busy === b.patient.user_id ? "Matching…" : "Auto-Match Donor"}
                </button>
              )}
              <button
                onClick={() => dissolve(b.bridge_id)}
                disabled={busy === b.bridge_id}
                className="rounded-md border border-muted px-3 py-1.5 font-sans text-xs text-raksha-white/70 hover:border-raksha-blood hover:text-raksha-coral disabled:opacity-50"
              >
                {busy === b.bridge_id ? "…" : "Dissolve"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
