import { NextResponse } from "next/server"
import { denied, listVersions, restoreVersion, saveVersion } from "@/lib/admin/server"

export const dynamic = "force-dynamic"

/** GET: saved versions. POST { label }: save one now. PUT { id }: go back to a version. */
export async function GET(request: Request) {
  const no = denied(request, { editor: true })
  if (no) return no
  return NextResponse.json(await listVersions())
}

export async function POST(request: Request) {
  const no = denied(request, { editor: true })
  if (no) return no
  const body = await request.json().catch(() => ({}))
  const version = await saveVersion(String(body?.label ?? "").slice(0, 80))
  return NextResponse.json(version)
}

export async function PUT(request: Request) {
  const no = denied(request, { editor: true })
  if (no) return no
  const body = await request.json().catch(() => ({}))
  try {
    await restoreVersion(String(body?.id ?? ""))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "That version couldn't be found." }, { status: 404 })
  }
}
