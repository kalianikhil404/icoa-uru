import { NextResponse } from "next/server"
import { isBot, track, type TrackEvent } from "@/lib/server/people"

const TYPES = new Set(["pageview", "product_view", "add_to_bag", "checkout_start"])

/** Anonymous visitor activity (only sent when the visitor hasn't said "No thanks"). */
export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? ""
  if (isBot(ua) || request.headers.get("sec-gpc") === "1") return new NextResponse(null, { status: 204 })
  const b = await request.json().catch(() => null)
  const id = String(b?.v ?? "")
  const session = String(b?.s ?? "")
  if (!/^[\w-]{8,64}$/.test(id) || !/^[\w-]{4,64}$/.test(session) || !TYPES.has(b?.type)) return new NextResponse(null, { status: 204 })
  const event: TrackEvent = {
    type: b.type,
    path: typeof b.path === "string" ? b.path.slice(0, 200) : undefined,
    slug: typeof b.slug === "string" ? b.slug.slice(0, 80) : undefined,
    ref: typeof b.ref === "string" ? b.ref.slice(0, 300) : undefined,
    value: Number.isFinite(b.value) ? Number(b.value) : undefined,
    title: typeof b.title === "string" ? b.title : undefined,
  }
  const h = request.headers
  const city = h.get("x-vercel-ip-city")
  await track({
    visitorId: id,
    sessionId: session,
    event,
    ua,
    geo: { country: h.get("x-vercel-ip-country") ?? undefined, region: h.get("x-vercel-ip-country-region") ?? undefined, city: city ? decodeURIComponent(city) : undefined },
  }).catch((e) => console.error("track failed", e))
  return new NextResponse(null, { status: 204 })
}
