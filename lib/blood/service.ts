// ─── Query & Aggregation Service ─────────────────────────────────────────────────
// Sits between the API routes and the dataset. Pure, testable logic.

import {
  bloodGroupRarity,
  isBridgeAtRisk,
  isDonorEligibleToday,
  isRareBloodGroup,
  isTransfusionImminent,
} from "./computed"
import { findUser, getDataset, updateUser } from "./dataset"
import type {
  ActiveStatus,
  BloodGroup,
  BridgePair,
  DashboardStats,
  DonorType,
  EligibilityStatus,
  Gender,
  PaginatedUsers,
  Role,
  User,
} from "./types"

const ALL_ROLES: Role[] = [
  "Guest",
  "Emergency Donor",
  "Bridge Donor",
  "Patient",
  "Volunteer",
]

export interface UserFilters {
  role?: Role
  eligibility?: EligibilityStatus
  blood_group?: BloodGroup
  status?: ActiveStatus
  donor_type?: DonorType
  status_of_bridge?: boolean
  gender?: Gender
  search?: string
  page?: number
  limit?: number
}

export function queryUsers(f: UserFilters): PaginatedUsers {
  let rows = getDataset()

  if (f.role) rows = rows.filter((u) => u.role === f.role)
  if (f.eligibility) rows = rows.filter((u) => u.eligibility_status === f.eligibility)
  if (f.blood_group) rows = rows.filter((u) => u.blood_group === f.blood_group)
  if (f.status) rows = rows.filter((u) => u.user_donation_active_status === f.status)
  if (f.donor_type) rows = rows.filter((u) => u.donor_type === f.donor_type)
  if (typeof f.status_of_bridge === "boolean")
    rows = rows.filter((u) => u.status_of_bridge === f.status_of_bridge)
  if (f.gender) rows = rows.filter((u) => u.gender === f.gender)
  if (f.search) {
    const q = f.search.toLowerCase()
    rows = rows.filter(
      (u) =>
        u.user_id.toLowerCase().includes(q) ||
        (u.bridge_id ?? "").toLowerCase().includes(q),
    )
  }

  const total = rows.length
  const page = Math.max(1, f.page ?? 1)
  const limit = Math.min(200, Math.max(1, f.limit ?? 25))
  const start = (page - 1) * limit
  const data = rows.slice(start, start + limit)

  return { data, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
}

export function getDashboardStats(now: Date = new Date()): DashboardStats {
  const ds = getDataset()

  const byRole = ALL_ROLES.reduce(
    (acc, r) => ({ ...acc, [r]: 0 }),
    {} as Record<Role, number>,
  )
  let eligibleDonorsToday = 0
  let activeBridges = 0
  let patientsTransfusionNext7Days = 0
  let inactiveCount = 0
  const inactiveByReason: Record<string, number> = {}

  // demand: count patient bridge_blood_group needs vs eligible bridge-donor supply
  const demandMap = new Map<BloodGroup, number>()
  const supplyMap = new Map<BloodGroup, number>()

  for (const u of ds) {
    byRole[u.role]++

    if (
      (u.role === "Bridge Donor" || u.role === "Emergency Donor") &&
      isDonorEligibleToday(u, now)
    ) {
      eligibleDonorsToday++
      if (u.blood_group) supplyMap.set(u.blood_group, (supplyMap.get(u.blood_group) ?? 0) + 1)
    }

    if (u.status_of_bridge && u.role === "Patient") activeBridges++

    if (u.role === "Patient") {
      if (isTransfusionImminent(u, 7, now)) patientsTransfusionNext7Days++
      if (u.bridge_blood_group)
        demandMap.set(u.bridge_blood_group, (demandMap.get(u.bridge_blood_group) ?? 0) + 1)
    }

    if (u.user_donation_active_status === "Inactive") {
      inactiveCount++
      const reason = u.inactive_trigger_comment ?? "Unspecified"
      inactiveByReason[reason] = (inactiveByReason[reason] ?? 0) + 1
    }
  }

  const groups = new Set<BloodGroup>([...demandMap.keys(), ...supplyMap.keys()])
  const bloodGroupDemand = [...groups]
    .map((bg) => ({
      bloodGroup: bg,
      demand: demandMap.get(bg) ?? 0,
      eligibleSupply: supplyMap.get(bg) ?? 0,
      critical: isRareBloodGroup(bg) || (demandMap.get(bg) ?? 0) > (supplyMap.get(bg) ?? 0),
    }))
    .sort((a, b) => b.demand - a.demand)

  return {
    totalUsers: ds.length,
    byRole,
    eligibleDonorsToday,
    activeBridges,
    patientsTransfusionNext7Days,
    inactiveCount,
    inactiveByReason,
    bloodGroupDemand,
  }
}

/** All active bridge pairs (patient + matched donor). */
export function getBridges(now: Date = new Date()): BridgePair[] {
  const ds = getDataset()
  const patients = ds.filter((u) => u.role === "Patient" && u.bridge_id)
  return patients.map((p) => {
    const donor =
      ds.find(
        (u) => u.role === "Bridge Donor" && u.bridge_id === p.bridge_id,
      ) ?? null
    return {
      bridge_id: p.bridge_id as string,
      patient: p,
      donor,
      atRisk: isBridgeAtRisk(donor, p, now),
    }
  })
}

/**
 * Auto-match a patient to the best available unmatched bridge donor.
 * Rules per spec:
 *  - role = "Bridge Donor" AND blood_group === patient.bridge_blood_group
 *  - eligibility_status = "eligible" AND status_of_bridge = false
 *  - sort donations_till_date DESC then last_donation_date ASC
 */
export function matchBridge(patientId: string, now: Date = new Date()): {
  ok: boolean
  reason?: string
  patient?: User
  donor?: User
} {
  const patient = findUser(patientId)
  if (!patient) return { ok: false, reason: "Patient not found" }
  if (patient.role !== "Patient") return { ok: false, reason: "User is not a Patient" }

  const candidates = getDataset()
    .filter(
      (u) =>
        u.role === "Bridge Donor" &&
        u.blood_group === patient.bridge_blood_group &&
        u.eligibility_status === "eligible" &&
        u.status_of_bridge === false,
    )
    .sort((a, b) => {
      const dd = (b.donations_till_date ?? 0) - (a.donations_till_date ?? 0)
      if (dd !== 0) return dd
      const at = a.last_donation_date ? new Date(a.last_donation_date).getTime() : 0
      const bt = b.last_donation_date ? new Date(b.last_donation_date).getTime() : 0
      return at - bt // ASC
    })

  const donor = candidates[0]
  if (!donor) return { ok: false, reason: "No eligible unmatched donor for this blood group" }

  const bridgeId = patient.bridge_id ?? generateBridgeId()
  const freq = 21 // patient transfusion cycle default

  updateUser(patient.user_id, {
    bridge_id: bridgeId,
    bridge_status: true,
    status_of_bridge: true,
    last_bridge_donation_date: donor.last_donation_date,
  })
  updateUser(donor.user_id, {
    bridge_id: bridgeId,
    bridge_status: true,
    status_of_bridge: true,
    frequency_in_days: freq,
  })

  return { ok: true, patient: findUser(patient.user_id)!, donor: findUser(donor.user_id)! }
}

export function dissolveBridge(bridgeId: string): { ok: boolean; affected: number } {
  const ds = getDataset()
  const members = ds.filter((u) => u.bridge_id === bridgeId)
  members.forEach((m) =>
    updateUser(m.user_id, {
      status_of_bridge: false,
      bridge_status: false,
      bridge_id: m.role === "Patient" ? m.bridge_id : null,
    }),
  )
  return { ok: members.length > 0, affected: members.length }
}

/** Eligible donors for an emergency, optionally filtered by blood group. */
export function eligibleDonors(
  bloodGroup?: BloodGroup,
  now: Date = new Date(),
): User[] {
  return getDataset()
    .filter(
      (u) =>
        (u.role === "Bridge Donor" || u.role === "Emergency Donor") &&
        isDonorEligibleToday(u, now) &&
        (!bloodGroup || u.blood_group === bloodGroup),
    )
    .sort((a, b) => (b.donations_till_date ?? 0) - (a.donations_till_date ?? 0))
}

/** Log an outreach call: increments total_calls + updates last_contacted_date. */
export function logCall(userId: string, now: Date = new Date()): User | null {
  const u = findUser(userId)
  if (!u) return null
  const calls = u.total_calls + 1
  const ratio = u.donations_till_date
    ? +(calls / u.donations_till_date).toFixed(2)
    : u.calls_to_donations_ratio
  return updateUser(userId, {
    total_calls: calls,
    last_contacted_date: now.toISOString().slice(0, 10),
    calls_to_donations_ratio: ratio,
  })
}

/** Re-activate an inactive user. */
export function reactivateUser(userId: string, now: Date = new Date()): User | null {
  const u = findUser(userId)
  if (!u) return null
  return updateUser(userId, {
    user_donation_active_status: "Active",
    inactive_trigger_comment: null,
    next_eligible_date: now.toISOString().slice(0, 10),
    last_contacted_date: now.toISOString().slice(0, 10),
    total_calls: u.total_calls + 1,
  })
}

export function inactiveUsers(): User[] {
  return getDataset().filter((u) => u.user_donation_active_status === "Inactive")
}

export function patientTransfusion(patientId: string, now: Date = new Date()) {
  const p = findUser(patientId)
  if (!p || p.role !== "Patient") return null
  const donor =
    getDataset().find(
      (u) => u.role === "Bridge Donor" && u.bridge_id === p.bridge_id,
    ) ?? null
  return {
    patient: p,
    donor,
    imminent: isTransfusionImminent(p, 7, now),
    atRisk: isBridgeAtRisk(donor, p, now),
    rarity: bloodGroupRarity(p.bridge_blood_group),
  }
}

function generateBridgeId(): string {
  const chars = "0123456789abcdef"
  let s = ""
  for (let i = 0; i < 24; i++) s += chars[Math.floor(Math.random() * 16)]
  return s
}
