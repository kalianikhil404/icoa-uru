"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import confetti from "canvas-confetti"
import { Check, Copy } from "lucide-react"
import { payments, site, sizeLabel } from "@/content/site"
import { formatPrice } from "@/lib/format"
import { useCart } from "@/lib/stores"
import { BeadRow } from "@/components/shared/bead-row"
import { rememberOrder } from "@/lib/track"

type Saved = {
  orderNumber: string
  total: number
  email: string
  firstName: string
  paymentMethod: "etransfer" | "card"
  lines: { name: string; quantity: number; size?: string; lineTotal: number }[]
}

const BEAD_COLORS = ["#2e7c79", "#c65a42", "#d7a13b", "#9fdbd6", "#f4c9d2", "#23399b"]

export function OrderConfirmation() {
  const params = useSearchParams()
  const stripeSession = params.get("session_id")
  const [order, setOrder] = useState<Saved | null>(null)
  const [copied, setCopied] = useState("")
  const [cardKey, setCardKey] = useState("")
  const clear = useCart((s) => s.clear)
  const orderParam = params.get("order") ?? ""

  // card payments: confirm with Stripe, which saves the order and sends the emails
  useEffect(() => {
    if (!stripeSession || !orderParam) return
    let alive = true
    fetch("/api/checkout/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: orderParam, sessionId: stripeSession }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d?.key) return
        rememberOrder(d.orderNumber, d.key)
        setCardKey(d.key)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [stripeSession, orderParam])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("icoa-last-order")
      if (raw) setOrder(JSON.parse(raw)) // eslint-disable-line react-hooks/set-state-in-effect
    } catch {}
    if (stripeSession) clear()
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // a celebratory shower of bead-coloured confetti
      const shoot = (x: number) =>
        confetti({ particleCount: 70, spread: 70, startVelocity: 38, origin: { x, y: 0.35 }, colors: BEAD_COLORS, shapes: ["circle"], scalar: 0.9 })
      setTimeout(() => shoot(0.3), 250)
      setTimeout(() => shoot(0.7), 450)
    }
  }, [stripeSession, clear])

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(""), 1500)
  }

  const orderNumber = params.get("order") ?? order?.orderNumber
  const key = params.get("k") || cardKey

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
        className="mx-auto grid size-20 place-items-center rounded-full bg-lagoon text-white shadow-lift"
      >
        <Check className="size-9" strokeWidth={2.5} />
      </motion.div>
      <h1 className="mt-8 font-display text-5xl font-light text-cocoa md:text-6xl">
        Thank you{order?.firstName ? `, ${order.firstName}` : ""}!
      </h1>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        {stripeSession
          ? "Your payment went through. A receipt is on its way to your inbox."
          : `Your order is in. A confirmation is on its way to ${order?.email ?? "your inbox"}.`}
      </p>
      {orderNumber && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-sand px-4 py-2 text-sm text-cocoa">
          Order <strong className="tabular-nums">{orderNumber}</strong>
        </p>
      )}

      {order?.paymentMethod === "etransfer" && (
        <div className="glass mx-auto mt-10 max-w-xl rounded-[28px] p-6 text-left md:p-8">
          <h2 className="font-display text-2xl font-normal text-cocoa">Finish with Interac e-Transfer</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{payments.etransfer.instructions}</p>
          <dl className="mt-6 space-y-3">
            {[
              { label: "Send to", value: site.email },
              { label: "Amount", value: formatPrice(order.total) },
              { label: "Message", value: order.orderNumber },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3">
                <dt className="text-sm text-muted-foreground">{row.label}</dt>
                <dd className="flex items-center gap-2 text-sm font-medium text-cocoa">
                  {row.value}
                  <button type="button" onClick={() => copy(row.value)} aria-label={`Copy ${row.label}`} className="rounded-full p-1.5 hover:bg-sand">
                    {copied === row.value ? <Check className="size-3.5 text-lagoon" /> : <Copy className="size-3.5" />}
                  </button>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {order?.lines && order.lines.length > 0 && (
        <div className="mx-auto mt-6 max-w-xl rounded-[28px] border bg-white/60 p-6 text-left">
          <ul className="space-y-2 text-sm">
            {order.lines.map((l, i) => (
              <li key={i} className="flex justify-between text-cocoa">
                <span>
                  {l.quantity} × {l.name}
                  {l.size && <span className="text-muted-foreground"> ({sizeLabel(l.size)})</span>}
                </span>
                <span className="tabular-nums">{formatPrice(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t pt-4 font-medium text-cocoa">
            Total <span className="font-display text-xl tabular-nums">{formatPrice(order.total)}</span>
          </p>
        </div>
      )}

      <BeadRow className="mt-12 justify-center" />
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {orderNumber && key ? (
          <Link href={`/orders/${orderNumber}?k=${encodeURIComponent(key)}`} className="inline-flex h-12 items-center rounded-full bg-lagoon px-6 text-white hover:bg-lagoon-deep">
            Follow your order
          </Link>
        ) : (
          <Link href="/shop" className="inline-flex h-12 items-center rounded-full bg-lagoon px-6 text-white hover:bg-lagoon-deep">
            Keep browsing
          </Link>
        )}
        <Link href="/contact" className="inline-flex h-12 items-center rounded-full border bg-white px-6 text-cocoa hover:bg-sand/50">
          Questions?
        </Link>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        You can check on your order any time under{" "}
        <Link href="/orders" className="text-lagoon underline underline-offset-4">
          My orders
        </Link>
        .
      </p>
    </motion.div>
  )
}
