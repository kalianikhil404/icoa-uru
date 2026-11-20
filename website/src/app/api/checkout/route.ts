import { NextResponse } from "next/server"
import Stripe from "stripe"
import { orderRequestSchema } from "@/lib/schemas"
import { newOrderNumber, priceOrder } from "@/lib/orders"
import { shippingMethods, shop, site, sizeLabel } from "@/content/site"
import { collection } from "@/lib/server/db"
import { buildOrder, requestOrigin } from "@/lib/server/place-order"
import type { Order } from "@/lib/server/orders-store"

/* Card payments with Stripe Checkout (optional).
   Turn on: add STRIPE_SECRET_KEY to .env.local and set NEXT_PUBLIC_STRIPE_ENABLED=true.
   Paid orders appear in your Stripe dashboard, and Stripe emails the receipt. */
export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return NextResponse.json({ error: "Card payments aren't set up yet. Choose Interac e-Transfer instead." }, { status: 501 })
  }
  const parsed = orderRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Some details are missing. Check the form and try again." }, { status: 400 })
  const order = parsed.data
  const priced = priceOrder(order)
  if ("error" in priced) return NextResponse.json({ error: priced.error }, { status: 409 })

  const stripe = new Stripe(key)
  const origin = request.headers.get("origin") ?? (await requestOrigin()) ?? site.url
  const orderNumber = newOrderNumber()
  // kept aside until Stripe confirms the payment (see /api/checkout/confirm)
  await collection<Order>("pending-card").put(orderNumber, buildOrder(order, priced, { orderNumber, paymentMethod: "card" }))
  const ship = shippingMethods.find((m) => m.id === order.shippingId)
  const factor = priced.totals.subtotal ? (priced.totals.subtotal - priced.totals.discount) / priced.totals.subtotal : 1

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = priced.lines.map((l) => ({
    quantity: l.quantity,
    price_data: {
      currency: shop.currency.toLowerCase(),
      unit_amount: Math.round(l.unitPrice * factor * 100),
      product_data: {
        name: l.name,
        description: [l.size && sizeLabel(l.size), l.personalization && `Name: ${l.personalization}`, l.giftWrap && "Gift wrap"]
          .filter(Boolean)
          .join(", ") || undefined,
      },
    },
  }))
  if (priced.totals.shipping > 0) {
    line_items.push({
      quantity: 1,
      price_data: { currency: shop.currency.toLowerCase(), unit_amount: Math.round(priced.totals.shipping * 100), product_data: { name: ship?.label ?? "Shipping" } },
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    customer_email: order.email,
    success_url: `${origin}/checkout/success?order=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout`,
    metadata: {
      orderNumber,
      name: `${order.firstName} ${order.lastName}`,
      address: `${order.address1} ${order.address2 ?? ""}, ${order.city}, ${order.province} ${order.postalCode}, ${order.country}`.slice(0, 480),
      shipping: ship?.label ?? "",
      giftNote: (order.giftNote ?? "").slice(0, 480),
      note: (order.note ?? "").slice(0, 480),
      designs: priced.lines.filter((l) => l.design).map((l) => `${l.design!.rows}x${l.design!.cols}:${l.design!.cells}`).join(" | ").slice(0, 480),
    },
  })
  return NextResponse.json({ url: session.url })
}
