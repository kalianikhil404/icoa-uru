import { NextResponse } from "next/server"
import { checkpointOnce, denied, isContentName, readAllContent, writeContent } from "@/lib/admin/server"

export const dynamic = "force-dynamic"

/** GET: all content files. PUT { name, data }: save one file. */
export async function GET(request: Request) {
  const no = denied(request, { editor: true })
  if (no) return no
  await checkpointOnce()
  return NextResponse.json(await readAllContent())
}

export async function PUT(request: Request) {
  const no = denied(request, { editor: true })
  if (no) return no
  const body = await request.json().catch(() => null)
  if (!body || !isContentName(body.name) || body.data === undefined || body.data === null) {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 })
  }
  try {
    const changed = await writeContent(body.name, body.data)
    return NextResponse.json({ ok: true, changed })
  } catch (e) {
    return NextResponse.json({ error: `Couldn't save: ${(e as Error).message}` }, { status: 500 })
  }
}
