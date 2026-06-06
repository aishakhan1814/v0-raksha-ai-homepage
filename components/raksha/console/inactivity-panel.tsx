"use client"

import { useState } from "react"
import useSWR from "swr"
import { fetcher, fmtBloodGroup, fmtDate, patchJSON, ROLE_BADGE, shortId } from "@/lib/blood/client"
import type { User } from "@/lib/blood/types"

interface InactivityResponse {
  count: number
  byReason: Record<string, number>
  users: User[]
}

export function InactivityPanel() {
  const { data, isLoading, mutate } = useSWR<InactivityResponse>(
    "/api/analytics/inactivity",
    fetcher,
  )
  const [busy, setBusy] = useState<string | null>(null)

  const reactivate = async (id: string) => {
    setBusy(id)
    const today = new Date().toISOString().slice(0, 10)
    await patchJSON(`/api/users/${id}`, {
      user_donation_active_status: "Active",
      inactive_trigger_comment: null,
      next_eligible_date: today,
      last_contacted_date: today,
    })
    await mutate()
    setBusy(null)
  }

  if (isLoading || !data) {
    return <div className="h-64 animate-pulse rounded-xl bg-card" />
  }

  const reasons = Object.entries(data.byReason).sort((a, b) => b[1] - a[1])

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-card p-5">
        <div className="mb-4 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-raksha-crimson">
          {data.count} Inactive — Breakdown by Reason
        </div>
        <div className="flex flex-col gap-3">
          {reasons.map(([reason, count]) => {
            const pct = (count / data.count) * 100
            return (
              <div key={reason} className="flex items-center gap-3">
                <div className="w-56 shrink-0 font-sans text-xs text-raksha-white/80">
                  {reason}
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-raksha-blood" style={{ width: `${pct}%` }} />
                </div>
                <div className="w-10 shrink-0 text-right font-mono text-xs text-raksha-muted">
                  {count}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-muted">
              {["User", "Role", "Blood", "Reason", "Last Contact", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-sans text-[0.62rem] uppercase tracking-[0.1em] text-raksha-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.users.slice(0, 50).map((u) => (
              <tr key={u.user_id} className="border-b border-muted/50 hover:bg-secondary/40">
                <td className="px-4 py-3 font-mono text-xs text-raksha-white/90">{shortId(u.user_id)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 font-sans text-[0.62rem] ${ROLE_BADGE[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-raksha-white/70">{fmtBloodGroup(u.blood_group)}</td>
                <td className="px-4 py-3 font-sans text-xs text-raksha-coral">
                  {u.inactive_trigger_comment ?? "—"}
                </td>
                <td className="px-4 py-3 font-sans text-xs text-raksha-white/60">
                  {u.last_contacted_date ? fmtDate(u.last_contacted_date) : "Never"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => reactivate(u.user_id)}
                    disabled={busy === u.user_id}
                    className="rounded-md bg-raksha-teal px-2.5 py-1 font-sans text-[0.65rem] font-medium text-raksha-white disabled:opacity-50"
                  >
                    {busy === u.user_id ? "…" : "Re-activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
