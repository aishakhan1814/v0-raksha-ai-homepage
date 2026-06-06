// lib/data.ts
// ─────────────────────────────────────────────────────────────────────────────
// REAL DATA from your CSV dataset (7,033 records)
// Every number, chart, and stat in your app reads from here.
// To refresh: re-run the analysis script and paste updated values here.
// ─────────────────────────────────────────────────────────────────────────────

// ── HEADLINE STATS ────────────────────────────────────────────────────────────
export const STATS = {
  totalUsers:        7033,
  activeDonors:      3768,   // role = Donor + status = Active
  totalPatients:     84,
  eligibleDonors:    6464,
  totalDonations:    2572,
  bridgeDonors:      2061,
  emergencyDonors:   2385,
  fulfilmentRate:    "97.3%",   // your existing brand metric
  avgDonorCircle:    "4.2",
} as const;

// ── BLOOD GROUP DISTRIBUTION ──────────────────────────────────────────────────
export interface BloodGroupStat {
  group: string;
  count: number;
  color: string;
}

export const BLOOD_GROUPS: BloodGroupStat[] = [
  { group: "O+",  count: 1963, color: "#C0152A" },
  { group: "B+",  count: 1481, color: "#9B2335" },
  { group: "A+",  count: 879,  color: "#8B1A2A" },
  { group: "AB+", count: 353,  color: "#2CA8A0" },
  { group: "O−",  count: 120,  color: "#4CC9C1" },
  { group: "B−",  count: 94,   color: "#E8897A" },
  { group: "A−",  count: 53,   color: "#D4A847" },
  { group: "AB−", count: 35,   color: "#6B7280" },
];

// ── DONOR TYPE BREAKDOWN ──────────────────────────────────────────────────────
export interface DonorTypeStat {
  type: string;
  count: number;
  color: string;
}

export const DONOR_TYPES: DonorTypeStat[] = [
  { type: "One-Time Donor", count: 2385, color: "#C0152A" },
  { type: "Regular Donor",  count: 2061, color: "#2CA8A0" },
];

// ── ROLE DISTRIBUTION ─────────────────────────────────────────────────────────
export const ROLES = [
  { role: "Guest",           count: 2420, color: "#6B7280" },
  { role: "Emergency Donor", count: 2385, color: "#C0152A" },
  { role: "Bridge Donor",    count: 2061, color: "#2CA8A0" },
  { role: "Patient",         count: 84,   color: "#E8897A" },
  { role: "Volunteer",       count: 83,   color: "#D4A847" },
];

// ── GENDER SPLIT ──────────────────────────────────────────────────────────────
export const GENDER_SPLIT = [
  { gender: "Male",             count: 2444, pct: 84.3 },
  { gender: "Female",           count: 391,  pct: 13.5 },
  { gender: "Prefer not to say",count: 39,   pct: 1.3  },
  { gender: "Other/Non-binary", count: 2,    pct: 0.1  },
];

// ── MONTHLY REGISTRATIONS (last 12 months) ───────────────────────────────────
export interface MonthStat {
  month: string;   // "Sep '24"
  count: number;
}

export const MONTHLY_REGISTRATIONS: MonthStat[] = [
  { month: "Sep '24", count: 23   },
  { month: "Oct '24", count: 190  },
  { month: "Nov '24", count: 175  },
  { month: "Dec '24", count: 487  },
  { month: "Jan '25", count: 39   },
  { month: "Feb '25", count: 248  },
  { month: "Mar '25", count: 42   },
  { month: "Apr '25", count: 198  },
  { month: "May '25", count: 330  },
  { month: "Jun '25", count: 1848 },
  { month: "Jul '25", count: 1699 },
  { month: "Aug '25", count: 370  },
];

// ── ELIGIBILITY STATUS ────────────────────────────────────────────────────────
export const ELIGIBILITY = {
  eligible:    6464,
  notEligible: 569,
  eligiblePct: Math.round((6464 / 7033) * 100), // 91%
};

// ── ACTIVE vs INACTIVE ────────────────────────────────────────────────────────
export const ACTIVITY_STATUS = {
  active:   6351,
  inactive: 682,
  activePct: Math.round((6351 / 7033) * 100), // 90%
};

// ── CITY / LOCATION (Hyderabad — lat/lng from dataset) ───────────────────────
export const DATASET_LOCATION = {
  city: "Hyderabad",
  state: "Telangana",
  lat: 17.3922792,
  lng: 78.4602749,
};

// ── HELPER: format large numbers ─────────────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

// ── HELPER: get top N blood groups ───────────────────────────────────────────
export function topBloodGroups(n = 4): BloodGroupStat[] {
  return [...BLOOD_GROUPS].sort((a, b) => b.count - a.count).slice(0, n);
}