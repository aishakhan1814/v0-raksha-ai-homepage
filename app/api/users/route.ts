import { type NextRequest, NextResponse } from "next/server"
import { queryUsers, type UserFilters } from "@/lib/blood/service"
import type {
  ActiveStatus,
  BloodGroup,
  DonorType,
  EligibilityStatus,
  Gender,
  Role,
} from "@/lib/blood/types"

// GET /api/users?role=&eligibility=&blood_group=&status=&page=&limit=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const num = (v: string | null) => (v ? Number.parseInt(v, 10) : undefined)
  const bool = (v: string | null) =>
    v === null ? undefined : v === "true" ? true : v === "false" ? false : undefined

  const filters: UserFilters = {
    role: (sp.get("role") as Role) ?? undefined,
    eligibility: (sp.get("eligibility") as EligibilityStatus) ?? undefined,
    blood_group: (sp.get("blood_group") as BloodGroup) ?? undefined,
    status: (sp.get("status") as ActiveStatus) ?? undefined,
    donor_type: (sp.get("donor_type") as DonorType) ?? undefined,
    status_of_bridge: bool(sp.get("status_of_bridge")),
    gender: (sp.get("gender") as Gender) ?? undefined,
    search: sp.get("search") ?? undefined,
    page: num(sp.get("page")),
    limit: num(sp.get("limit")),
  }

  return NextResponse.json(queryUsers(filters))
}
