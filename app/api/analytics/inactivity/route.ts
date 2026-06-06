import { NextResponse } from "next/server"
import { getDashboardStats, inactiveUsers } from "@/lib/blood/service"

// GET /api/analytics/inactivity — inactive users with reasons
export async function GET() {
  const stats = getDashboardStats()
  return NextResponse.json({
    count: stats.inactiveCount,
    byReason: stats.inactiveByReason,
    users: inactiveUsers(),
  })
}
