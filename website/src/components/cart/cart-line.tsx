"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { Trash2 } from "lucide-react"
import { QuantityStepper } from "@/components/shared/quantity-stepper"
import { DesignPreview } from "@/components/custom/design-preview"
import { formatPrice } from "@/lib/format"
import { sizeLabel } from "@/content/site"
import { getProductById } from "@/lib/catalog"
import { useCart } from "@/lib/stores"
import type { CartItem } from "@/lib/types"
import { cn } from "@/lib/utils"

export function CartLine({ item, compact = false }: { item: CartItem; compact?: boolean }) {
  const setQuantity = useCart((s) => s.setQuantity)
  const remove = useCart((s) => s.remove)
  const href = item.productId === "custom" ? "/custom" : `/shop/${item.slug}`
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex gap-4 py-4"
    >
      <Link
        href={href}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-2xl bg-sand",
          compact ? "h-24 w-20" : "h-32 w-26 sm:h-36 sm:w-28"
        )}
      >
        {item.design ? (
          <div className="grid h-full place-items-center p-2">
            <DesignPreview design={item.design} vertical className="h-full" />
          </div>
        ) : (
          <Image src={item.image} alt={item.name} fill sizes="120px" className="object-cover" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={href} className="font-display text-lg leading-tight text-cocoa hover:underline">
              {item.name}
            </Link>
            <ul className="mt-1 space-y-0.5 text-[0.8rem] text-muted-foreground">
              {item.size ? <li>{sizeLabel(item.size)}</li> : getProductById(item.productId)?.rows ? <li>{getProductById(item.productId)!.rows} rows wide</li> : null}
              {item.personalization && <li>Name: “{item.personalization}”</li>}
              {item.giftWrap && <li>Gift wrapped</li>}
              {item.design && (
                <li>
                  Custom pattern, {item.design.cols}×{item.design.rows} beads
                </li>
              )}
            </ul>
          </div>
          <span className="shrink-0 text-sm font-medium text-cocoa tabular-nums">
            {formatPrice(item.unitPrice * item.quantity)}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper size="sm" value={item.quantity} onChange={(q) => setQuantity(item.key, q)} />
          <button
            type="button"
            onClick={() => remove(item.key)}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-clay/10 hover:text-clay"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        </div>
      </div>
    </motion.li>
  )
}
