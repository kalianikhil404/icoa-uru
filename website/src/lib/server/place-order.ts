import "server-only"
import { headers } from "next/headers"
import { shippingMethods, payments, sizeLabel } from "@/content/site"
import { getProductById } from "@/lib/catalog"
import type { OrderRequest } from "@/lib/schemas"
import type { PricedLine } from "@/lib/orders"
import type { Totals } from "@/lib/pricing"
import { newKey, saveOrder, type Order } from "@/lib/server/orders-store"
import { sendOrderAlert, sendOrderReceived } from "@/lib/server/emails"
import { linkVisitor, subscribe } from "@/lib/server/people"

/** The address the customer used to reach the site, for links in emails when no website address is set. */
export async function requestOrigin() {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || /^\d/.test(host) ? "http" : "https")
  return `${proto}://${host}`
}

/** Turns a checked, re-priced order request into a saved order. */
export function buildOrder(
  req: OrderRequest,
  priced: { lines: PricedLine[]; totals: Totals },
  opts: { orderNumber: string; paymentMethod: "etransfer" | "card"; status?: Order["status"] }
): Order {
  const now = new Date().toISOString()
  const shipping = shippingMethods.find((m) => m.id === req.shippingId)
  return {
    orderNumber: opts.orderNumber,
    key: newKey(),
    createdAt: now,
    updatedAt: now,
    status: opts.status ?? "new",
    history: [{ status: opts.status ?? "new", at: now }],
    paymentMethod: opts.paymentMethod,
    paymentLabel: opts.paymentMethod === "card" ? payments.card.label : payments.etransfer.label,
    email: req.email.trim().toLowerCase(),
    customer: {
      firstName: req.firstName.trim(),
      lastName: req.lastName.trim(),
      name: `${req.firstName.trim()} ${req.lastName.trim()}`,
      email: req.email.trim(),
      phone: req.phone?.trim() ?? "",
      address: [
        req.address1,
        req.address2,
        `${req.city}, ${req.province} ${req.postalCode.toUpperCase()}`,
        req.country,
      ].filter((x): x is string => !!x && !!x.trim()),
    },
    shipping: shipping?.label ?? "",
    lines: priced.lines.map((l) => {
      const product = l.productId === "custom" ? null : getProductById(l.productId)
      const sizeText = l.size ? sizeLabel(l.size) : product?.rows ? `${product.rows} rows wide` : ""
      return { ...l, sizeText }
    }),
    totals: priced.totals,
    discountCode: req.discountCode ?? "",
    giftNote: req.giftNote ?? "",
    note: req.note ?? "",
    visitorId: req.visitorId,
    marketingConsent: !!req.marketingConsent,
  }
}

/** Saves the order, connects it to the visitor, signs them up if they asked, and sends the emails. */
export async function completeOrder(order: Order, origin: string) {
  await saveOrder(order)
  if (order.visitorId) await linkVisitor(order.visitorId, { email: order.email, name: order.customer.name, order: order.totals.total }).catch(() => {})
  if (order.marketingConsent) {
    await subscribe({ email: order.email, name: order.customer.name, source: "Checkout", visitorId: order.visitorId, origin }).catch(() => {})
  }
  const [alert, receipt] = await Promise.all([sendOrderAlert(order, origin), sendOrderReceived(order, origin)])
  return { alert, receipt }
}
