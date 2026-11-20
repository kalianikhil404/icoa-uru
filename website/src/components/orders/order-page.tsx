"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { rememberedOrders, rememberOrder } from "@/lib/track"
import { OrderStatus, type PublicOrder } from "@/components/orders/order-status"
import { FindOrder } from "@/components/orders/my-orders"

/** /orders/IU-XXXX?k=… : the link from the confirmation email and the thank-you page. */
export function OrderPage({ orderNumber }: { orderNumber: string }) {
  const params = useSearchParams()
  const [order, setOrder] = useState<PublicOrder | null>(null)
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading")

  useEffect(() => {
    const key = params.get("k") || rememberedOrders().find((r) => r.n === orderNumber)?.k || ""
    if (!key) {
      Promise.resolve().then(() => setState("missing"))
      return
    }
    let alive = true
    const load = () =>
      fetch(`/api/order/${encodeURIComponent(orderNumber)}?k=${encodeURIComponent(key)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((o) => {
          if (!alive) return
          if (o) {
            rememberOrder(orderNumber, key)
            setOrder(o)
            setState("ok")
          } else setState("missing")
        })
        .catch(() => alive && setState("missing"))
    load()
    // keeps itself up to date while open
    const t = setInterval(load, 60_000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [orderNumber, params])

  if (state === "loading") return <div className="h-72 animate-pulse rounded-[28px] bg-sand/60" />
  if (state === "missing" || !order)
    return (
      <div className="mx-auto max-w-md">
        <FindOrder initialNumber={orderNumber} onFound={(o) => (setOrder(o), setState("ok"))} />
      </div>
    )
  return <OrderStatus order={order} />
}
