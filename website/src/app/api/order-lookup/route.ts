import { NextResponse } from "next/server"
import { findForCustomer, publicOrder } from "@/lib/server/orders-store"

/** Find an order with its number and the email it was placed with. */
export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}))
  const o = await findForCustomer(String(b?.orderNumber ?? "").trim().toUpperCase(), { email: String(b?.email ?? "") })
  if (!o) {
    await new Promise((r) => setTimeout(r, 500))
    return NextResponse.json({ error: "We couldn't find an order with that number and email. Check both and try again." }, { status: 404 })
  }
  return NextResponse.json({ key: o.key, order: publicOrder(o) })
}
