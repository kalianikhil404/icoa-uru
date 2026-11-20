import { NextResponse } from "next/server"
import Stripe from "stripe"
import { collection } from "@/lib/server/db"
import { getOrder, type Order } from "@/lib/server/orders-store"
import { completeOrder, requestOrigin } from "@/lib/server/place-order"

/** After paying by card, the thank-you page calls this. Once Stripe says it's paid, the order is saved and emailed. */
export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY
  const body = await request.json().catch(() => ({}))
  const orderNumber = String(body?.orderNumber ?? "")
  const sessionId = String(body?.sessionId ?? "")
  if (!key || !orderNumber || !sessionId) return NextResponse.json({ error: "Missing details." }, { status: 400 })

  const existing = await getOrder(orderNumber)
  if (existing?.stripeSession === sessionId) return NextResponse.json({ orderNumber, key: existing.key })

  const session = await new Stripe(key).checkout.sessions.retrieve(sessionId).catch(() => null)
  if (!session || session.metadata?.orderNumber !== orderNumber || session.payment_status !== "paid") {
    return NextResponse.json({ error: "We couldn't confirm that payment yet." }, { status: 409 })
  }
  const pending = collection<Order>("pending-card")
  const order = await pending.get(orderNumber)
  if (!order) return NextResponse.json({ error: "That order wasn't found." }, { status: 404 })
  const now = new Date().toISOString()
  const paid: Order = { ...order, status: "paid", history: [...order.history, { status: "paid", at: now }], updatedAt: now, stripeSession: sessionId }
  await completeOrder(paid, await requestOrigin())
  await pending.remove(orderNumber)
  return NextResponse.json({ orderNumber, key: paid.key })
}
