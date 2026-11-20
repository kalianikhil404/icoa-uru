"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, Eye, Laptop, MousePointerClick, ShoppingBag, Smartphone, Tablet, UserRound } from "lucide-react"
import { products } from "@/content/products"
import { cn } from "@/lib/utils"
import { ago, DailyBars, date, Empty, ErrorNote, ExportButton, go, Loading, money, Panel, RankList, Search, Stat, useApi } from "./ui"

type Visitor = {
  id: string
  firstSeen: number
  lastSeen: number
  visits: number
  pageviews: number
  productViews: Record<string, number>
  bagAdds: number
  checkouts: number
  orders: number
  spent: number
  email?: string
  name?: string
  subscribed?: boolean
  device: string
  browser: string
  os: string
  country?: string
  region?: string
  city?: string
  referrer?: string
  landing?: string
  lastPath?: string
}
type Stats = {
  days: number
  live: number
  totals: { visitors: number; pageviews: number; returning: number }
  daily: { date: string; visitors: number; views: number; orders: number }[]
  pages: { key: string; count: number }[]
  products: { slug: string; views: number; adds: number }[]
  referrers: { key: string; count: number }[]
  devices: { key: string; count: number }[]
  browsers: { key: string; count: number }[]
  countries: { key: string; count: number }[]
  funnel: { visitors: number; viewedProduct: number; addedToBag: number; startedCheckout: number; ordered: number }
}

const productName = (slug: string) => products.find((p) => p.slug === slug)?.name ?? slug
const pageName = (path: string) => {
  if (path === "/") return "Home"
  const m = /^\/shop\/([^/?#]+)/.exec(path)
  if (m) return productName(m[1])
  if (path.startsWith("/orders/")) return "Their order page"
  if (path.startsWith("/collections/")) return `Collection: ${path.split("/")[2]}`
  if (path === "/checkout/success") return "Thank-you page (ordered)"
  const names: Record<string, string> = { "/shop": "Shop", "/custom": "Design your own", "/collections": "Collections", "/about": "About", "/contact": "Contact", "/faq": "Questions", "/cart": "Bag", "/checkout": "Checkout", "/orders": "My orders", "/size-guide": "Sizes", "/policies": "Policies", "/wishlist": "Wishlist" }
  return names[path] ?? path
}
const DeviceIcon = ({ device, className }: { device: string; className?: string }) =>
  device === "Phone" ? <Smartphone className={className} /> : device === "Tablet" ? <Tablet className={className} /> : <Laptop className={className} />
export const visitorLabel = (v: Pick<Visitor, "id" | "name" | "email">) => v.name || v.email || `Visitor ${v.id.slice(0, 6)}`

export function Visitors({ sub }: { sub: string }) {
  if (sub) return <VisitorDetail id={sub} />
  return <VisitorOverview />
}

function VisitorOverview() {
  const [days, setDays] = useState(30)
  const { data, error, reload } = useApi<{ stats: Stats; visitors: Visitor[]; total: number }>(`/api/admin/visitors?days=${days}`)
  const [q, setQ] = useState("")
  const [who, setWho] = useState<"all" | "known" | "shoppers">("all")
  const list = useMemo(
    () =>
      (data?.visitors ?? []).filter(
        (v) =>
          (who === "all" || (who === "known" ? !!(v.email || v.name) : v.bagAdds > 0 || v.orders > 0)) &&
          (!q || JSON.stringify([v.email, v.name, v.country, v.city, v.referrer, v.device, v.browser, Object.keys(v.productViews)]).toLowerCase().includes(q.toLowerCase()))
      ),
    [data, q, who]
  )
  if (error) return <ErrorNote message={error} onRetry={reload} />
  if (!data) return <Loading rows={6} />
  const s = data.stats
  const f = s.funnel
  const pct = (a: number) => (f.visitors ? `${Math.round((a / f.visitors) * 100)}%` : "0%")

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-cocoa/10" role="radiogroup" aria-label="Time range">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={days === d}
              onClick={() => setDays(d)}
              className={cn("h-8 rounded-lg px-3 text-sm", days === d ? "bg-cocoa text-white" : "text-cocoa hover:bg-sand")}
            >
              {d} days
            </button>
          ))}
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex size-2">
            {s.live > 0 && <span className="absolute inline-flex size-full animate-ping rounded-full bg-lagoon opacity-60" />}
            <span className={cn("relative inline-flex size-2 rounded-full", s.live ? "bg-lagoon" : "bg-cocoa/25")} />
          </span>
          {s.live} on the site right now
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Visitors" value={s.totals.visitors.toLocaleString()} hint={`${s.totals.returning} came back more than once`} />
        <Stat label="Pages looked at" value={s.totals.pageviews.toLocaleString()} hint={s.totals.visitors ? `${(s.totals.pageviews / s.totals.visitors).toFixed(1)} per visitor` : undefined} />
        <Stat label="Added to bag" value={f.addedToBag} hint={`${pct(f.addedToBag)} of visitors`} />
        <Stat label="Ordered" value={f.ordered} hint={`${pct(f.ordered)} of visitors`} tone="lagoon" />
      </div>

      <Panel title="Visitors each day" intro="A dot marks a day with an order.">
        <DailyBars data={s.daily} valueKey="visitors" secondKey="orders" height={140} />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="From looking to ordering" intro="How far visitors got.">
          <ol className="space-y-2.5">
            {[
              ["Visited", f.visitors],
              ["Looked at a bracelet", f.viewedProduct],
              ["Added to bag", f.addedToBag],
              ["Started checkout", f.startedCheckout],
              ["Ordered", f.ordered],
            ].map(([label, n]) => (
              <li key={label as string}>
                <div className="flex justify-between text-sm">
                  <span className="text-cocoa">{label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {n as number} <span className="text-xs">({pct(n as number)})</span>
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-sand/70">
                  <div className="h-full rounded-full bg-lagoon" style={{ width: pct(n as number) }} />
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Bracelets people look at" intro="Views, and how often each was added to a bag.">
          <RankList
            rows={s.products.map((p) => ({ label: productName(p.slug), value: p.views, sub: p.adds ? <span className="mr-2 text-xs text-lagoon">{p.adds} in bag</span> : undefined }))}
            empty="No bracelet views yet."
          />
        </Panel>
        <Panel title="Most visited pages">
          <RankList rows={s.pages.map((p) => ({ label: pageName(p.key), value: p.count }))} />
        </Panel>
        <Panel title="Where visitors come from" intro="Websites and apps that sent people here.">
          <RankList rows={s.referrers.map((r) => ({ label: r.key, value: r.count }))} empty="Everyone so far typed the address or used a bookmark." />
        </Panel>
        <Panel title="Devices">
          <RankList rows={[...s.devices, ...s.browsers.map((b) => ({ ...b, key: `${b.key} browser` }))].map((d) => ({ label: d.key, value: d.count }))} />
        </Panel>
        <Panel title="Countries">
          <RankList rows={s.countries.filter((c) => c.key !== "Unknown").map((c) => ({ label: c.key, value: c.count }))} empty="Countries show once the website is online." />
        </Panel>
      </div>

      <Panel
        title="Everyone who visited"
        intro={`${data.total.toLocaleString()} visitors so far. Names and emails show once someone orders or signs up.`}
        action={<ExportButton type="visitors" />}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Search value={q} onChange={setQ} placeholder="Search email, place, bracelet" />
          <select value={who} onChange={(e) => setWho(e.target.value as typeof who)} className="h-10 rounded-xl border border-cocoa/15 bg-white px-3 text-sm" aria-label="Show">
            <option value="all">Everyone</option>
            <option value="known">With a name or email</option>
            <option value="shoppers">Added to bag or ordered</option>
          </select>
        </div>
        {!list.length ? (
          <Empty icon={<UserRound className="size-5" />} title="No visitors yet">
            Visits are counted as people browse the shop, unless they choose &ldquo;No thanks&rdquo; in the privacy notice.
          </Empty>
        ) : (
          <ul className="-mx-2 divide-y divide-cocoa/10">
            {list.slice(0, 200).map((v) => (
              <li key={v.id}>
                <button type="button" onClick={() => go(`visitors/${v.id}`)} className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-porcelain">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-cocoa">
                    <DeviceIcon device={v.device} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate", v.email || v.name ? "font-medium text-cocoa" : "text-cocoa/80")}>{visitorLabel(v)}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[v.city || v.country, `${v.browser} on ${v.os}`, v.referrer && `from ${v.referrer}`].filter(Boolean).join(", ")}
                    </span>
                  </span>
                  <span className="hidden gap-4 text-xs text-muted-foreground sm:flex">
                    <span className="flex items-center gap-1" title="Visits">
                      <MousePointerClick className="size-3.5" /> {v.visits}
                    </span>
                    <span className="flex items-center gap-1" title="Bracelets looked at">
                      <Eye className="size-3.5" /> {Object.keys(v.productViews).length}
                    </span>
                    <span className={cn("flex items-center gap-1", v.bagAdds && "text-lagoon")} title="Added to bag">
                      <ShoppingBag className="size-3.5" /> {v.bagAdds}
                    </span>
                  </span>
                  {v.orders > 0 ? (
                    <span className="rounded-full bg-lagoon/10 px-2 py-0.5 text-xs text-lagoon">{money(v.spent)}</span>
                  ) : v.subscribed ? (
                    <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-cocoa">Subscriber</span>
                  ) : null}
                  <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">{ago(v.lastSeen)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

type Ev = { t: number; s: string; type: string; path?: string; slug?: string; ref?: string; value?: number; title?: string }

function VisitorDetail({ id }: { id: string }) {
  const { data, error, reload } = useApi<{ visitor: Visitor; timeline: Ev[] }>(`/api/admin/visitors?id=${encodeURIComponent(id)}`)
  if (error) return <ErrorNote message={error} onRetry={reload} />
  if (!data) return <Loading rows={6} />
  const v = data.visitor
  // group by visit (session)
  const visits: { s: string; events: Ev[] }[] = []
  for (const e of data.timeline) {
    const last = visits.at(-1)
    if (last && (last.s === e.s || !e.s)) last.events.push(e)
    else visits.push({ s: e.s, events: [e] })
  }
  const viewed = Object.entries(v.productViews).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => go("visitors")} className="-ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-cocoa/70 hover:bg-sand hover:text-cocoa">
        <ArrowLeft className="size-4" /> All visitors
      </button>
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-sand text-cocoa">
          <DeviceIcon device={v.device} className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl text-cocoa">{visitorLabel(v)}</h1>
          <p className="text-sm text-muted-foreground">
            {[v.email && v.name ? v.email : "", `${v.device}, ${v.browser} on ${v.os}`, [v.city, v.region, v.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="First visit" value={<span className="text-xl">{date(v.firstSeen)}</span>} hint={v.referrer ? `Came from ${v.referrer}` : "Came straight to the site"} />
        <Stat label="Visits" value={v.visits} hint={`Last ${ago(v.lastSeen)}`} />
        <Stat label="Pages" value={v.pageviews} />
        <Stat label="Added to bag" value={v.bagAdds} />
        <Stat label="Ordered" value={v.orders ? money(v.spent) : "Not yet"} tone={v.orders ? "lagoon" : undefined} hint={v.orders ? `${v.orders} order${v.orders === 1 ? "" : "s"}` : undefined} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="Bracelets they looked at">
          <RankList rows={viewed.map(([slug, n]) => ({ label: productName(slug), value: n }))} empty="None yet." />
          {v.email && (
            <a href={`mailto:${v.email}`} className="mt-4 inline-block text-sm text-lagoon hover:underline">
              Email {v.name?.split(" ")[0] || "them"}
            </a>
          )}
        </Panel>
        <Panel title="What they did" intro="Most recent first, grouped by visit.">
          {!visits.length ? (
            <p className="text-sm text-muted-foreground">Nothing in the last 90 days.</p>
          ) : (
            <ol className="space-y-5">
              {visits.slice(0, 30).map((visit, i) => (
                <li key={i}>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{date(visit.events[visit.events.length - 1].t, true)}</p>
                  <ol className="space-y-1.5 border-l border-cocoa/10 pl-4">
                    {visit.events.map((e, j) => (
                      <li key={j} className="relative text-sm">
                        <span
                          className={cn(
                            "absolute top-1.5 -left-[1.29rem] size-2 rounded-full ring-2 ring-white",
                            e.type === "order" ? "bg-lagoon" : e.type === "add_to_bag" ? "bg-marigold" : e.type === "product_view" ? "bg-clay" : "bg-cocoa/30"
                          )}
                        />
                        <span className="text-cocoa">
                          {e.type === "pageview" && `Opened ${pageName(e.path ?? "")}`}
                          {e.type === "product_view" && `Looked at ${productName(e.slug ?? "")}`}
                          {e.type === "add_to_bag" && `Added ${productName(e.slug ?? "")} to the bag${e.value ? ` (${money(e.value)})` : ""}`}
                          {e.type === "checkout_start" && "Went to checkout"}
                          {e.type === "order" && `Ordered, ${money(e.value ?? 0)}`}
                        </span>
                        {e.ref && <span className="text-muted-foreground"> from {e.ref}</span>}
                        <span className="ml-2 text-xs text-muted-foreground">{new Date(e.t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  )
}
