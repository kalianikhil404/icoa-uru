import { NextResponse } from "next/server"
import { findForCustomer, publicOrder } from "@/lib/server/orders-store"

/** The orders this browser remembers: [{ n: order number, k: private key }]. */
export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}))
  const refs = Array.isArray(b?.refs) ? b.refs.slice(0, 30) : []
  const out = []
  for (const r of refs) {
    const o = await findForCustomer(String(r?.n ?? ""), { key: String(r?.k ?? "") })
    if (o) out.push(publicOrder(o))
  }
  return NextResponse.json(out)
}
