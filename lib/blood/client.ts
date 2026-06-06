// ─── Client-side helpers for the coordinator console ─────────────────────────────
"use client"

import type { BloodGroup, User } from "./types"

export const fetcher = (url: string) => fetch(url).then((r) => r.json())

export async function postJSON(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function patchJSON(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function del(url: string) {
  const res = await fetch(url, { method: "DELETE" })
  return res.json()
}

// Short, safe display id from a hashed hex id (never show raw).
export function shortId(id: string | null): string {
  if (!id) return "—"
  return id.slice(0, 6).toUpperCase()
}

// Rarity-based badge classes for blood groups.
export function bloodBadgeClass(bg: BloodGroup | null): string {
  if (!bg || bg === "Do not Know") return "bg-muted text-raksha-muted"
  if (["Bombay Blood Group", "A2B Negative", "A2B Positive"].includes(bg))
    return "bg-raksha-blood text-raksha-white"
  if (bg === "O Negative") return "bg-raksha-gold text-raksha-deep"
  return "bg-raksha-navy text-raksha-teal-light border border-raksha-teal/40"
}

export const ROLE_BADGE: Record<string, string> = {
  Guest: "bg-muted text-raksha-muted",
  "Emergency Donor": "bg-raksha-coral/20 text-raksha-coral",
  "Bridge Donor": "bg-raksha-teal/20 text-raksha-teal-light",
  Patient: "bg-raksha-blood/20 text-raksha-coral",
  Volunteer: "bg-raksha-gold/20 text-raksha-gold",
}

export function fmtDate(d: string | null): string {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export function fmtGender(g: User["gender"]): string {
  return g ?? "Not specified"
}

export function fmtBloodGroup(bg: BloodGroup | null): string {
  return bg ?? "Unknown"
}

export const ALL_BLOOD_GROUPS: BloodGroup[] = [
  "A Positive", "A Negative", "B Positive", "B Negative",
  "O Positive", "O Negative", "AB Positive", "AB Negative",
  "A1 Positive", "A1B Positive", "A2 Positive", "A2 Negative",
  "A2B Positive", "A2B Negative", "Bombay Blood Group", "Do not Know",
]
