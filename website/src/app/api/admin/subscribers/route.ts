import { NextResponse } from "next/server"
import { denied } from "@/lib/admin/server"
import { listSubscribers, removeSubscriber, setSubscriberStatus, subscribe } from "@/lib/server/people"
import { requestOrigin } from "@/lib/server/place-order"

export const dynamic = "force-dynamic"

/** GET list · POST { email, name } add someone who agreed in person · PATCH { id, status } · DELETE { id } */
export async function GET(request: Request) {
  const no = denied(request)
  if (no) return no
  return NextResponse.json(await listSubscribers())
}
export async function POST(request: Request) {
  const no = denied(request)
  if (no) return no
  const b = await request.json().catch(() => ({}))
  if (!b?.agreed) return NextResponse.json({ error: "Only add people who said yes to getting emails." }, { status: 400 })
  const r = await subscribe({ email: String(b?.email ?? ""), name: String(b?.name ?? ""), source: "Added in the control center", origin: await requestOrigin() })
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: 400 })
}
export async function PATCH(request: Request) {
  const no = denied(request)
  if (no) return no
  const b = await request.json().catch(() => ({}))
  const status = b?.status === "subscribed" ? "subscribed" : "unsubscribed"
  return NextResponse.json(await setSubscriberStatus(String(b?.id ?? ""), status))
}
export async function DELETE(request: Request) {
  const no = denied(request)
  if (no) return no
  const b = await request.json().catch(() => ({}))
  await removeSubscriber(String(b?.id ?? ""))
  return NextResponse.json({ ok: true })
}
