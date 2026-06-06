import { type NextRequest, NextResponse } from "next/server"
import { patientTransfusion } from "@/lib/blood/service"

// GET /api/patients/:id/transfusion — upcoming transfusion schedule
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const result = patientTransfusion(id)
  if (!result) return NextResponse.json({ error: "Patient not found" }, { status: 404 })
  return NextResponse.json(result)
}
