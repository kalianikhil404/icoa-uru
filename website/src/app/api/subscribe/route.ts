import { NextResponse } from "next/server"
import { subscribe } from "@/lib/server/people"
import { requestOrigin } from "@/lib/server/place-order"

/** Newsletter sign-up: saves the email (with proof of consent) and sends the welcome email. */
export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}))
  if (b?.company) return NextResponse.json({ ok: true }) // spam bot
  const r = await subscribe({
    email: String(b?.email ?? ""),
    name: typeof b?.name === "string" ? b.name.slice(0, 80) : undefined,
    source: typeof b?.source === "string" ? b.source.slice(0, 40) : "Newsletter form",
    visitorId: typeof b?.visitorId === "string" ? b.visitorId : undefined,
    origin: await requestOrigin(),
  })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json({ ok: true, isNew: r.isNew })
}
