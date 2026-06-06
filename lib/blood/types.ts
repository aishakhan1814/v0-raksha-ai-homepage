// ─── Blood Bridge Coordination — Core Data Model ───────────────────────────────
// Implemented exactly to the dataset-derived spec.

export type BloodGroup =
  | "A Positive"
  | "A Negative"
  | "B Positive"
  | "B Negative"
  | "O Positive"
  | "O Negative"
  | "AB Positive"
  | "AB Negative"
  | "A1 Positive"
  | "A1B Positive"
  | "A2 Positive"
  | "A2 Negative"
  | "A2B Positive"
  | "A2B Negative"
  | "Bombay Blood Group"
  | "Do not Know"

export type Role =
  | "Guest"
  | "Emergency Donor"
  | "Bridge Donor"
  | "Patient"
  | "Volunteer"

export type DonorType = "One-Time Donor" | "Regular Donor" | "Other"

export type EligibilityStatus = "eligible" | "not eligible"

export type ActiveStatus = "Active" | "Inactive"

export type Gender =
  | "Male"
  | "Female"
  | "Non-binary"
  | "Prefer not to say"
  | "Other"

export interface User {
  user_id: string // hashed UUID
  role: Role
  role_status: boolean // whether role is confirmed/active
  blood_group: BloodGroup | null // ~27% of users have not set this
  gender: Gender | null
  latitude: number | null
  longitude: number | null
  registration_date: string | null // ISO datetime

  // Donation tracking
  donor_type: DonorType
  donations_till_date: number | null // null for non-donors (Guests, Patients)
  last_donation_date: string | null
  next_eligible_date: string | null
  eligibility_status: EligibilityStatus
  cycle_of_donations: number // 0 = never donated; max observed: 1958
  frequency_in_days: number // 0 = irregular; typical: 21, 28, 90
  donated_earlier: boolean | null

  // Outreach tracking
  total_calls: number // 0–23 range
  last_contacted_date: string | null
  calls_to_donations_ratio: number | null // e.g. 0.33, 1.0, 2.5

  // Status
  status: "active" // all records are active in current dataset
  user_donation_active_status: ActiveStatus
  inactive_trigger_comment: string | null // only populated for Inactive users

  // Bridge link (only for Bridge Donors and Patients)
  bridge_id: string | null
  bridge_status: boolean
  status_of_bridge: boolean // true = bridge is currently active/matched

  // Patient-side bridge fields (only when role = "Patient")
  bridge_gender: "Male" | "Female" | null
  bridge_blood_group: BloodGroup | null
  quantity_required: 1 | 2 | 3 | null // units of blood per transfusion cycle
  last_transfusion_date: string | null
  expected_next_transfusion_date: string | null
  last_bridge_donation_date: string | null
}

// ─── Aggregated dashboard KPIs ──────────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number
  byRole: Record<Role, number>
  eligibleDonorsToday: number
  activeBridges: number
  patientsTransfusionNext7Days: number
  inactiveCount: number
  inactiveByReason: Record<string, number>
  bloodGroupDemand: { bloodGroup: BloodGroup; demand: number; eligibleSupply: number; critical: boolean }[]
}

// ─── Paginated list response ────────────────────────────────────────────────────
export interface PaginatedUsers {
  data: User[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface BridgePair {
  bridge_id: string
  patient: User | null
  donor: User | null
  atRisk: boolean
}
