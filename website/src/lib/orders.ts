import "server-only"
import { getProductById } from "@/lib/catalog"
import { calcTotals, unitPriceFor } from "@/lib/pricing"
import type { OrderRequest } from "@/lib/schemas"

export type PricedLine = {
  productId: string
  name: string
  quantity: number
  size?: string
  personalization?: string
  giftWrap?: boolean
  design?: OrderRequest["items"][number]["design"]
  unitPrice: number
  lineTotal: number
}

/** Re-prices every item from the catalogue so totals can't be tampered with. */
export function priceOrder(req: OrderRequest) {
  const lines: PricedLine[] = []
  for (const item of req.items) {
    const unit = unitPriceFor(item)
    if (unit === null) return { error: "One of the items is no longer available. Remove it from your bag and try again." }
    if (item.productId !== "custom") {
      const p = getProductById(item.productId)!
      if (p.stock <= 0) return { error: `${p.name} just sold out. Remove it from your bag to continue.` }
    } else if (!item.design) {
      return { error: "A custom design is missing its pattern. Add it again from the designer." }
    }
    const product = item.productId === "custom" ? null : getProductById(item.productId)!
    const name = product ? product.name : "Custom loom bracelet"
    // a ready-made bracelet has one size; never take a size from the browser for it
    const size = product && !product.customSize ? undefined : item.size
    lines.push({ ...item, size, name, unitPrice: unit, lineTotal: unit * item.quantity })
  }
  const totals = calcTotals(lines, { shippingId: req.shippingId, discountCode: req.discountCode })
  return { lines, totals }
}

export function newOrderNumber() {
  const t = Date.now().toString(36).toUpperCase().slice(-5)
  const r = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0")
  return `IU-${t}${r}`
}
