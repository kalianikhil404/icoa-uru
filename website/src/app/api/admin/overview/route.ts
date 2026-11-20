import { NextResponse } from "next/server"
import { denied } from "@/lib/admin/server"
import { listOrders } from "@/lib/server/orders-store"
import { listSubscribers, visitorStats } from "@/lib/server/people"
import { isEmailReady } from "@/lib/server/mailer"
import { storageInfo } from "@/lib/server/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const no = denied(request)
  if (no) return no
  const [orders, subs, stats, emailReady] = await Promise.all([listOrders(), listSubscribers(), visitorStats(30), isEmailReady()])
  const month = Date.now() - 30 * 86400000
  const recent = orders.filter((o) => new Date(o.createdAt).getTime() >= month && o.status !== "cancelled")
  return NextResponse.json({
    toDo: orders.filter((o) => ["new", "paid", "weaving"].includes(o.status)).length,
    newOrders: orders.filter((o) => o.status === "new").length,
    revenue30: Math.round(recent.reduce((s, o) => s + o.totals.total, 0) * 100) / 100,
    orders30: recent.length,
    subscribers: subs.filter((s) => s.status === "subscribed").length,
    visitors30: stats.totals.visitors,
    live: stats.live,
    daily: stats.daily,
    latest: orders.slice(0, 5).map((o) => ({ orderNumber: o.orderNumber, name: o.customer.name, total: o.totals.total, status: o.status, createdAt: o.createdAt })),
    emailReady,
    storage: storageInfo(),
  })
}
