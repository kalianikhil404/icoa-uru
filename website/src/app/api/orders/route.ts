import { NextResponse } from "next/server"
import { orderRequestSchema } from "@/lib/schemas"
import { newOrderNumber, priceOrder } from "@/lib/orders"
import { buildOrder, completeOrder, requestOrigin } from "@/lib/server/place-order"

/* Receives an order from the checkout page (e-Transfer orders).
   It's saved (so the customer can follow it and you can manage it in the
   control center), and emailed to you and to the customer. */
export async function POST(request: Request) {
  const parsed = orderRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Some details are missing. Check the highlighted fields and try again." }, { status: 400 })
  }
  const req = parsed.data
  if (req.company) return NextResponse.json({ orderNumber: "IU-0", total: 0, lines: [] }) // spam bot

  const priced = priceOrder(req)
  if ("error" in priced) return NextResponse.json({ error: priced.error }, { status: 409 })

  const order = buildOrder(req, priced, { orderNumber: newOrderNumber(), paymentMethod: "etransfer" })
  await completeOrder(order, await requestOrigin())

  return NextResponse.json({
    orderNumber: order.orderNumber,
    key: order.key,
    total: order.totals.total,
    lines: order.lines.map((l) => ({ name: l.name, quantity: l.quantity, size: l.sizeText, lineTotal: l.lineTotal })),
  })
}
