import { NextResponse } from "next/server"
import { unsubscribe } from "@/lib/server/people"

/** POST ?t=token (also used by the "Unsubscribe" button some inboxes show). */
export async function POST(request: Request) {
  const url = new URL(request.url)
  const body = await request.json().catch(() => ({}))
  const token = url.searchParams.get("t") ?? String(body?.t ?? "")
  const sub = await unsubscribe(token)
  if (!sub) return NextResponse.json({ error: "That link has expired or was already used." }, { status: 404 })
  return NextResponse.json({ ok: true, email: sub.email })
}
