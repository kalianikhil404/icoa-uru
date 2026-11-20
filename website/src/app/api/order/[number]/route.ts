import { NextResponse } from "next/server"
import { findForCustomer, publicOrder } from "@/lib/server/orders-store"

export const dynamic = "force-dynamic"

/** One order for its customer: GET /api/order/IU-XXXX?k=private-key */
export async function GET(request: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params
  const key = new URL(request.url).searchParams.get("k") ?? ""
  const o = await findForCustomer(number, { key })
  if (!o) return NextResponse.json({ error: "Order not found." }, { status: 404 })
  return NextResponse.json(publicOrder(o))
}
