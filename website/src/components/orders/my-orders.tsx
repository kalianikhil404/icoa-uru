"use client"

import Link from "next/link"
import { useEffect, useState, useSyncExternalStore } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronRight, Loader2, PackageSearch } from "lucide-react"
import { formatPrice } from "@/lib/format"
import { rememberedOrders, rememberOrder } from "@/lib/track"
import { cn } from "@/lib/utils"
import { OrderStatus, when, type PublicOrder } from "@/components/orders/order-status"

const noSub = () => () => {}

/** The orders placed from this phone or computer, plus a way to find any order by number and email. */
export function MyOrders() {
  const inBrowser = useSyncExternalStore(noSub, () => true, () => false)
  const [orders, setOrders] = useState<PublicOrder[] | null>(null)
  const [found, setFound] = useState<PublicOrder | null>(null)

  useEffect(() => {
    if (!inBrowser) return
    const refs = rememberedOrders()
    if (!refs.length) {
      Promise.resolve().then(() => setOrders([]))
      return
    }
    fetch("/api/my-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refs }) })
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]))
  }, [inBrowser])

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <section aria-label="Your orders">
        {found && (
          <div className="mb-8">
            <OrderStatus order={found} />
          </div>
        )}
        {!orders ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-[24px] bg-sand/60" />
            ))}
          </div>
        ) : orders.length === 0 && !found ? (
          <div className="rounded-[28px] border bg-white/60 p-8 text-center">
            <PackageSearch className="mx-auto size-8 text-lagoon" />
            <p className="mt-3 font-display text-2xl text-cocoa">No orders on this device yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Orders you place here show up automatically. Ordered on another phone or computer? Find it with your order number and email.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o, i) => (
              <motion.li key={o.orderNumber} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link
                  href={`/orders/${o.orderNumber}?k=${encodeURIComponent(rememberedOrders().find((r) => r.n === o.orderNumber)?.k ?? "")}`}
                  className="group flex items-center gap-4 rounded-[24px] border bg-white/70 p-5 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      o.status === "cancelled" ? "bg-clay" : o.status === "delivered" || o.status === "shipped" ? "bg-lagoon" : "bg-marigold"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-cocoa">{o.statusText}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {o.orderNumber}, {when(o.createdAt)}, {o.lines.reduce((n, l) => n + l.quantity, 0)} item
                      {o.lines.reduce((n, l) => n + l.quantity, 0) === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="font-display text-lg text-cocoa tabular-nums">{formatPrice(o.totals.total)}</span>
                  <ChevronRight className="size-4 text-cocoa/40 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
      <FindOrder onFound={setFound} />
    </div>
  )
}

export function FindOrder({ onFound, initialNumber = "" }: { onFound: (o: PublicOrder) => void; initialNumber?: string }) {
  const [number, setNumber] = useState(initialNumber)
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  return (
    <form
      className="h-fit rounded-[28px] border bg-white/70 p-6 backdrop-blur lg:sticky lg:top-28"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError("")
        const res = await fetch("/api/order-lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: number, email }) }).catch(() => null)
        const data = await res?.json().catch(() => null)
        setBusy(false)
        if (!res?.ok || !data?.order) return setError(data?.error ?? "Something went wrong. Try again.")
        rememberOrder(data.order.orderNumber, data.key)
        onFound(data.order)
      }}
    >
      <h2 className="font-display text-2xl text-cocoa">Find an order</h2>
      <p className="mt-1 text-sm text-muted-foreground">Your order number is in your confirmation email, e.g. IU-5TXN3TL.</p>
      <label className="mt-5 block text-sm font-medium text-cocoa" htmlFor="lookup-number">
        Order number
      </label>
      <input
        id="lookup-number"
        value={number}
        onChange={(e) => setNumber(e.target.value.toUpperCase())}
        required
        placeholder="IU-"
        autoComplete="off"
        className="mt-1.5 h-12 w-full rounded-2xl border bg-white px-4 tracking-wide uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      <label className="mt-4 block text-sm font-medium text-cocoa" htmlFor="lookup-email">
        Email used for the order
      </label>
      <input
        id="lookup-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        className="mt-1.5 h-12 w-full rounded-2xl border bg-white px-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 text-sm text-clay">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <button type="submit" disabled={busy} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lagoon text-white hover:bg-lagoon-deep disabled:opacity-60">
        {busy && <Loader2 className="size-4 animate-spin" />} Find my order
      </button>
    </form>
  )
}
