"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Check, ExternalLink, Package, PackageCheck, Scissors, Truck, Wallet, X } from "lucide-react"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

export type PublicOrder = {
  orderNumber: string
  createdAt: string
  status: "new" | "paid" | "weaving" | "shipped" | "delivered" | "cancelled"
  statusText: string
  history: { status: string; label: string; at: string; note?: string }[]
  paymentMethod: "etransfer" | "card"
  paymentLabel: string
  firstName: string
  shipping: string
  address: string[]
  lines: { name: string; quantity: number; sizeText: string; personalization: string; giftWrap: boolean; lineTotal: number }[]
  totals: { subtotal: number; discount: number; shipping: number; tax: number; total: number }
  messageToCustomer: string
  carrier: string
  trackingNumber: string
  trackingUrl: string
}

const STEPS = [
  { id: "new", label: "Order received", Icon: Package },
  { id: "paid", label: "Payment received", Icon: Wallet },
  { id: "weaving", label: "On the loom", Icon: Scissors },
  { id: "shipped", label: "On its way", Icon: Truck },
  { id: "delivered", label: "Delivered", Icon: PackageCheck },
] as const

export const when = (iso: string, withTime = false) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) })

/** One order, as its customer sees it: where it is now, tracking, and what's in it. */
export function OrderStatus({ order }: { order: PublicOrder }) {
  const cancelled = order.status === "cancelled"
  const reached = STEPS.findIndex((s) => s.id === order.status)
  const dateOf = (id: string) => [...order.history].reverse().find((h) => h.status === id)?.at

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border bg-white/70 p-6 shadow-soft backdrop-blur sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Order {order.orderNumber}, placed {when(order.createdAt)}</p>
            <h2 className={cn("mt-1 font-display text-3xl sm:text-4xl", cancelled ? "text-clay" : "text-cocoa")}>{order.statusText}</h2>
          </div>
          <p className="font-display text-2xl text-cocoa tabular-nums">{formatPrice(order.totals.total)}</p>
        </div>

        {cancelled ? (
          <p className="mt-6 flex items-center gap-2 rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">
            <X className="size-4" /> This order was cancelled{dateOf("cancelled") ? ` on ${when(dateOf("cancelled")!)}` : ""}.
          </p>
        ) : (
          <ol className="mt-8 grid grid-cols-5 gap-1" aria-label="Order progress">
            {STEPS.map((s, i) => {
              const done = i <= reached
              const current = i === reached
              const d = dateOf(s.id)
              return (
                <li key={s.id} className="relative flex flex-col items-center text-center" aria-current={current ? "step" : undefined}>
                  {i > 0 && (
                    <span className="absolute top-5 right-1/2 -z-0 h-0.5 w-full bg-sand">
                      <motion.span
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: done ? 1 : 0 }}
                        transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                        className="block h-full origin-left bg-lagoon"
                      />
                    </span>
                  )}
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.12 }}
                    className={cn(
                      "relative z-10 grid size-10 place-items-center rounded-full border-2",
                      done ? "border-lagoon bg-lagoon text-white" : "border-sand bg-white text-cocoa/40",
                      current && "ring-4 ring-lagoon/20"
                    )}
                  >
                    {done && !current ? <Check className="size-4" /> : <s.Icon className="size-4" />}
                  </motion.span>
                  <span className={cn("mt-2 text-[0.7rem] leading-tight sm:text-xs", done ? "font-medium text-cocoa" : "text-muted-foreground")}>{s.label}</span>
                  {d && <span className="mt-0.5 text-[0.65rem] text-muted-foreground sm:text-[0.7rem]">{when(d)}</span>}
                </li>
              )
            })}
          </ol>
        )}

        {order.status === "new" && order.paymentMethod === "etransfer" && (
          <p className="mt-6 rounded-2xl bg-sand/60 px-4 py-3 text-sm leading-relaxed text-cocoa">
            Waiting for your Interac e-Transfer of <strong>{formatPrice(order.totals.total)}</strong>, with <strong>{order.orderNumber}</strong> in the message. The
            steps above update as soon as it arrives.
          </p>
        )}

        {order.messageToCustomer && (
          <div className="mt-6 rounded-2xl border border-lagoon/20 bg-lagoon/5 px-4 py-3 text-sm leading-relaxed text-cocoa">
            <p className="text-xs font-medium text-lagoon">A note from us</p>
            <p className="mt-1 whitespace-pre-line">{order.messageToCustomer}</p>
          </div>
        )}

        {order.trackingNumber && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-porcelain px-4 py-3 text-sm">
            <span>
              <span className="text-muted-foreground">{order.carrier || "Tracking"}</span>{" "}
              <span className="font-medium text-cocoa tabular-nums">{order.trackingNumber}</span>
            </span>
            {order.trackingUrl && (
              <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lagoon px-4 text-white hover:bg-lagoon-deep">
                Track the parcel <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[28px] border bg-white/70 p-6 backdrop-blur">
          <h3 className="font-display text-xl text-cocoa">What&apos;s in it</h3>
          <ul className="mt-3 divide-y">
            {order.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-4 py-3 text-sm">
                <span className="text-cocoa">
                  {l.quantity} × {l.name}
                  <span className="block text-xs text-muted-foreground">
                    {[l.sizeText, l.personalization && `Name: ${l.personalization}`, l.giftWrap && "Gift wrapped"].filter(Boolean).join(", ")}
                  </span>
                </span>
                <span className="text-cocoa tabular-nums">{formatPrice(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1 border-t pt-3 text-sm">
            {[
              ["Subtotal", formatPrice(order.totals.subtotal)],
              ...(order.totals.discount ? [["Discount", `−${formatPrice(order.totals.discount)}`]] : []),
              ["Shipping", order.totals.shipping ? formatPrice(order.totals.shipping) : "Free"],
              ...(order.totals.tax ? [["Tax", formatPrice(order.totals.tax)]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-muted-foreground">
                <dt>{k}</dt>
                <dd className="tabular-nums">{v}</dd>
              </div>
            ))}
            <div className="flex justify-between pt-1 font-medium text-cocoa">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(order.totals.total)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-[28px] border bg-white/70 p-6 text-sm backdrop-blur">
          <h3 className="font-display text-xl text-cocoa">Delivery</h3>
          <p className="mt-3 leading-relaxed text-cocoa">
            {order.address.map((a, i) => (
              <span key={i} className="block">
                {a}
              </span>
            ))}
          </p>
          <p className="mt-3 text-muted-foreground">{order.shipping}</p>
          <p className="mt-1 text-muted-foreground">Paid by {order.paymentLabel}</p>
          <Link href={`/contact?order=${order.orderNumber}`} className="mt-5 inline-flex text-lagoon underline-offset-4 hover:underline">
            Questions about this order?
          </Link>
        </div>
      </div>
    </div>
  )
}
