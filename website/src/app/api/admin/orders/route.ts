import { NextResponse } from "next/server"
import { denied } from "@/lib/admin/server"
import { changeOrder, listOrders, ORDER_STATUSES, type OrderStatus } from "@/lib/server/orders-store"
import { sendStatusUpdate } from "@/lib/server/emails"
import { requestOrigin } from "@/lib/server/place-order"

export const dynamic = "force-dynamic"

/** GET: every order. PATCH: change status, tracking, notes; optionally email the customer. */
export async function GET(request: Request) {
  const no = denied(request)
  if (no) return no
  return NextResponse.json(await listOrders())
}

export async function PATCH(request: Request) {
  const no = denied(request)
  if (no) return no
  const b = await request.json().catch(() => ({}))
  const status = b?.status === undefined ? undefined : (ORDER_STATUSES as readonly string[]).includes(b.status) ? (b.status as OrderStatus) : null
  if (status === null) return NextResponse.json({ error: "Unknown status." }, { status: 400 })
  const str = (v: unknown, max = 600) => (typeof v === "string" ? v.slice(0, max) : undefined)
  const result = await changeOrder(String(b?.orderNumber ?? ""), {
    status,
    note: str(b?.note, 300),
    messageToCustomer: str(b?.messageToCustomer, 1200),
    carrier: str(b?.carrier, 40),
    trackingNumber: str(b?.trackingNumber, 80),
    trackingUrl: str(b?.trackingUrl, 400),
    privateNote: str(b?.privateNote, 2000),
  })
  if (!result) return NextResponse.json({ error: "That order wasn't found." }, { status: 404 })
  let email: { ok: boolean; preview?: boolean; skipped?: boolean; error?: string } | null = null
  if (b?.notify && (result.statusChanged || b?.resend)) email = await sendStatusUpdate(result.order, await requestOrigin())
  return NextResponse.json({ order: result.order, email })
}
