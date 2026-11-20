"use client"

import { motion } from "motion/react"
import { Truck } from "lucide-react"
import { shop } from "@/content/site"
import { formatPrice } from "@/lib/format"

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const pct = Math.min(100, (subtotal / shop.freeShippingThreshold) * 100)
  const remaining = Math.max(0, shop.freeShippingThreshold - subtotal)
  return (
    <div className="rounded-2xl bg-sand/60 p-4">
      <p className="flex items-center gap-2 text-sm text-cocoa">
        <Truck className="size-4 text-lagoon" />
        {remaining > 0 ? (
          <span>
            You&apos;re <strong className="font-semibold">{formatPrice(remaining)}</strong> away from free shipping
          </span>
        ) : (
          <span>Your order ships free</span>
        )}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lagoon via-marigold to-clay"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
      </div>
    </div>
  )
}
