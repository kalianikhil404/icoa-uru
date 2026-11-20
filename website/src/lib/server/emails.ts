import "server-only"
import { getSetting, setSetting } from "@/lib/server/db"
import { getEmailSettings, ownerAddress, sendMail, siteUrl, type SendResult } from "@/lib/server/mailer"
import { STATUS_TEXT, trackingLink, type Order, type OrderStatus } from "@/lib/server/orders-store"
import { formatPrice } from "@/lib/format"
import { payments, site } from "@/content/site"
import { products } from "@/content/products"
import { beadPalette } from "@/content/bead-colors"
import type { CustomDesign } from "@/lib/types"

/* ------------------------------------------------------------------
   The automatic emails and their wording. You change the wording in the
   control center → Emails. Words in {curly brackets} are filled in for
   each customer, e.g. {first_name} or {order_number}.
------------------------------------------------------------------- */

export type Template = { enabled: boolean; subject: string; heading: string; message: string; button?: string }
export type NewsletterTemplate = Template & {
  products: "newest" | "featured" | "none"
  productCount: number
  offer: string
  frequency: "off" | "daily" | "weekly" | "monthly"
  weekday: number
  hour: number
}
export type EmailTemplates = {
  orderReceived: Template
  orderAlert: Template
  paid: Template
  weaving: Template
  shipped: Template
  delivered: Template
  cancelled: Template
  welcome: Template
  newsletter: NewsletterTemplate
}
export type TemplateId = keyof EmailTemplates

export const DEFAULT_TEMPLATES: EmailTemplates = {
  orderReceived: {
    enabled: true,
    subject: "Your {shop_name} order {order_number}",
    heading: "Thank you, {first_name}!",
    message: "We've received your order {order_number}. We'll let you know as soon as it's on the loom.\n\nYou can check its status any time with the button below.",
    button: "See your order",
  },
  orderAlert: {
    enabled: true,
    subject: "New order {order_number}: {total}",
    heading: "New order {order_number}",
    message: "{first_name} just placed an order. Everything is below and in the control center.",
  },
  paid: {
    enabled: true,
    subject: "Payment received for {order_number}",
    heading: "Payment received",
    message: "Hi {first_name}, thank you! Your payment for order {order_number} came through. Your bracelet goes on the loom next.\n\n{message}",
    button: "See your order",
  },
  weaving: {
    enabled: true,
    subject: "Your bracelet is on the loom",
    heading: "It's on the loom",
    message: "Hi {first_name}, your order {order_number} is being woven by hand right now. We'll email you again when it ships.\n\n{message}",
    button: "See your order",
  },
  shipped: {
    enabled: true,
    subject: "Your order {order_number} is on its way",
    heading: "On its way!",
    message: "Hi {first_name}, your order {order_number} has shipped{carrier_with}.\n\nTracking number: {tracking_number}\n\n{message}",
    button: "Track your order",
  },
  delivered: {
    enabled: false,
    subject: "Your order {order_number} has arrived",
    heading: "Delivered",
    message: "Hi {first_name}, your order {order_number} should be with you now. We hope you love it! If anything isn't right, just reply to this email.\n\n{message}",
    button: "See your order",
  },
  cancelled: {
    enabled: true,
    subject: "Your order {order_number} was cancelled",
    heading: "Order cancelled",
    message: "Hi {first_name}, your order {order_number} has been cancelled.\n\n{message}\n\nIf you have any questions, just reply to this email.",
    button: "See your order",
  },
  welcome: {
    enabled: true,
    subject: "Welcome to {shop_name}",
    heading: "You're on the list",
    message: "Thanks for joining! You'll be the first to see new patterns and collections as they come off the loom.",
    button: "Shop bracelets",
  },
  newsletter: {
    enabled: true,
    subject: "Fresh off the loom at {shop_name}",
    heading: "New on the loom",
    message: "Hi {first_name}, here's what's new this week. Every bracelet is woven by hand with Miyuki glass seed beads.",
    button: "Shop all bracelets",
    products: "newest",
    productCount: 4,
    offer: "",
    frequency: "off",
    weekday: 4,
    hour: 10,
  },
}

export async function getTemplates(): Promise<EmailTemplates> {
  const saved = await getSetting<Partial<EmailTemplates>>("emailTemplates", {})
  const out = { ...DEFAULT_TEMPLATES } as EmailTemplates
  for (const k of Object.keys(DEFAULT_TEMPLATES) as TemplateId[]) {
    out[k] = { ...DEFAULT_TEMPLATES[k], ...(saved[k] ?? {}) } as never
  }
  return out
}
export async function saveTemplates(next: Partial<EmailTemplates>) {
  const current = await getTemplates()
  const merged = { ...current }
  for (const k of Object.keys(next) as TemplateId[]) merged[k] = { ...current[k], ...next[k] } as never
  await setSetting("emailTemplates", merged)
  return merged
}

/* ---------------- building the email ---------------- */

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

type Vars = Record<string, string>

function fill(text: string, vars: Vars) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))
}

/** Turns the plain text you write into tidy email paragraphs. Empty lines left by blank {message} disappear. */
function paragraphs(text: string, vars: Vars) {
  return fill(esc(text), Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, esc(v)])))
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !/^Tracking number:\s*$/i.test(p))
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65">${p.replace(/\n/g, "<br>")}</p>`)
    .join("")
}

function button(href: string, label: string) {
  return `<p style="margin:22px 0 4px"><a href="${esc(href)}" style="display:inline-block;background:#2e7c79;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 24px;border-radius:999px">${esc(label)}</a></p>`
}

async function layout(opts: { heading: string; body: string; base: string; footer?: string; preheader?: string }) {
  const s = await getEmailSettings()
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#fbf7f2;font-family:Helvetica,Arial,sans-serif;color:#3a2419">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</div>` : ""}
<div style="max-width:600px;margin:0 auto;padding:28px 18px">
  <table role="presentation" style="margin:0 0 20px"><tr>
    <td><img src="${esc(opts.base)}/images/brand/logo-mark.png" width="58" height="58" alt="" style="display:block;border-radius:50%"></td>
    <td style="padding-left:12px;font-family:Georgia,serif;font-size:22px;color:#4a2e22">${esc(site.name)}</td>
  </tr></table>
  <div style="background:#ffffff;border-radius:22px;padding:30px 26px">
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px;line-height:1.2;margin:0 0 18px;color:#4a2e22">${esc(opts.heading)}</h1>
    ${opts.body}
  </div>
  <div style="font-size:12px;line-height:1.6;color:#8a7468;margin-top:20px;padding:0 6px">
    ${esc(site.name)}, ${esc(site.tagline)}${s.mailingAddress ? `<br>${esc(s.mailingAddress)}` : ""}<br>
    <a href="${esc(opts.base)}" style="color:#8a7468">${esc(opts.base.replace(/^https?:\/\//, ""))}</a>${opts.footer ?? ""}
  </div>
</div></body></html>`
}

function designTable(d: CustomDesign) {
  let rows = ""
  for (let r = 0; r < d.rows; r++) {
    let cells = ""
    for (let c = 0; c < d.cols; c++) {
      const hex = beadPalette[parseInt(d.cells[r * d.cols + c] ?? "0", 16)]?.hex ?? "#eee"
      cells += `<td style="width:6px;height:5px;background:${hex}"></td>`
    }
    rows += `<tr>${cells}</tr>`
  }
  return `<table cellspacing="1" cellpadding="0" style="border-collapse:separate;background:#e9dfd1;padding:2px;border-radius:4px;margin-top:6px">${rows}</table>`
}

function orderSummary(o: Order, showDesigns = false) {
  const rows = o.lines
    .map(
      (l) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0e8de;font-size:14px;line-height:1.5">
        <strong>${l.quantity} × ${esc(l.name)}</strong>
        ${l.sizeText ? `<br><span style="color:#8a7468">${esc(l.sizeText)}</span>` : ""}
        ${l.personalization ? `<br><span style="color:#8a7468">Name: ${esc(l.personalization)}</span>` : ""}
        ${l.giftWrap ? `<br><span style="color:#8a7468">Gift wrapped</span>` : ""}
        ${showDesigns && l.design ? designTable(l.design) : ""}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0e8de;font-size:14px;text-align:right;white-space:nowrap;vertical-align:top">${formatPrice(l.lineTotal)}</td>
    </tr>`
    )
    .join("")
  const t = o.totals
  const line = (label: string, v: string, strong = false) =>
    `<tr><td style="padding:3px 0;font-size:14px;color:${strong ? "#3a2419" : "#8a7468"}">${label}</td><td style="padding:3px 0;font-size:${strong ? 17 : 14}px;text-align:right;${strong ? "font-weight:700" : ""}">${v}</td></tr>`
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:8px 0 6px">${rows}</table>
  <table role="presentation" style="width:100%;border-collapse:collapse">
    ${line("Subtotal", formatPrice(t.subtotal))}
    ${t.discount ? line(`Discount${o.discountCode ? ` (${esc(o.discountCode)})` : ""}`, `−${formatPrice(t.discount)}`) : ""}
    ${line("Shipping", t.shipping ? formatPrice(t.shipping) : "Free")}
    ${t.tax ? line("Tax", formatPrice(t.tax)) : ""}
    ${line("Total", formatPrice(t.total), true)}
  </table>`
}

function orderVars(o: Order, base: string): Vars {
  const link = trackingLink(o)
  return {
    shop_name: site.name,
    first_name: o.customer.firstName || "there",
    name: o.customer.name,
    order_number: o.orderNumber,
    total: formatPrice(o.totals.total),
    status: STATUS_TEXT[o.status].customer,
    order_link: `${base}/orders/${o.orderNumber}?k=${o.key}`,
    tracking_number: o.trackingNumber ?? "",
    tracking_link: link,
    carrier: o.carrier ?? "",
    carrier_with: o.carrier ? ` with ${o.carrier}` : "",
    message: o.messageToCustomer ?? "",
  }
}

/* ---------------- order emails ---------------- */

export async function sendOrderReceived(o: Order, origin?: string) {
  const tpl = (await getTemplates()).orderReceived
  if (!tpl.enabled || !o.customer.email) return { ok: true, skipped: true }
  const base = await siteUrl(origin)
  const v = orderVars(o, base)
  const etransfer =
    o.paymentMethod === "etransfer" && o.status === "new"
      ? `<div style="background:#f3ece3;border-radius:14px;padding:16px 18px;margin:6px 0 18px;font-size:14px;line-height:1.65">
          <strong>How to pay: ${esc(payments.etransfer.label)}</strong><br>
          Amount: <strong>${formatPrice(o.totals.total)}</strong><br>Message: <strong>${esc(o.orderNumber)}</strong><br><span style="color:#7a6357">${esc(payments.etransfer.instructions)}</span>
        </div>`
      : ""
  const body =
    paragraphs(tpl.message, v) +
    etransfer +
    orderSummary(o) +
    `<p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#8a7468">Shipping to:<br>${o.customer.address.map(esc).join("<br>")}<br>${esc(o.shipping)}</p>` +
    button(v.order_link, tpl.button || "See your order")
  return sendMail({ to: o.customer.email, subject: fill(tpl.subject, v), html: await layout({ heading: fill(tpl.heading, v), body, base }) })
}

export async function sendOrderAlert(o: Order, origin?: string) {
  const tpl = (await getTemplates()).orderAlert
  if (!tpl.enabled) return { ok: true, skipped: true }
  const base = await siteUrl(origin)
  const v = orderVars(o, base)
  const c = o.customer
  const body =
    paragraphs(tpl.message, v) +
    orderSummary(o, true) +
    `<h3 style="font-family:Georgia,serif;font-weight:normal;margin:22px 0 6px">Customer</h3>
    <p style="font-size:14px;line-height:1.6;margin:0">${esc(c.name)}<br>${c.address.map(esc).join("<br>")}<br>${esc(c.email)}${c.phone ? `<br>${esc(c.phone)}` : ""}</p>
    <p style="font-size:14px;margin:12px 0 0">Shipping: ${esc(o.shipping)}<br>Payment: <strong>${esc(o.paymentLabel)}</strong>${o.paymentMethod === "etransfer" ? " (waiting for the transfer)" : ""}</p>
    ${o.giftNote ? `<p style="font-size:14px"><strong>Gift note:</strong> ${esc(o.giftNote)}</p>` : ""}
    ${o.note ? `<p style="font-size:14px"><strong>Order note:</strong> ${esc(o.note)}</p>` : ""}` +
    button(`${base}/control#orders/${o.orderNumber}`, "Open in the control center")
  return sendMail({ to: await ownerAddress(), replyTo: c.email, subject: fill(tpl.subject, v), html: await layout({ heading: fill(tpl.heading, v), body, base }) })
}

const STATUS_TEMPLATE: Partial<Record<OrderStatus, TemplateId>> = {
  paid: "paid",
  weaving: "weaving",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
}

export async function sendStatusUpdate(o: Order, origin?: string): Promise<SendResult & { skipped?: boolean }> {
  const id = STATUS_TEMPLATE[o.status]
  if (!id || !o.customer.email) return { ok: true, skipped: true }
  const tpl = (await getTemplates())[id]
  if (!tpl.enabled) return { ok: true, skipped: true }
  const base = await siteUrl(origin)
  const v = orderVars(o, base)
  const target = o.status === "shipped" && v.tracking_link ? v.tracking_link : v.order_link
  const body = paragraphs(tpl.message, v) + button(target, tpl.button || "See your order")
  return sendMail({ to: o.customer.email, subject: fill(tpl.subject, v), html: await layout({ heading: fill(tpl.heading, v), body, base }) })
}

/* ---------------- welcome + newsletter (promotional: always with unsubscribe) ---------------- */

function productCards(base: string, which: NewsletterTemplate["products"], count: number) {
  if (which === "none") return ""
  const list = [...products]
    .filter((p) => p.stock > 0)
    .sort((a, b) => (which === "featured" ? Number(!!b.featured) - Number(!!a.featured) : 0) || b.added.localeCompare(a.added))
    .slice(0, Math.max(1, Math.min(8, count)))
  const cells = list
    .map(
      (p) => `<td style="width:50%;padding:6px;vertical-align:top">
        <a href="${esc(base)}/shop/${esc(p.slug)}" style="text-decoration:none;color:#3a2419">
          <img src="${esc(base)}${esc(p.images[0])}" alt="${esc(p.name)}" width="250" style="display:block;width:100%;height:auto;border-radius:14px;background:#efe5d8">
          <span style="display:block;font-family:Georgia,serif;font-size:16px;margin-top:8px">${esc(p.name)}</span>
          <span style="display:block;font-size:14px;color:#8a7468">${formatPrice(p.price)}</span>
        </a></td>`
    )
  let rows = ""
  for (let i = 0; i < cells.length; i += 2) rows += `<tr>${cells[i]}${cells[i + 1] ?? '<td style="width:50%"></td>'}</tr>`
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:10px -6px">${rows}</table>`
}

export async function promotionalEmail(
  id: "welcome" | "newsletter",
  to: { email: string; name?: string; token: string },
  override?: Partial<NewsletterTemplate>,
  origin?: string
) {
  const all = await getTemplates()
  const tpl = { ...all[id], ...(override ?? {}) } as NewsletterTemplate
  const base = await siteUrl(origin)
  const unsub = `${base}/unsubscribe?t=${encodeURIComponent(to.token)}`
  const oneClick = `${base}/api/unsubscribe?t=${encodeURIComponent(to.token)}`
  const v: Vars = { shop_name: site.name, first_name: to.name?.split(" ")[0] || "there", name: to.name ?? "" }
  let body = paragraphs(tpl.message, v)
  if (id === "newsletter") {
    if (tpl.offer?.trim())
      body += `<div style="background:#f3ece3;border-radius:14px;padding:14px 18px;margin:4px 0 14px;font-size:15px;line-height:1.6">${esc(fill(tpl.offer, v))}</div>`
    body += productCards(base, tpl.products ?? "newest", tpl.productCount ?? 4)
  }
  body += button(`${base}/shop`, tpl.button || "Shop bracelets")
  const footer = `<br><br>You're getting this because you signed up at ${esc(site.name)}. <a href="${esc(unsub)}" style="color:#8a7468">Unsubscribe</a> any time.`
  const html = await layout({ heading: fill(tpl.heading, v), body, base, footer, preheader: fill(tpl.subject, v) })
  return { subject: fill(tpl.subject, v), html, unsubscribeUrl: oneClick }
}
