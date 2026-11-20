"use client"

import { track } from "@/lib/track"
import { toast } from "sonner"
import { useCart } from "@/lib/stores"
import { flyToCart } from "@/components/effects/fly-to-cart"
import type { CartItem } from "@/lib/types"
import { sizeLabel } from "@/content/site"

/** Adds an item, plays the bead animation and shows a confirmation. */
export function addToBag(item: CartItem, from?: HTMLElement | null, color?: string) {
  useCart.getState().add(item)
  track("add_to_bag", { slug: item.slug, value: item.unitPrice * item.quantity })
  if (from) flyToCart(from, color)
  toast.success("Added to your bag", {
    description: item.size ? `${item.name}, ${sizeLabel(item.size)}` : item.name,
    action: { label: "View bag", onClick: () => useCart.getState().open() },
  })
}

/** Builds a stable line id so the same bracelet + options stack together. */
export function lineKey(parts: (string | number | boolean | undefined)[]) {
  return parts.filter((p) => p !== undefined && p !== "" && p !== false).join("|")
}
