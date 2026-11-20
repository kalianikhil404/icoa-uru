import "server-only"
import crypto from "node:crypto"
import { collection } from "@/lib/server/db"
import type { Totals } from "@/lib/pricing"
import type { PricedLine } from "@/lib/orders"

/* Every order, kept so customers can check its status and you can manage it. */

export const ORDER_STATUSES = ["new", "paid", "weaving", "shipped", "delivered", "cancelled"] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const STATUS_TEXT: Record<OrderStatus, { label: string; customer: string }> = {
  new: { label: "New", customer: "Order received" },
  paid: { label: "Paid", customer: "Payment received" },
  weaving: { label: "Weaving", customer: "On the loom" },
  shipped: { label: "Shipped", customer: "On its way" },
  delivered: { label: "Delivered", customer: "Delivered" },
  cancelled: { label: "Cancelled", customer: "Cancelled" },
}

export type OrderLine = Omit<PricedLine, "size"> & { size?: string; sizeText?: string }

export type Order = {
  orderNumber: string
  /** secret part of the customer's private order link */
  key: string
  createdAt: string
  updatedAt: string
  status: OrderStatus
  history: { status: OrderStatus; at: string; note?: string }[]
  paymentMethod: "etransfer" | "card"
  paymentLabel: string
  email: string
  customer: { firstName: string; lastName: string; name: string; email: string; phone: string; address: string[] }
  shipping: string
  lines: OrderLine[]
  totals: Totals
  discountCode: string
  giftNote: string
  note: string
  /** shown to the customer on their order page */
  messageToCustomer?: string
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
  /** for you only */
  privateNote?: string
  visitorId?: string
  marketingConsent?: boolean
  stripeSession?: string
}

const store = collection<Order>("orders")

/** Older saved orders (from the first version) are filled in so they still show. */
function tidy(o: Partial<Order> & Record<string, unknown>): Order {
  const c = (o.customer ?? {}) as Partial<Order["customer"]> & { name?: string }
  const [first = "", ...rest] = String(c.name ?? "").split(" ")
  const status = (ORDER_STATUSES as readonly string[]).includes(String(o.status)) ? (o.status as OrderStatus) : "new"
  const createdAt = String(o.createdAt ?? new Date().toISOString())
  return {
    orderNumber: String(o.orderNumber),
    key: String(o.key ?? ""),
    createdAt,
    updatedAt: String(o.updatedAt ?? createdAt),
    status,
    history: Array.isArray(o.history) && o.history.length ? o.history : [{ status: "new", at: createdAt }],
    paymentMethod: o.paymentMethod === "card" ? "card" : "etransfer",
    paymentLabel: String(o.paymentLabel ?? (o as { payment?: string }).payment ?? "Interac e-Transfer"),
    email: String(o.email ?? c.email ?? "").toLowerCase(),
    customer: {
      firstName: c.firstName ?? first,
      lastName: c.lastName ?? rest.join(" "),
      name: c.name ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim(),
      email: String(c.email ?? o.email ?? ""),
      phone: c.phone ?? "",
      address: c.address ?? [],
    },
    shipping: String(o.shipping ?? ""),
    lines: (o.lines ?? []).map((l) => ({ ...l, sizeText: l.sizeText ?? (l.size && l.size.includes(",") ? l.size : undefined) })) as OrderLine[],
    totals: (o.totals ?? { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, freeShippingRemaining: 0, itemCount: 0 }) as Totals,
    discountCode: String(o.discountCode ?? ""),
    giftNote: String(o.giftNote ?? ""),
    note: String(o.note ?? ""),
    messageToCustomer: o.messageToCustomer,
    carrier: o.carrier,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    privateNote: o.privateNote,
    visitorId: o.visitorId,
    marketingConsent: o.marketingConsent,
    stripeSession: o.stripeSession,
  }
}

export const newKey = () => crypto.randomBytes(12).toString("base64url")

export async function saveOrder(order: Order) {
  await store.put(order.orderNumber, order)
  return order
}

export async function getOrder(orderNumber: string) {
  const o = await store.get(orderNumber).catch(() => null)
  if (!o) return null
  const t = tidy(o)
  // give older orders a private link key the first time they're opened
  if (!t.key) {
    t.key = newKey()
    await store.put(t.orderNumber, t).catch(() => {})
  }
  return t
}

export async function listOrders() {
  const all = (await store.all()).map(tidy)
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const same = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

/** For customers: an order only opens with its private key, or with the email it was placed with. */
export async function findForCustomer(orderNumber: string, proof: { key?: string; email?: string }) {
  if (!/^IU-[A-Z0-9]{4,12}$/i.test(orderNumber)) return null
  const o = await getOrder(orderNumber.toUpperCase())
  if (!o) return null
  if (proof.key && same(proof.key, o.key)) return o
  if (proof.email && o.email && proof.email.trim().toLowerCase() === o.email) return o
  return null
}

export type StatusChange = {
  status?: OrderStatus
  note?: string
  messageToCustomer?: string
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
  privateNote?: string
}

export async function changeOrder(orderNumber: string, change: StatusChange) {
  const o = await getOrder(orderNumber)
  if (!o) return null
  const now = new Date().toISOString()
  const statusChanged = !!change.status && change.status !== o.status
  if (statusChanged) {
    o.status = change.status!
    o.history.push({ status: change.status!, at: now, note: change.note || undefined })
  }
  for (const k of ["messageToCustomer", "carrier", "trackingNumber", "trackingUrl", "privateNote"] as const) {
    if (change[k] !== undefined) o[k] = change[k]!.trim() || undefined
  }
  o.updatedAt = now
  await saveOrder(o)
  return { order: o, statusChanged }
}

/** A link to a parcel tracker for common Canadian carriers. */
export function trackingLink(o: Pick<Order, "carrier" | "trackingNumber" | "trackingUrl">) {
  if (o.trackingUrl) return o.trackingUrl
  if (!o.trackingNumber) return ""
  const n = encodeURIComponent(o.trackingNumber)
  switch ((o.carrier ?? "").toLowerCase()) {
    case "canada post":
      return `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${n}`
    case "ups":
      return `https://www.ups.com/track?tracknum=${n}`
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${n}`
    case "purolator":
      return `https://www.purolator.com/en/shipping/tracker?pin=${n}`
    case "dhl":
      return `https://www.dhl.com/ca-en/home/tracking.html?tracking-id=${n}`
    default:
      return ""
  }
}

/** What a customer may see (no private notes). */
export function publicOrder(o: Order) {
  return {
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    status: o.status,
    statusText: STATUS_TEXT[o.status].customer,
    history: o.history.map((h) => ({ status: h.status, label: STATUS_TEXT[h.status]?.customer ?? h.status, at: h.at, note: h.note })),
    paymentMethod: o.paymentMethod,
    paymentLabel: o.paymentLabel,
    firstName: o.customer.firstName,
    shipping: o.shipping,
    address: o.customer.address,
    lines: o.lines.map((l) => ({ name: l.name, quantity: l.quantity, sizeText: l.sizeText ?? "", personalization: l.personalization ?? "", giftWrap: !!l.giftWrap, lineTotal: l.lineTotal })),
    totals: { subtotal: o.totals.subtotal, discount: o.totals.discount, shipping: o.totals.shipping, tax: o.totals.tax, total: o.totals.total },
    messageToCustomer: o.messageToCustomer ?? "",
    carrier: o.carrier ?? "",
    trackingNumber: o.trackingNumber ?? "",
    trackingUrl: trackingLink(o),
  }
}
export type PublicOrder = ReturnType<typeof publicOrder>
