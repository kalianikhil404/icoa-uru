import { NextResponse } from "next/server"
import { denied } from "@/lib/admin/server"
import { listCustomers } from "@/lib/server/people"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const no = denied(request)
  if (no) return no
  return NextResponse.json(await listCustomers())
}
