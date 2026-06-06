import { type NextRequest, NextResponse } from "next/server"
import { findUser } from "@/lib/blood/dataset"
import { updateUser } from "@/lib/blood/dataset"

// GET /api/users/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const user = findUser(id)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json(user)
}

// PATCH /api/users/:id  — update role, status, eligibility, etc.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const patch = await req.json()
  const updated = updateUser(id, patch)
  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json(updated)
}
