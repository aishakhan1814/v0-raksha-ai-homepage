import { type NextRequest, NextResponse } from "next/server"
import { logCall } from "@/lib/blood/service"

// POST /api/calls/log — log an outreach call
export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })
  const updated = logCall(userId)
  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json(updated)
}
