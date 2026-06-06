import { NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/blood/service"

// GET /api/dashboard/stats
export async function GET() {
  return NextResponse.json(getDashboardStats())
}
