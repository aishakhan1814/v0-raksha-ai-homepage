// ─── Computed / Derived Field Layer ─────────────────────────────────────────────
// Pure functions over the User entity. No side effects.

import type { BloodGroup, User } from "./types"

// Treat "today" consistently. Dates in the dataset are ISO strings.
function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function parse(date: string | null): Date | null {
  if (!date) return null
  const d = new Date(date)
  return isNaN(d.getTime()) ? null : d
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000)
}

// Rare groups treated as critical shortage by default.
export const RARE_GROUPS: BloodGroup[] = [
  "Bombay Blood Group",
  "A2B Negative",
  "A2B Positive",
]

export function isRareBloodGroup(bg: BloodGroup | null): boolean {
  return bg !== null && RARE_GROUPS.includes(bg)
}

// Color band for a blood group badge by rarity.
export function bloodGroupRarity(
  bg: BloodGroup | null,
): "critical" | "scarce" | "standard" | "unknown" {
  if (!bg || bg === "Do not Know") return "unknown"
  if (RARE_GROUPS.includes(bg)) return "critical"
  if (bg === "O Negative") return "scarce"
  return "standard"
}

/**
 * A donor is eligible to donate when ALL of these are true:
 *  - eligibility_status === "eligible"
 *  - user_donation_active_status === "Active"
 *  - next_eligible_date is today or in the past (or null = never donated = eligible)
 *  - role_status === true
 */
export function isDonorEligibleToday(user: User, now: Date = new Date()): boolean {
  if (user.eligibility_status !== "eligible") return false
  if (user.user_donation_active_status !== "Active") return false
  if (!user.role_status) return false
  const next = parse(user.next_eligible_date)
  if (next === null) return true // never donated -> eligible
  return daysBetween(next, now) <= 0
}

/** Days until next eligible to donate. Negative => already eligible/overdue. */
export function daysUntilEligible(user: User, now: Date = new Date()): number | null {
  // Derive next_eligible_date from last_donation_date + frequency_in_days if missing.
  let next = parse(user.next_eligible_date)
  if (next === null) {
    const last = parse(user.last_donation_date)
    if (last === null) return null // never donated
    const freq = user.frequency_in_days > 0 ? user.frequency_in_days : 90
    next = new Date(last.getTime() + freq * 86400000)
  }
  return daysBetween(next, now)
}

/** Past next_eligible_date and still has not donated again. */
export function isDonationOverdue(user: User, now: Date = new Date()): boolean {
  const d = daysUntilEligible(user, now)
  if (d === null) return false
  return d < 0 && user.eligibility_status === "eligible"
}

/** Whether a patient's next transfusion is within N days. */
export function isTransfusionImminent(
  patient: User,
  withinDays: number,
  now: Date = new Date(),
): boolean {
  const next = parse(patient.expected_next_transfusion_date)
  if (next === null) return false
  const d = daysBetween(next, now)
  return d >= 0 && d <= withinDays
}

/** Conversion quality of outreach effort. */
export function outreachEfficiency(
  user: User,
): "high" | "medium" | "low" | null {
  const r = user.calls_to_donations_ratio
  if (r === null) return null
  if (r < 1.5) return "high"
  if (r <= 3) return "medium"
  return "low"
}

/** A bridge is at risk when the donor is not eligible but transfusion is soon. */
export function isBridgeAtRisk(
  donor: User | null,
  patient: User | null,
  now: Date = new Date(),
): boolean {
  if (!donor || !patient) return true // missing side = at risk
  if (!patient.status_of_bridge) return true
  if (isTransfusionImminent(patient, 3, now) && !isDonorEligibleToday(donor, now)) {
    return true
  }
  return false
}

/** Last contacted more than `days` ago (or never). */
export function isContactOverdue(
  user: User,
  days = 30,
  now: Date = new Date(),
): boolean {
  const last = parse(user.last_contacted_date)
  if (last === null) return true
  return daysBetween(now, last) > days
}

/** Days since the user was last contacted (null = never). */
export function daysSinceContact(user: User, now: Date = new Date()): number | null {
  const last = parse(user.last_contacted_date)
  if (last === null) return null
  return daysBetween(now, last)
}
