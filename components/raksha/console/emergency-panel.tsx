"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  ALL_BLOOD_GROUPS,
  bloodBadgeClass,
  fetcher,
  fmtBloodGroup,
  fmtDate,
  postJSON,
  shortId,
} from "@/lib/blood/client"
import { daysUntilEligible } from "@/lib/blood/computed"
import type { BloodGroup, User } from "@/lib/blood/types"

export function EmergencyPanel() {
  const [bg, setBg] = useState<string>("")
  const [busy, setBusy] = useState<string | null>(null)
  const { data, isLoading, mutate } = useSWR<{ count: number; donors: User[] }>(
    `/api/donors/eligible${bg ? `?blood_group=${encodeURIComponent(bg)}` : ""}`,
    fetcher,
  )

  const logCall = async (id: string) => {
    setBusy(id)
    await postJSON("/api/calls/log", { userId: id })
    await mutate()
    setBusy(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-card p-4">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-[0.6rem] uppercase tracking-[0.12em] text-raksha-muted">
            Filter by Blood Group
          </span>
          <select
            value={bg}
            onChange={(e) => setBg(e.target.value)}
            className="rounded-md border border-muted bg-secondary px-2 py-1.5 font-sans text-xs text-raksha-white outline-none focus:border-raksha-teal"
          >
            <option value="">All eligible donors</option>
            {ALL_BLOOD_GROUPS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <span className="rounded-full bg-raksha-teal/20 px-3 py-1.5 font-sans text-xs text-raksha-teal-light">
          {data?.count ?? 0} ready to donate now
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-muted">
              {["Donor", "Blood", "Type", "Donations", "Last Donation", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-sans text-[0.62rem] uppercase tracking-[0.1em] text-raksha-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center font-sans text-sm text-raksha-muted">
                  Loading…
                </td>
              </tr>
            )}
            {data?.donors.slice(0, 60).map((u) => (
              <tr key={u.user_id} className="border-b border-muted/50 hover:bg-secondary/40">
                <td className="px-4 py-3 font-mono text-xs text-raksha-white/90">{shortId(u.user_id)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 font-mono text-[0.65rem] ${bloodBadgeClass(u.blood_group)}`}>
                    {fmtBloodGroup(u.blood_group)}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans text-xs text-raksha-white/70">{u.donor_type}</td>
                <td className="px-4 py-3 font-mono text-xs text-raksha-white/80">{u.donations_till_date ?? "—"}</td>
                <td className="px-4 py-3 font-sans text-xs text-raksha-white/60">{fmtDate(u.last_donation_date)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => logCall(u.user_id)}
                    disabled={busy === u.user_id}
                    className="rounded-md bg-raksha-blood px-2.5 py-1 font-sans text-[0.65rem] font-medium text-raksha-white disabled:opacity-50"
                  >
                    {busy === u.user_id ? "…" : "Call to Donate"}
                  </button>
                </td>
              </tr>
            ))}
            {data && data.donors.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center font-sans text-sm text-raksha-muted">
                  No eligible donors for this blood group right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
