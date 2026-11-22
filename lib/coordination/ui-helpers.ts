/**
 * RAKSHAI COORDINATION DASHBOARD UI HELPERS
 * 
 * Pure functions for PII masking, date formatting, badge styling,
 * metrics aggregation, and query filtering.
 */

import type { RequestStatus, UrgencyLevel } from "./types.ts";

export function maskPhoneNumber(phone?: string): string {
  if (!phone) return "—";
  if (phone.includes("*")) return phone;
  const cleaned = phone.trim();
  if (cleaned.length < 8) return "***";
  return cleaned.substring(0, 5) + " *** " + cleaned.slice(-3);
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function getStatusBadge(status: RequestStatus) {
  switch (status) {
    case "CREATED":
      return { label: "Created", bg: "bg-blue-900/30", text: "text-blue-400", border: "border-blue-500/40" };
    case "MATCHING":
      return { label: "Matching", bg: "bg-purple-900/30", text: "text-purple-400", border: "border-purple-500/40" };
    case "PENDING_COORDINATOR_REVIEW":
      return { label: "Review Required", bg: "bg-amber-900/30", text: "text-amber-400", border: "border-amber-500/40" };
    case "COORDINATOR_APPROVED":
      return { label: "Approved", bg: "bg-emerald-900/30", text: "text-emerald-400", border: "border-emerald-500/40" };
    case "COORDINATOR_REJECTED":
      return { label: "Rejected", bg: "bg-rose-900/30", text: "text-rose-400", border: "border-rose-500/40" };
    case "OUTREACH_PENDING":
      return { label: "Outreach Pending", bg: "bg-cyan-900/30", text: "text-cyan-400", border: "border-cyan-500/40" };
    case "OUTREACH_IN_PROGRESS":
      return { label: "Outreach Active", bg: "bg-teal-900/30", text: "text-teal-400", border: "border-teal-500/40" };
    case "AWAITING_RESPONSES":
      return { label: "Awaiting Responses", bg: "bg-indigo-900/30", text: "text-indigo-400", border: "border-indigo-500/40" };
    case "PARTIALLY_ACCEPTED":
      return { label: "Partially Accepted", bg: "bg-amber-900/30", text: "text-amber-300", border: "border-amber-400/40" };
    case "ACCEPTED_FULFILLED":
      return { label: "Fulfilled", bg: "bg-green-900/30", text: "text-green-400", border: "border-green-500/40" };
    case "ESCALATED":
      return { label: "Escalated", bg: "bg-red-900/40", text: "text-red-400", border: "border-red-500/60" };
    case "COMPLETED":
      return { label: "Completed", bg: "bg-zinc-800", text: "text-zinc-300", border: "border-zinc-700" };
    case "CANCELLED":
      return { label: "Cancelled", bg: "bg-gray-800", text: "text-gray-400", border: "border-gray-700" };
    default:
      return { label: status, bg: "bg-gray-800", text: "text-gray-400", border: "border-gray-700" };
  }
}

export function getUrgencyBadge(urgency?: UrgencyLevel) {
  switch (urgency) {
    case "CRITICAL":
      return { label: "CRITICAL", bg: "bg-red-900/40", text: "text-red-400", border: "border-red-500/50" };
    case "URGENT":
      return { label: "URGENT", bg: "bg-amber-900/40", text: "text-amber-400", border: "border-amber-500/50" };
    case "ROUTINE":
    default:
      return { label: "ROUTINE", bg: "bg-blue-900/30", text: "text-blue-400", border: "border-blue-500/30" };
  }
}
