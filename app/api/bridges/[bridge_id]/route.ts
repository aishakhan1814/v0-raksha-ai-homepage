import { type NextRequest, NextResponse } from "next/server"
import { dissolveBridge } from "@/lib/blood/service"

// DELETE /api/bridges/:bridge_id — dissolve a bridge
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ bridge_id: string }> },
) {
  const { bridge_id } = await params
  const result = dissolveBridge(bridge_id)
  return NextResponse.json(result, { status: result.ok ? 200 : 404 })
}
