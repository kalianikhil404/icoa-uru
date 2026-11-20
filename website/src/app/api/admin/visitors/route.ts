import { NextResponse } from "next/server"
import { denied } from "@/lib/admin/server"
import { getVisitor, listVisitors, visitorStats, visitorTimeline } from "@/lib/server/people"

export const dynamic = "force-dynamic"

/** GET ?days=30 → numbers + visitor list · GET ?id=… → one visitor and everything they did */
export async function GET(request: Request) {
  const no = denied(request)
  if (no) return no
  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (id) {
    const visitor = await getVisitor(id)
    if (!visitor) return NextResponse.json({ error: "Visitor not found." }, { status: 404 })
    return NextResponse.json({ visitor, timeline: await visitorTimeline(id) })
  }
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days")) || 30))
  const [stats, visitors] = await Promise.all([visitorStats(days), listVisitors()])
  return NextResponse.json({ stats, visitors: visitors.slice(0, 500), total: visitors.length })
}
