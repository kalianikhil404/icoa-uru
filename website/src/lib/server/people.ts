import "server-only"
import crypto from "node:crypto"
import { collection, events, getSetting, setSetting } from "@/lib/server/db"
import { listOrders, type Order } from "@/lib/server/orders-store"
import { getEmailSettings, sendMail } from "@/lib/server/mailer"
import { getTemplates, promotionalEmail } from "@/lib/server/emails"

/* Subscribers (people who asked for emails), visitors (anonymous browsing)
   and customers (people who ordered). */

const hash = (s: string) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 24)
export const cleanEmail = (e: string) => e.trim().toLowerCase()
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 160

/* ======================= subscribers ======================= */

export type Subscriber = {
  id: string
  email: string
  name: string
  status: "subscribed" | "unsubscribed"
  /** where they signed up, and the words they agreed to (proof of consent) */
  source: string
  consent: string
  subscribedAt: string
  unsubscribedAt?: string
  token: string
  visitorId?: string
  emailsSent: number
  lastEmailedAt?: string
}

const subscribers = collection<Subscriber>("subscribers")
export const CONSENT_TEXT = "Yes, email me new patterns and offers. I can unsubscribe at any time."

export async function subscribe(input: { email: string; name?: string; source: string; visitorId?: string; origin?: string }) {
  const email = cleanEmail(input.email)
  if (!validEmail(email)) return { ok: false as const, error: "That email address doesn't look right." }
  const id = hash(email)
  const existing = await subscribers.get(id)
  const now = new Date().toISOString()
  const isNew = !existing || existing.status === "unsubscribed"
  const sub: Subscriber = {
    id,
    email,
    name: input.name?.trim() || existing?.name || "",
    status: "subscribed",
    source: existing && existing.status === "subscribed" ? existing.source : input.source,
    consent: CONSENT_TEXT,
    subscribedAt: existing && existing.status === "subscribed" ? existing.subscribedAt : now,
    token: existing?.token ?? crypto.randomBytes(16).toString("base64url"),
    visitorId: input.visitorId || existing?.visitorId,
    emailsSent: existing?.emailsSent ?? 0,
    lastEmailedAt: existing?.lastEmailedAt,
  }
  await subscribers.put(id, sub)
  if (input.visitorId) await linkVisitor(input.visitorId, { email, name: sub.name, subscribed: true })
  if (isNew) {
    const tpl = (await getTemplates()).welcome
    if (tpl.enabled) {
      const mail = await promotionalEmail("welcome", sub, undefined, input.origin)
      const r = await sendMail({ to: email, ...mail })
      if (r.ok && !r.preview) await subscribers.put(id, { ...sub, emailsSent: sub.emailsSent + 1, lastEmailedAt: now })
    }
  }
  return { ok: true as const, isNew }
}

export async function unsubscribe(token: string) {
  if (!token) return null
  const all = await subscribers.all()
  const sub = all.find((s) => s.token === token)
  if (!sub) return null
  if (sub.status !== "unsubscribed") await subscribers.put(sub.id, { ...sub, status: "unsubscribed", unsubscribedAt: new Date().toISOString() })
  return sub
}

export async function setSubscriberStatus(id: string, status: Subscriber["status"]) {
  return subscribers.update(id, (s) => (s ? { ...s, status, unsubscribedAt: status === "unsubscribed" ? new Date().toISOString() : undefined } : null))
}
export const removeSubscriber = (id: string) => subscribers.remove(id)

export async function listSubscribers() {
  return (await subscribers.all()).sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt))
}

/** Sends the newsletter to everyone subscribed. Returns how many were sent. */
export async function sendNewsletter(opts: { onlyTo?: string; origin?: string } = {}) {
  const tpl = (await getTemplates()).newsletter
  const list = opts.onlyTo
    ? [{ email: opts.onlyTo, name: "", token: "preview", id: "", status: "subscribed" } as Subscriber]
    : (await listSubscribers()).filter((s) => s.status === "subscribed")
  let sent = 0
  let failed = 0
  let lastError = ""
  for (const s of list) {
    const mail = await promotionalEmail("newsletter", s, undefined, opts.origin)
    const r = await sendMail({ to: s.email, ...mail, subject: opts.onlyTo ? `[Test] ${mail.subject}` : mail.subject })
    if (r.ok) {
      sent++
      if (!opts.onlyTo && !r.preview) await subscribers.put(s.id, { ...s, emailsSent: (s.emailsSent ?? 0) + 1, lastEmailedAt: new Date().toISOString() })
    } else {
      failed++
      lastError = r.error ?? ""
    }
    // Gmail limits how fast you can send; a short pause keeps it happy
    if (list.length > 1) await new Promise((r) => setTimeout(r, 400))
  }
  if (!opts.onlyTo) await setSetting("newsletterLog", [{ at: new Date().toISOString(), sent, failed, subject: tpl.subject }, ...(await getSetting<NewsletterLog[]>("newsletterLog", []))].slice(0, 30))
  return { sent, failed, lastError, total: list.length }
}
export type NewsletterLog = { at: string; sent: number; failed: number; subject: string }

/* ---- automatic newsletter schedule (checked every few minutes on your computer, once a day online) ---- */

function localParts(date: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", weekday: "short", hour12: false })
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]))
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday)
  return { ymd: `${p.year}-${p.month}-${p.day}`, ym: `${p.year}-${p.month}`, hour: Number(p.hour) % 24, weekday }
}

export async function newsletterDue(now = new Date()) {
  const tpl = (await getTemplates()).newsletter
  if (!tpl.enabled || tpl.frequency === "off") return null
  const { timezone } = await getEmailSettings()
  const lp = localParts(now, timezone || "America/Toronto")
  if (lp.hour < tpl.hour) return null
  let period = ""
  if (tpl.frequency === "daily") period = lp.ymd
  else if (tpl.frequency === "weekly") {
    if (lp.weekday !== tpl.weekday) return null
    period = lp.ymd
  } else period = lp.ym
  const last = await getSetting<string>("newsletterLastPeriod", "")
  return last === period ? null : period
}

let running = false
export async function runScheduledEmails() {
  if (running) return { ran: false }
  running = true
  try {
    const period = await newsletterDue()
    if (!period) return { ran: false }
    await setSetting("newsletterLastPeriod", period)
    const result = await sendNewsletter()
    console.log(`[newsletter] sent ${result.sent} of ${result.total}${result.failed ? `, ${result.failed} failed: ${result.lastError}` : ""}`)
    return { ran: true, ...result }
  } finally {
    running = false
  }
}

/* ======================= visitors ======================= */

export type Visitor = {
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
  lastSession?: string
}

const visitors = collection<Visitor>("visitors")

export type TrackEvent = {
  type: "pageview" | "product_view" | "add_to_bag" | "checkout_start" | "order" | "subscribe"
  path?: string
  slug?: string
  ref?: string
  value?: number
  title?: string
}

export function parseAgent(ua: string) {
  const device = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua) ? "Tablet" : /Mobi|iPhone|Android/i.test(ua) ? "Phone" : "Computer"
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other"
  const os = /Windows/.test(ua) ? "Windows" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "Other"
  return { device, browser, os }
}
export const isBot = (ua: string) => !ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor/i.test(ua)

export async function track(input: {
  visitorId: string
  sessionId: string
  event: TrackEvent
  ua: string
  geo: { country?: string; region?: string; city?: string }
}) {
  const { visitorId: id, sessionId, event } = input
  const now = Date.now()
  const host = (() => {
    try {
      return event.ref ? new URL(event.ref).hostname.replace(/^www\./, "") : ""
    } catch {
      return ""
    }
  })()
  await events.add({ t: now, v: id, s: sessionId, type: event.type, path: event.path, slug: event.slug, ref: host || undefined, value: event.value, title: event.title?.slice(0, 120) })
  await visitors.update(id, (cur) => {
    const v: Visitor = cur ?? {
      id,
      firstSeen: now,
      lastSeen: now,
      visits: 0,
      pageviews: 0,
      productViews: {},
      bagAdds: 0,
      checkouts: 0,
      orders: 0,
      spent: 0,
      ...parseAgent(input.ua),
      referrer: host || undefined,
      landing: event.path,
    }
    v.lastSeen = now
    if (v.lastSession !== sessionId) {
      v.visits++
      v.lastSession = sessionId
    }
    if (input.geo.country) Object.assign(v, input.geo)
    if (event.type === "pageview") {
      v.pageviews++
      v.lastPath = event.path
    }
    if (event.type === "product_view" && event.slug) v.productViews[event.slug] = (v.productViews[event.slug] ?? 0) + 1
    if (event.type === "add_to_bag") v.bagAdds++
    if (event.type === "checkout_start") v.checkouts++
    return v
  })
}

export async function linkVisitor(id: string, info: { email?: string; name?: string; subscribed?: boolean; order?: number }) {
  if (!/^[\w-]{8,64}$/.test(id)) return
  await visitors.update(id, (v) => {
    if (!v) return null
    if (info.email) v.email = info.email
    if (info.name) v.name = info.name
    if (info.subscribed) v.subscribed = true
    if (info.order) {
      v.orders++
      v.spent = Math.round((v.spent + info.order) * 100) / 100
    }
    return v
  })
  if (info.order) await events.add({ t: Date.now(), v: id, s: "", type: "order", value: info.order })
}

export const listVisitors = async () => (await visitors.all()).sort((a, b) => b.lastSeen - a.lastSeen)
export const getVisitor = (id: string) => visitors.get(id)

/** Numbers for the Visitors page. */
export async function visitorStats(days = 30) {
  const evs = await events.recent(days)
  const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10)
  const daily = new Map<string, { visitors: Set<string>; views: number; orders: number }>()
  for (let i = days - 1; i >= 0; i--) daily.set(dayKey(Date.now() - i * 86400000), { visitors: new Set(), views: 0, orders: 0 })
  const pages = new Map<string, number>()
  const productViews = new Map<string, number>()
  const productAdds = new Map<string, number>()
  const refs = new Map<string, number>()
  const funnel = { visitors: new Set<string>(), product: new Set<string>(), bag: new Set<string>(), checkout: new Set<string>(), order: new Set<string>() }
  const liveCut = Date.now() - 5 * 60000
  const live = new Set<string>()
  for (const e of evs) {
    const t = Number(e.t)
    const v = String(e.v)
    const d = daily.get(dayKey(t))
    if (d) d.visitors.add(v)
    funnel.visitors.add(v)
    if (t >= liveCut) live.add(v)
    switch (e.type) {
      case "pageview":
        if (d) d.views++
        pages.set(String(e.path), (pages.get(String(e.path)) ?? 0) + 1)
        if (e.ref) refs.set(String(e.ref), (refs.get(String(e.ref)) ?? 0) + 1)
        break
      case "product_view":
        funnel.product.add(v)
        productViews.set(String(e.slug), (productViews.get(String(e.slug)) ?? 0) + 1)
        break
      case "add_to_bag":
        funnel.bag.add(v)
        if (e.slug) productAdds.set(String(e.slug), (productAdds.get(String(e.slug)) ?? 0) + 1)
        break
      case "checkout_start":
        funnel.checkout.add(v)
        break
      case "order":
        funnel.order.add(v)
        if (d) d.orders++
        break
    }
  }
  const top = (m: Map<string, number>, n = 10) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, c]) => ({ key: k, count: c }))
  const allVisitors = await listVisitors()
  const recentVisitors = allVisitors.filter((v) => v.lastSeen >= Date.now() - days * 86400000)
  const count = (key: "device" | "browser" | "country" | "os") => {
    const m = new Map<string, number>()
    for (const v of recentVisitors) m.set(v[key] || "Unknown", (m.get(v[key] || "Unknown") ?? 0) + 1)
    return top(m, 8)
  }
  return {
    days,
    live: live.size,
    totals: { visitors: funnel.visitors.size, pageviews: [...daily.values()].reduce((s, d) => s + d.views, 0), returning: recentVisitors.filter((v) => v.visits > 1).length },
    daily: [...daily.entries()].map(([date, d]) => ({ date, visitors: d.visitors.size, views: d.views, orders: d.orders })),
    pages: top(pages),
    products: [...new Set([...productViews.keys(), ...productAdds.keys()])]
      .map((slug) => ({ slug, views: productViews.get(slug) ?? 0, adds: productAdds.get(slug) ?? 0 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 12),
    referrers: top(refs),
    devices: count("device"),
    browsers: count("browser"),
    countries: count("country"),
    funnel: { visitors: funnel.visitors.size, viewedProduct: funnel.product.size, addedToBag: funnel.bag.size, startedCheckout: funnel.checkout.size, ordered: funnel.order.size },
  }
}

export async function visitorTimeline(id: string, days = 90) {
  return (await events.recent(days)).filter((e) => e.v === id).slice(0, 400)
}

/* ======================= customers (from orders) ======================= */

export type Customer = {
  email: string
  name: string
  phone: string
  address: string[]
  orders: number
  spent: number
  firstOrder: string
  lastOrder: string
  lastStatus: string
  subscribed: boolean
  orderNumbers: string[]
}

export async function listCustomers(): Promise<Customer[]> {
  const [orders, subs] = await Promise.all([listOrders(), listSubscribers()])
  const subscribed = new Set(subs.filter((s) => s.status === "subscribed").map((s) => s.email))
  const map = new Map<string, Customer>()
  for (const o of [...orders].reverse() as Order[]) {
    const key = o.email || o.customer.email.toLowerCase()
    if (!key) continue
    const c = map.get(key) ?? {
      email: key,
      name: o.customer.name,
      phone: o.customer.phone,
      address: o.customer.address,
      orders: 0,
      spent: 0,
      firstOrder: o.createdAt,
      lastOrder: o.createdAt,
      lastStatus: o.status,
      subscribed: subscribed.has(key),
      orderNumbers: [],
    }
    c.orders++
    if (o.status !== "cancelled") c.spent = Math.round((c.spent + o.totals.total) * 100) / 100
    c.lastOrder = o.createdAt
    c.lastStatus = o.status
    c.name = o.customer.name || c.name
    c.phone = o.customer.phone || c.phone
    c.address = o.customer.address.length ? o.customer.address : c.address
    c.orderNumbers.unshift(o.orderNumber)
    map.set(key, c)
  }
  return [...map.values()].sort((a, b) => b.lastOrder.localeCompare(a.lastOrder))
}
