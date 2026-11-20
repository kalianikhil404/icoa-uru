"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Check, Copy, ExternalLink, Gift, Inbox, Loader2, Mail, Package, Send } from "lucide-react"
import { toast } from "sonner"
import { DesignPreview } from "@/components/custom/design-preview"
import { cn } from "@/lib/utils"
import { api, date, Empty, ErrorNote, field, go, Loading, money, Search, STATUS_STYLE, StatusPill, useApi, ExportButton } from "./ui"

export type AdminOrder = {
  orderNumber: string
  key: string
  createdAt: string
  updatedAt: string
  status: string
  history: { status: string; at: string; note?: string }[]
  paymentMethod: string
  paymentLabel: string
  email: string
  customer: { firstName: string; lastName: string; name: string; email: string; phone: string; address: string[] }
  shipping: string
  lines: {
    productId: string
    name: string
    quantity: number
    sizeText?: string
    personalization?: string
    giftWrap?: boolean
    design?: { rows: number; cols: number; cells: string }
    lineTotal: number
  }[]
  totals: { subtotal: number; discount: number; shipping: number; tax: number; total: number }
  discountCode: string
  giftNote: string
  note: string
  messageToCustomer?: string
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
  privateNote?: string
  visitorId?: string
  marketingConsent?: boolean
}

const STATUSES = ["new", "paid", "weaving", "shipped", "delivered", "cancelled"] as const
const FILTERS = [
  { id: "todo", label: "To do", test: (s: string) => ["new", "paid", "weaving"].includes(s) },
  { id: "all", label: "All", test: () => true },
  ...STATUSES.map((s) => ({ id: s, label: STATUS_STYLE[s].label, test: (x: string) => x === s })),
]
const CARRIERS = ["Canada Post", "UPS", "FedEx", "Purolator", "DHL", "Other"]

export function Orders({ sub, emailReady }: { sub: string; emailReady: boolean }) {
  const { data, error, reload, setData } = useApi<AdminOrder[]>("/api/admin/orders")
  const [filter, setFilter] = useState("todo")
  const [q, setQ] = useState("")
  const list = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) ?? FILTERS[0]
    const needle = q.trim().toLowerCase()
    return (data ?? []).filter((o) => f.test(o.status) && (!needle || JSON.stringify([o.orderNumber, o.customer, o.lines.map((l) => l.name)]).toLowerCase().includes(needle)))
  }, [data, filter, q])

  const open = sub ? data?.find((o) => o.orderNumber === sub) : undefined
  const replace = (o: AdminOrder) => setData((d) => (d ? d.map((x) => (x.orderNumber === o.orderNumber ? o : x)) : d))

  if (open) return <OrderDetail order={open} emailReady={emailReady} onChange={replace} />
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {FILTERS.map((f) => {
            const n = (data ?? []).filter((o) => f.test(o.status)).length
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm transition-colors",
                  filter === f.id ? "bg-cocoa text-white" : "bg-white text-cocoa ring-1 ring-cocoa/10 hover:bg-sand"
                )}
              >
                {f.label}
                <span className={cn("tabular-nums", filter === f.id ? "text-white/60" : "text-muted-foreground")}>{n}</span>
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <Search value={q} onChange={setQ} placeholder="Search name, email, order" />
          <ExportButton type="orders" label="Spreadsheet" />
        </div>
      </div>
      {error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : !data ? (
        <Loading rows={5} />
      ) : !list.length ? (
        <Empty icon={<Inbox className="size-5" />} title={filter === "todo" ? "Nothing to do right now" : "No orders here"}>
          New orders appear here the moment someone checks out, from any device.
        </Empty>
      ) : (
        <ul className="overflow-hidden rounded-[22px] border border-cocoa/10 bg-white">
          {list.map((o) => (
            <li key={o.orderNumber} className="border-b border-cocoa/10 last:border-0">
              <button type="button" onClick={() => go(`orders/${o.orderNumber}`)} className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-porcelain sm:px-5">
                <span className={cn("size-2 shrink-0 rounded-full", STATUS_STYLE[o.status]?.dot)} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium text-cocoa">{o.customer.name || o.email}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{o.orderNumber}</span>
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {date(o.createdAt, true)}, {o.lines.map((l) => `${l.quantity} × ${l.name}`).join(", ")}
                  </span>
                </span>
                <span className="hidden text-sm text-muted-foreground sm:block">{o.paymentMethod === "card" ? "Card" : "e-Transfer"}</span>
                <span className="font-display text-lg text-cocoa tabular-nums">{money(o.totals.total)}</span>
                <StatusPill status={o.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OrderDetail({ order, emailReady, onChange }: { order: AdminOrder; emailReady: boolean; onChange: (o: AdminOrder) => void }) {
  const [next, setNext] = useState<string>(order.status)
  const [message, setMessage] = useState(order.messageToCustomer ?? "")
  const [carrier, setCarrier] = useState(order.carrier ?? "Canada Post")
  const [tracking, setTracking] = useState(order.trackingNumber ?? "")
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl ?? "")
  const [notify, setNotify] = useState(true)
  const [busy, setBusy] = useState(false)
  const [privateNote, setPrivateNote] = useState(order.privateNote ?? "")
  const changed = next !== order.status || message !== (order.messageToCustomer ?? "") || tracking !== (order.trackingNumber ?? "") || carrier !== (order.carrier ?? "Canada Post") || trackingUrl !== (order.trackingUrl ?? "")
  const customerLink = typeof window === "undefined" ? "" : `${window.location.origin}/orders/${order.orderNumber}?k=${order.key}`
  const c = order.customer

  const save = async (resend = false) => {
    setBusy(true)
    const { ok, data } = await api<{ order: AdminOrder; email: { ok: boolean; preview?: boolean; skipped?: boolean; error?: string } | null }>("/api/admin/orders", "PATCH", {
      orderNumber: order.orderNumber,
      status: next,
      messageToCustomer: message,
      carrier: tracking ? carrier : "",
      trackingNumber: tracking,
      trackingUrl,
      notify,
      resend,
    })
    setBusy(false)
    if (!ok) return toast.error(data.error ?? "Couldn't save.")
    onChange(data.order)
    const e = data.email
    if (e && !e.ok) toast.error("Saved, but the email didn't send", { description: e.error })
    else if (e && e.preview) toast.success("Saved", { description: "Email isn't set up yet, so the customer wasn't emailed. Set it up under Emails." })
    else if (e && !e.skipped) toast.success(`Saved and emailed ${c.firstName || c.email}`)
    else toast.success("Saved", { description: "The customer sees it on their order page." })
  }

  const savePrivate = async () => {
    if (privateNote === (order.privateNote ?? "")) return
    const { ok, data } = await api<{ order: AdminOrder }>("/api/admin/orders", "PATCH", { orderNumber: order.orderNumber, privateNote })
    if (ok) {
      onChange(data.order)
      toast.success("Note saved")
    }
  }

  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text)
    toast.success(`${what} copied`)
  }

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => go("orders")} className="-ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-cocoa/70 hover:bg-sand hover:text-cocoa">
        <ArrowLeft className="size-4" /> All orders
      </button>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {order.orderNumber}, {date(order.createdAt, true)}
          </p>
          <h1 className="font-display text-3xl text-cocoa sm:text-4xl">{c.name || order.email}</h1>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-cocoa tabular-nums">{money(order.totals.total)}</p>
          <p className="text-sm text-muted-foreground">{order.paymentLabel}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5">
          {/* status */}
          <section className="rounded-[22px] border border-cocoa/10 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl text-cocoa">Status</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">The customer sees this on their order page{emailReady ? " and can get an email about it" : ""}.</p>
            <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Order status">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={next === s}
                  onClick={() => setNext(s)}
                  className={cn(
                    "relative inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm transition-colors",
                    next === s ? "text-white" : "bg-porcelain text-cocoa ring-1 ring-cocoa/10 hover:bg-sand"
                  )}
                >
                  {next === s && <motion.span layoutId="status-pill" className="absolute inset-0 rounded-xl bg-cocoa" transition={{ duration: 0.25 }} />}
                  <span className={cn("relative size-2 rounded-full", STATUS_STYLE[s].dot)} />
                  <span className="relative">{STATUS_STYLE[s].label}</span>
                  {order.status === s && <span className="relative text-xs opacity-60">now</span>}
                </button>
              ))}
            </div>

            <AnimatePresence initial={false}>
              {(next === "shipped" || order.trackingNumber) && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-5 grid gap-3 sm:grid-cols-[170px_1fr]">
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-cocoa">Carrier</span>
                      <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className={cn(field, "h-10")}>
                        {CARRIERS.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-cocoa">Tracking number</span>
                      <input value={tracking} onChange={(e) => setTracking(e.target.value)} className={field} placeholder="e.g. 7023 2105 1234 5678" />
                    </label>
                    {carrier === "Other" && (
                      <label className="text-sm sm:col-span-2">
                        <span className="mb-1 block font-medium text-cocoa">Tracking link</span>
                        <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} className={field} placeholder="https://" />
                      </label>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-medium text-cocoa">Message to the customer (optional)</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className={cn(field, "resize-y leading-relaxed")}
                placeholder={next === "cancelled" ? "e.g. Your refund is on its way." : "e.g. Thank you! Your bracelet goes on the loom this weekend."}
              />
              <span className="mt-1 block text-xs text-muted-foreground">Shown on their order page and in the email.</span>
            </label>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cocoa/10 pt-4">
              <label className={cn("flex items-center gap-2 text-sm text-cocoa", !emailReady && "opacity-60")}>
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4 accent-lagoon" />
                <Mail className="size-4" /> Email {c.firstName || "the customer"} about the change
                {!emailReady && <span className="text-xs text-muted-foreground">(set up Emails first)</span>}
              </label>
              <div className="flex gap-2">
                {!changed && order.status !== "new" && (
                  <button type="button" disabled={busy} onClick={() => void save(true)} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm text-cocoa hover:bg-sand">
                    <Send className="size-4" /> Resend email
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy || !changed}
                  onClick={() => void save()}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-lagoon px-5 text-sm font-medium text-white hover:bg-lagoon-deep disabled:opacity-40"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save
                </button>
              </div>
            </div>
          </section>

          {/* items */}
          <section className="rounded-[22px] border border-cocoa/10 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl text-cocoa">Bracelets</h2>
            <ul className="mt-3 divide-y divide-cocoa/10">
              {order.lines.map((l, i) => (
                <li key={i} className="py-3">
                  <div className="flex justify-between gap-4 text-sm">
                    <span>
                      <span className="font-medium text-cocoa">
                        {l.quantity} × {l.name}
                      </span>
                      <span className="block text-muted-foreground">
                        {[l.sizeText, l.personalization && `Name: ${l.personalization}`].filter(Boolean).join(", ")}
                        {l.giftWrap && (
                          <span className="ml-1 inline-flex items-center gap-1 text-marigold">
                            <Gift className="size-3.5" /> Gift wrap
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="text-cocoa tabular-nums">{money(l.lineTotal)}</span>
                  </div>
                  {l.design && <DesignPreview design={l.design} className="mt-3 w-full" />}
                </li>
              ))}
            </ul>
            <dl className="mt-1 space-y-1 border-t border-cocoa/10 pt-3 text-sm">
              {[
                ["Subtotal", money(order.totals.subtotal)],
                ...(order.totals.discount ? [[`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`, `−${money(order.totals.discount)}`]] : []),
                [`Shipping, ${order.shipping}`, order.totals.shipping ? money(order.totals.shipping) : "Free"],
                ...(order.totals.tax ? [["Tax", money(order.totals.tax)]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-muted-foreground">
                  <dt>{k}</dt>
                  <dd className="tabular-nums">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between pt-1 font-medium text-cocoa">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(order.totals.total)}</dd>
              </div>
            </dl>
            {(order.giftNote || order.note) && (
              <div className="mt-4 space-y-2 rounded-2xl bg-porcelain p-4 text-sm">
                {order.giftNote && (
                  <p>
                    <span className="font-medium text-cocoa">Gift note:</span> {order.giftNote}
                  </p>
                )}
                {order.note && (
                  <p>
                    <span className="font-medium text-cocoa">Note from the customer:</span> {order.note}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[22px] border border-cocoa/10 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl text-cocoa">Customer</h2>
            <div className="mt-3 space-y-3 text-sm">
              <p className="leading-relaxed text-cocoa">
                {c.name}
                {c.address.map((a, i) => (
                  <span key={i} className="block">
                    {a}
                  </span>
                ))}
              </p>
              <button type="button" onClick={() => copy([c.name, ...c.address].join("\n"), "Address")} className="inline-flex items-center gap-1.5 text-lagoon hover:underline">
                <Copy className="size-3.5" /> Copy address for the label
              </button>
              <p>
                <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Your order ${order.orderNumber}`)}`} className="text-lagoon hover:underline">
                  {c.email}
                </a>
                {c.phone && <span className="block text-cocoa">{c.phone}</span>}
              </p>
              {order.marketingConsent && <p className="text-xs text-muted-foreground">Signed up for emails at checkout.</p>}
              {order.visitorId && (
                <button type="button" onClick={() => go(`visitors/${order.visitorId}`)} className="text-sm text-lagoon hover:underline">
                  See what they looked at before ordering
                </button>
              )}
            </div>
          </section>

          <section className="rounded-[22px] border border-cocoa/10 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl text-cocoa">Customer&apos;s order page</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Their private link. It&apos;s in their emails too.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => copy(customerLink, "Link")} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cocoa/15 px-3 text-sm hover:bg-sand">
                <Copy className="size-4" /> Copy link
              </button>
              <a href={customerLink} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cocoa/15 px-3 text-sm hover:bg-sand">
                <ExternalLink className="size-4" /> Open
              </a>
            </div>
          </section>

          <section className="rounded-[22px] border border-cocoa/10 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl text-cocoa">History</h2>
            <ol className="mt-3 space-y-3">
              {[...order.history].reverse().map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", STATUS_STYLE[h.status]?.dot)} />
                  <span>
                    <span className="font-medium text-cocoa">{STATUS_STYLE[h.status]?.label ?? h.status}</span>{" "}
                    <span className="text-muted-foreground">{date(h.at, true)}</span>
                    {h.note && <span className="block text-muted-foreground">{h.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-[22px] border border-cocoa/10 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl text-cocoa">
              <Package className="size-4" /> Notes for you
            </h2>
            <textarea
              value={privateNote}
              onChange={(e) => setPrivateNote(e.target.value)}
              onBlur={() => void savePrivate()}
              rows={4}
              placeholder="Only you see this, e.g. bead colours used, postage paid…"
              className={cn(field, "mt-3 resize-y leading-relaxed")}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
