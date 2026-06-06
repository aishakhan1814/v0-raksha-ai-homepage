import { type NextRequest, NextResponse } from "next/server"
import { eligibleDonors } from "@/lib/blood/service"
import type { BloodGroup } from "@/lib/blood/types"

// GET /api/donors/eligible?blood_group= — eligible donors for emergency
export async function GET(req: NextRequest) {
  const bg = req.nextUrl.searchParams.get("blood_group") as BloodGroup | null
  const donors = eligibleDonors(bg ?? undefined)
  return NextResponse.json({ count: donors.length, donors })
}
