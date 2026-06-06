"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/blood/client"
import type { DashboardStats } from "@/lib/blood/types"

function Tile({
  label,
  value,
  accent,
  note,
}: {
  label: string
  value: string | number
  accent: string
  note?: string
}) {
  return (
    <div
      className="rounded-xl bg-card p-5"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="font-sans text-[0.68rem] uppercase tracking-[0.13em] text-raksha-muted">
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl leading-none" style={{ color: accent }}>
        {value}
      </div>
      {note && <div className="mt-2 font-sans text-xs text-raksha-muted">{note}</div>}
    </div>
  )
}

export function StatsPanel() {
  const { data, isLoading } = useSWR<DashboardStats>("/api/dashboard/stats", fetcher, {
    refreshInterval: 15000,
  })

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    )
  }

  const topReason =
    Object.entries(data.inactiveByReason).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Tile
          label="Total Registered"
          value={data.totalUsers.toLocaleString()}
          accent="var(--raksha-white)"
          note={`${data.byRole["Bridge Donor"]} bridge · ${data.byRole["Emergency Donor"]} emergency`}
        />
        <Tile
          label="Eligible Donors Today"
          value={data.eligibleDonorsToday.toLocaleString()}
          accent="var(--raksha-teal)"
          note="Active & past cooldown"
        />
        <Tile
          label="Active Bridges"
          value={data.activeBridges.toLocaleString()}
          accent="var(--raksha-gold)"
          note="Patient–donor matched"
        />
        <Tile
          label="Transfusions ≤ 7 Days"
          value={data.patientsTransfusionNext7Days.toLocaleString()}
          accent="var(--raksha-coral)"
          note="Upcoming patient need"
        />
        <Tile
          label="Inactive Donors"
          value={data.inactiveCount.toLocaleString()}
          accent="var(--raksha-blood)"
          note={`Top reason: ${topReason}`}
        />
        <Tile
          label="Guests Awaiting Role"
          value={data.byRole.Guest.toLocaleString()}
          accent="var(--raksha-muted)"
          note="Need onboarding"
        />
      </div>

      <div className="rounded-xl bg-card p-5">
        <div className="mb-4 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-raksha-crimson">
          Registered by Role
        </div>
        <div className="flex flex-col gap-3">
          {Object.entries(data.byRole).map(([role, count]) => {
            const pct = (count / data.totalUsers) * 100
            return (
              <div key={role} className="flex items-center gap-3">
                <div className="w-32 shrink-0 font-sans text-xs text-raksha-white/80">
                  {role}
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-raksha-teal"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-12 shrink-0 text-right font-mono text-xs text-raksha-muted">
                  {count}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
