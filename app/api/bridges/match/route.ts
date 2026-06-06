import { type NextRequest, NextResponse } from "next/server"
import { matchBridge } from "@/lib/blood/service"

// POST /api/bridges/match — auto-match patient to best donor
export async function POST(req: NextRequest) {
  const { patientId } = await req.json()
  if (!patientId) return NextResponse.json({ error: "patientId required" }, { status: 400 })
  const result = matchBridge(patientId)
  return NextResponse.json(result, { status: result.ok ? 200 : 409 })
}
