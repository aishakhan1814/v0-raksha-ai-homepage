"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  ALL_BLOOD_GROUPS,
  bloodBadgeClass,
  fetcher,
  fmtBloodGroup,
  fmtDate,
  fmtGender,
  postJSON,
  ROLE_BADGE,
  shortId,
} from "@/lib/blood/client"
import {
  daysSinceContact,
  daysUntilEligible,
  isContactOverdue,
  isDonorEligibleToday,
  outreachEfficiency,
} from "@/lib/blood/computed"
import type {
  ActiveStatus,
  DonorType,
  EligibilityStatus,
  Gender,
  PaginatedUsers,
  Role,
  User,
} from "@/lib/blood/types"

const ROLES: Role[] = ["Guest", "Emergency Donor", "Bridge Donor", "Patient", "Volunteer"]
const DONOR_TYPES: DonorType[] = ["One-Time Donor", "Regular Donor", "Other"]
const GENDERS: Gender[] = ["Male", "Female", "Non-binary", "Prefer not to say", "Other"]

interface Filters {
  role: string
  eligibility: string
  blood_group: string
  status: string
  donor_type: string
  status_of_bridge: string
  gender: string
}

const EMPTY: Filters = {
  role: "",
  eligibility: "",
  blood_group: "",
  status: "",
  donor_type: "",
  status_of_bridge: "",
  gender: "",
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-sans text-[0.6rem] uppercase tracking-[0.12em] text-raksha-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-muted bg-secondary px-2 py-1.5 font-sans text-xs text-raksha-white outline-none focus:border-raksha-teal"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function EligBadge({ user }: { user: User }) {
  const eligible = isDonorEligibleToday(user)
  const d = daysUntilEligible(user)
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 font-mono text-[0.65rem] ${
        eligible ? "bg-raksha-teal/20 text-raksha-teal-light" : "bg-muted text-raksha-muted"
      }`}
    >
      {eligible ? "Eligible" : d === null ? "—" : d > 0 ? `${d}d` : "Cooldown"}
    </span>
  )
}

function ConvIndicator({ user }: { user: User }) {
  const eff = outreachEfficiency(user)
  if (!eff) return <span className="text-raksha-muted">—</span>
  const map = {
    high: "text-raksha-teal",
    medium: "text-raksha-gold",
    low: "text-raksha-blood",
  } as const
  return (
    <span className={`font-mono text-xs ${map[eff]}`}>
      {user.calls_to_donations_ratio?.toFixed(2)}
    </span>
  )
}

export function DonorTable() {
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState<string | null>(null)

  const qs = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => v && qs.set(k, v))
  qs.set("page", String(page))
  qs.set("limit", "20")

  const { data, isLoading, mutate } = useSWR<PaginatedUsers>(
    `/api/users?${qs.toString()}`,
    fetcher,
  )

  const set = (k: keyof Filters) => (v: string) => {
    setFilters((f) => ({ ...f, [k]: v }))
    setPage(1)
  }

  const logCall = async (id: string) => {
    setBusy(id)
    await postJSON("/api/calls/log", { userId: id })
    await mutate()
    setBusy(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="rounded-xl bg-card p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <Select label="Role" value={filters.role} onChange={set("role")} options={ROLES.map((r) => ({ value: r, label: r }))} />
          <Select label="Blood Group" value={filters.blood_group} onChange={set("blood_group")} options={ALL_BLOOD_GROUPS.map((b) => ({ value: b, label: b }))} />
          <Select label="Eligibility" value={filters.eligibility} onChange={set("eligibility")} options={(["eligible", "not eligible"] as EligibilityStatus[]).map((e) => ({ value: e, label: e }))} />
          <Select label="Active Status" value={filters.status} onChange={set("status")} options={(["Active", "Inactive"] as ActiveStatus[]).map((s) => ({ value: s, label: s }))} />
          <Select label="Donor Type" value={filters.donor_type} onChange={set("donor_type")} options={DONOR_TYPES.map((d) => ({ value: d, label: d }))} />
          <Select label="Bridge Active" value={filters.status_of_bridge} onChange={set("status_of_bridge")} options={[{ value: "true", label: "Matched" }, { value: "false", label: "Unmatched" }]} />
          <Select label="Gender" value={filters.gender} onChange={set("gender")} options={GENDERS.map((g) => ({ value: g, label: g }))} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-sans text-xs text-raksha-muted">
            {data ? `${data.total.toLocaleString()} matching users` : "Loading…"}
          </span>
          <button
            onClick={() => {
              setFilters(EMPTY)
              setPage(1)
            }}
            className="font-sans text-xs text-raksha-teal hover:text-raksha-teal-light"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-muted">
              {["User", "Role", "Blood", "Gender", "Eligible", "Donations", "Conv.", "Last Contact", "Bridge", "Action"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-sans text-[0.62rem] uppercase tracking-[0.1em] text-raksha-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center font-sans text-sm text-raksha-muted">
                  Loading users…
                </td>
              </tr>
            )}
            {data?.data.map((u) => (
              <tr key={u.user_id} className="border-b border-muted/50 hover:bg-secondary/40">
                <td className="px-4 py-3 font-mono text-xs text-raksha-white/90">{shortId(u.user_id)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 font-sans text-[0.65rem] ${ROLE_BADGE[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 font-mono text-[0.65rem] ${bloodBadgeClass(u.blood_group)}`}>
                    {fmtBloodGroup(u.blood_group)}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans text-xs text-raksha-white/70">{fmtGender(u.gender)}</td>
                <td className="px-4 py-3"><EligBadge user={u} /></td>
                <td className="px-4 py-3 font-mono text-xs text-raksha-white/80">
                  {u.donations_till_date ?? "—"}
                </td>
                <td className="px-4 py-3"><ConvIndicator user={u} /></td>
                <td className="px-4 py-3 font-sans text-xs">
                  {u.last_contacted_date ? (
                    <span className={isContactOverdue(u) ? "text-raksha-coral" : "text-raksha-white/70"}>
                      {fmtDate(u.last_contacted_date)}
                      {isContactOverdue(u) && (
                        <span className="ml-1 text-[0.6rem]">({daysSinceContact(u)}d)</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-raksha-muted">Never contacted</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.status_of_bridge ? (
                    <span className="rounded-full bg-raksha-gold/20 px-2 py-0.5 font-sans text-[0.62rem] text-raksha-gold">
                      {shortId(u.bridge_id)}
                    </span>
                  ) : (
                    <span className="text-raksha-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => logCall(u.user_id)}
                    disabled={busy === u.user_id}
                    className="rounded-md border border-raksha-teal/40 px-2.5 py-1 font-sans text-[0.65rem] text-raksha-teal-light hover:bg-raksha-teal/10 disabled:opacity-50"
                  >
                    {busy === u.user_id ? "…" : "Log Call"}
                  </button>
                </td>
              </tr>
            ))}
            {data && data.data.length === 0 && !isLoading && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center font-sans text-sm text-raksha-muted">
                  No users match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-muted px-3 py-1.5 font-sans text-xs text-raksha-white/80 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="font-mono text-xs text-raksha-muted">
            Page {data.page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="rounded-md border border-muted px-3 py-1.5 font-sans text-xs text-raksha-white/80 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
