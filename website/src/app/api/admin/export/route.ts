import { denied } from "@/lib/admin/server"
import { listCustomers, listSubscribers, listVisitors } from "@/lib/server/people"
import { listOrders } from "@/lib/server/orders-store"

export const dynamic = "force-dynamic"

const cell = (v: unknown) => {
  const s = Array.isArray(v) ? v.join(" | ") : v == null ? "" : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return ""
  const cols = Object.keys(rows[0])
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n")
}

/** GET ?type=orders|customers|subscribers|visitors → a spreadsheet (CSV) file */
export async function GET(request: Request) {
  const no = denied(request)
  if (no) return no
  const type = new URL(request.url).searchParams.get("type") ?? "orders"
  let rows: Record<string, unknown>[] = []
  if (type === "orders")
    rows = (await listOrders()).map((o) => ({
      order: o.orderNumber,
      date: o.createdAt,
      status: o.status,
      name: o.customer.name,
      email: o.customer.email,
      phone: o.customer.phone,
      address: o.customer.address,
      items: o.lines.map((l) => `${l.quantity} x ${l.name}${l.sizeText ? ` (${l.sizeText})` : ""}`),
      total: o.totals.total,
      payment: o.paymentLabel,
      shipping: o.shipping,
      tracking: o.trackingNumber ?? "",
    }))
  else if (type === "customers") rows = (await listCustomers()).map((c) => ({ ...c, orderNumbers: c.orderNumbers }))
  else if (type === "subscribers")
    rows = (await listSubscribers()).map((s) => ({ email: s.email, name: s.name, status: s.status, source: s.source, consent: s.consent, subscribedAt: s.subscribedAt, unsubscribedAt: s.unsubscribedAt ?? "", emailsSent: s.emailsSent }))
  else if (type === "visitors")
    rows = (await listVisitors()).map((v) => ({
      visitor: v.id,
      firstSeen: new Date(v.firstSeen).toISOString(),
      lastSeen: new Date(v.lastSeen).toISOString(),
      visits: v.visits,
      pageviews: v.pageviews,
      productsViewed: Object.keys(v.productViews ?? {}),
      bagAdds: v.bagAdds,
      orders: v.orders,
      spent: v.spent,
      email: v.email ?? "",
      device: v.device,
      browser: v.browser,
      country: v.country ?? "",
      from: v.referrer ?? "",
    }))
  return new Response(csv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="icoa-uru-${type}-${new Date().toISOString().slice(0, 10)}.csv"` },
  })
}
