// ─── Mock Dataset ───────────────────────────────────────────────────────────────
// Deterministic, seeded generation shaped EXACTLY like the User interface.
// Role distribution and null-rates mirror the production dataset (scaled down).

import type {
  ActiveStatus,
  BloodGroup,
  DonorType,
  EligibilityStatus,
  Gender,
  Role,
  User,
} from "./types"

// ── Seeded PRNG (mulberry32) for stable data across requests ────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ALL_GROUPS: BloodGroup[] = [
  "A Positive", "A Negative", "B Positive", "B Negative",
  "O Positive", "O Negative", "AB Positive", "AB Negative",
  "A1 Positive", "A1B Positive", "A2 Positive", "A2 Negative",
  "A2B Positive", "A2B Negative", "Bombay Blood Group", "Do not Know",
]

// Weighted common groups (rare ones rarely chosen, matching <5 records spirit)
const COMMON_GROUPS: BloodGroup[] = [
  "O Positive", "O Positive", "O Positive", "B Positive", "B Positive",
  "A Positive", "A Positive", "AB Positive", "O Negative", "B Negative",
  "A Negative", "A1 Positive", "A2 Positive",
]

const GENDERS: (Gender | null)[] = ["Male", "Female", "Non-binary", "Prefer not to say", "Other"]

const INACTIVE_REASONS = [
  "Relocated out of service area",
  "Medical deferral",
  "Unreachable after 3 attempts",
  "Requested to pause",
  "Recently donated elsewhere",
  "Age / health ineligibility",
]

// Hashed-hex opaque id
function hexId(rng: () => number, len = 24): string {
  let s = ""
  const chars = "0123456789abcdef"
  for (let i = 0; i < len; i++) s += chars[Math.floor(rng() * 16)]
  return s
}

function isoDaysAgo(days: number, base: Date): string {
  return new Date(base.getTime() - days * 86400000).toISOString().slice(0, 10)
}
function isoDaysAhead(days: number, base: Date): string {
  return new Date(base.getTime() + days * 86400000).toISOString().slice(0, 10)
}

// Scaled-down counts preserving the production proportions.
// Real: Guest 2420, Emergency 2385, Bridge 2061, Patient 84, Volunteer 83.
const ROLE_COUNTS: Record<Role, number> = {
  Guest: 242,
  "Emergency Donor": 238,
  "Bridge Donor": 206,
  Patient: 42,
  Volunteer: 24,
}

// Approx geo box around India for plausible coords.
function geo(rng: () => number): { lat: number; lng: number } {
  return {
    lat: 8 + rng() * 27, // ~8N–35N
    lng: 68 + rng() * 22, // ~68E–90E
  }
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

let CACHE: User[] | null = null

export function getDataset(): User[] {
  if (CACHE) return CACHE
  const rng = mulberry32(20250823)
  const base = new Date("2026-06-06T00:00:00Z")
  const users: User[] = []

  // Pre-create patients first so we can wire bridges to bridge donors.
  const patients: User[] = []

  const newBase = (role: Role): User => ({
    user_id: hexId(rng),
    role,
    role_status: rng() > 0.05,
    blood_group: null,
    gender: null,
    latitude: null,
    longitude: null,
    registration_date: null,
    donor_type: "Other",
    donations_till_date: null,
    last_donation_date: null,
    next_eligible_date: null,
    eligibility_status: "not eligible",
    cycle_of_donations: 0,
    frequency_in_days: 0,
    donated_earlier: null,
    total_calls: 0,
    last_contacted_date: null,
    calls_to_donations_ratio: null,
    status: "active",
    user_donation_active_status: "Active",
    inactive_trigger_comment: null,
    bridge_id: null,
    bridge_status: false,
    status_of_bridge: false,
    bridge_gender: null,
    bridge_blood_group: null,
    quantity_required: null,
    last_transfusion_date: null,
    expected_next_transfusion_date: null,
    last_bridge_donation_date: null,
  })

  const withGeo = (u: User) => {
    // 99.7% have coords
    if (rng() > 0.003) {
      const g = geo(rng)
      u.latitude = +g.lat.toFixed(4)
      u.longitude = +g.lng.toFixed(4)
    }
  }

  const withGender = (u: User) => {
    // 59% null
    u.gender = rng() < 0.59 ? null : pick(rng, GENDERS.filter(Boolean) as Gender[])
  }

  const withBloodGroup = (u: User, forceCommon = false) => {
    // 27% null overall
    if (rng() < 0.27) {
      u.blood_group = null
    } else {
      u.blood_group = forceCommon
        ? pick(rng, COMMON_GROUPS)
        : rng() < 0.97
          ? pick(rng, COMMON_GROUPS)
          : pick(rng, ALL_GROUPS)
    }
  }

  const withRegistration = (u: User) => {
    u.registration_date = isoDaysAgo(Math.floor(rng() * 1400) + 1, base)
  }

  // Active/inactive: target ~ 682 / total in real -> ~ 9.4%. Apply to donors.
  const applyActiveStatus = (u: User) => {
    const inactive = rng() < 0.094
    if (inactive) {
      u.user_donation_active_status = "Inactive"
      u.inactive_trigger_comment = pick(rng, INACTIVE_REASONS)
    }
  }

  // ── Patients ──────────────────────────────────────────────────────────────
  for (let i = 0; i < ROLE_COUNTS.Patient; i++) {
    const u = newBase("Patient")
    withGeo(u)
    withGender(u)
    withBloodGroup(u, true)
    withRegistration(u)
    u.donor_type = "Other"
    u.bridge_blood_group = u.blood_group ?? pick(rng, COMMON_GROUPS)
    u.bridge_gender = rng() > 0.5 ? "Male" : "Female"
    u.quantity_required = (Math.floor(rng() * 3) + 1) as 1 | 2 | 3
    const lastT = Math.floor(rng() * 25)
    u.last_transfusion_date = isoDaysAgo(lastT, base)
    u.expected_next_transfusion_date = isoDaysAhead(Math.max(1, 21 - lastT + Math.floor(rng() * 6)), base)
    // ~80% currently have an active matched bridge
    if (rng() < 0.8) {
      u.bridge_id = hexId(rng)
      u.bridge_status = true
      u.status_of_bridge = true
      u.last_bridge_donation_date = isoDaysAgo(lastT + Math.floor(rng() * 4), base)
    }
    applyActiveStatus(u)
    patients.push(u)
    users.push(u)
  }

  const unmatchedPatients = patients.filter((p) => p.bridge_id)
  let bridgeAssignIndex = 0

  // ── Bridge Donors ───────────────────────────────────────────────────────────
  for (let i = 0; i < ROLE_COUNTS["Bridge Donor"]; i++) {
    const u = newBase("Bridge Donor")
    withGeo(u)
    withGender(u)
    withBloodGroup(u, true)
    withRegistration(u)
    u.donor_type = "Regular Donor"
    u.frequency_in_days = pick(rng, [21, 21, 21, 28, 90])
    u.donations_till_date = Math.floor(rng() * 40) + 1
    u.cycle_of_donations = Math.floor(rng() * u.donations_till_date)
    u.donated_earlier = true
    const lastD = Math.floor(rng() * u.frequency_in_days * 1.4)
    u.last_donation_date = isoDaysAgo(lastD, base)
    u.next_eligible_date = isoDaysAhead(u.frequency_in_days - lastD, base)
    u.eligibility_status = u.next_eligible_date && new Date(u.next_eligible_date) <= base ? "eligible" : (rng() > 0.5 ? "eligible" : "not eligible")
    // outreach
    u.total_calls = Math.floor(rng() * 24)
    if (u.total_calls > 0) {
      u.last_contacted_date = rng() < 0.73 ? null : isoDaysAgo(Math.floor(rng() * 120), base)
      u.calls_to_donations_ratio = +(u.total_calls / Math.max(1, u.donations_till_date)).toFixed(2)
    }
    applyActiveStatus(u)

    // Only ~30% (≈625/2061) have an active status_of_bridge; match to a patient.
    if (rng() < 0.3 && bridgeAssignIndex < unmatchedPatients.length) {
      const p = unmatchedPatients[bridgeAssignIndex++]
      u.bridge_id = p.bridge_id
      u.bridge_status = true
      u.status_of_bridge = true
      if (p.bridge_blood_group) u.blood_group = p.bridge_blood_group
      u.frequency_in_days = 21
    }
    users.push(u)
  }

  // ── Emergency Donors ──────────────────────────────────────────────────────────
  for (let i = 0; i < ROLE_COUNTS["Emergency Donor"]; i++) {
    const u = newBase("Emergency Donor")
    withGeo(u)
    withGender(u)
    withBloodGroup(u)
    withRegistration(u)
    u.donor_type = "One-Time Donor"
    u.frequency_in_days = 0 // irregular
    // 75% have no donation history
    if (rng() < 0.25) {
      u.donations_till_date = Math.floor(rng() * 5) + 1
      u.cycle_of_donations = u.donations_till_date
      u.donated_earlier = true
      const lastD = Math.floor(rng() * 200)
      u.last_donation_date = isoDaysAgo(lastD, base)
      u.next_eligible_date = isoDaysAhead(Math.max(0, 90 - lastD), base)
      u.eligibility_status = lastD >= 90 ? "eligible" : "not eligible"
    } else {
      u.donated_earlier = rng() > 0.5
      u.eligibility_status = "eligible"
    }
    u.total_calls = Math.floor(rng() * 10)
    if (u.total_calls > 0) {
      u.last_contacted_date = rng() < 0.73 ? null : isoDaysAgo(Math.floor(rng() * 120), base)
      if (u.donations_till_date) {
        u.calls_to_donations_ratio = +(u.total_calls / u.donations_till_date).toFixed(2)
      }
    }
    applyActiveStatus(u)
    users.push(u)
  }

  // ── Guests ────────────────────────────────────────────────────────────────────
  for (let i = 0; i < ROLE_COUNTS.Guest; i++) {
    const u = newBase("Guest")
    withGeo(u)
    withGender(u)
    withBloodGroup(u)
    withRegistration(u)
    u.role_status = false
    u.donor_type = "Other"
    u.eligibility_status = "not eligible"
    u.total_calls = Math.floor(rng() * 6)
    if (u.total_calls > 0 && rng() > 0.73) {
      u.last_contacted_date = isoDaysAgo(Math.floor(rng() * 150), base)
    }
    users.push(u)
  }

  // ── Volunteers ──────────────────────────────────────────────────────────────────
  for (let i = 0; i < ROLE_COUNTS.Volunteer; i++) {
    const u = newBase("Volunteer")
    withGeo(u)
    withGender(u)
    withBloodGroup(u)
    withRegistration(u)
    u.donor_type = "Other"
    u.eligibility_status = "not eligible"
    u.total_calls = Math.floor(rng() * 24)
    u.last_contacted_date = isoDaysAgo(Math.floor(rng() * 40), base)
    users.push(u)
  }

  CACHE = users
  return users
}

// Mutating helpers (in-memory persistence for the demo session).
export function updateUser(id: string, patch: Partial<User>): User | null {
  const ds = getDataset()
  const u = ds.find((x) => x.user_id === id)
  if (!u) return null
  Object.assign(u, patch)
  return u
}

export function findUser(id: string): User | null {
  return getDataset().find((x) => x.user_id === id) ?? null
}
