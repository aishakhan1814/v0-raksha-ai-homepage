import { type NextRequest, NextResponse } from "next/server"
import { getBridges, matchBridge } from "@/lib/blood/service"

// GET /api/bridges — all active bridge pairs
export async function GET() {
  return NextResponse.json({ bridges: getBridges() })
}

// POST /api/bridges/match — auto-match patient to best donor
// (Also accepted here for convenience: { patientId })
export async function POST(req: NextRequest) {
  const { patientId } = await req.json()
  if (!patientId) return NextResponse.json({ error: "patientId required" }, { status: 400 })
  const result = matchBridge(patientId)
  return NextResponse.json(result, { status: result.ok ? 200 : 409 })
}
