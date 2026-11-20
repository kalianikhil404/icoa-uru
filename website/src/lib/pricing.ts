import { discountCodes, shippingMethods, shop, sizeById } from "@/content/site"
import { getProductById } from "@/lib/catalog"
import type { CartItem } from "@/lib/types"

/** Price of one unit, always worked out from the catalogue (never trusted from the browser). */
export function unitPriceFor(item: Pick<CartItem, "productId" | "giftWrap" | "personalization" | "size">) {
  let base: number
  if (item.productId === "custom") {
    base = shop.customBasePrice
  } else {
    const product = getProductById(item.productId)
    if (!product) return null
    base = product.price
    if (product.personalizable && item.personalization?.trim()) base += shop.personalizationPrice
    // ready-made bracelets have one fixed size: no size extras
    if (!product.customSize) {
      if (item.giftWrap) base += shop.giftWrapPrice
      return Math.max(0, base)
    }
  }
  base += sizeById(item.size)?.priceAdd ?? 0
  if (item.giftWrap) base += shop.giftWrapPrice
  return Math.max(0, base)
}

export function findDiscount(code?: string | null) {
  if (!code) return null
  const key = code.trim().toUpperCase()
  const found = discountCodes[key]
  return found ? { code: key, ...found } : null
}

export type Totals = {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  freeShippingRemaining: number
  itemCount: number
}

const round = (n: number) => Math.round(n * 100) / 100

export function calcTotals(
  lines: { unitPrice: number; quantity: number }[],
  opts: { shippingId?: string; discountCode?: string | null } = {}
): Totals {
  const subtotal = round(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0))
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0)
  const disc = findDiscount(opts.discountCode)
  const discount = disc ? round((subtotal * disc.percent) / 100) : 0

  const method = shippingMethods.find((m) => m.id === opts.shippingId)
  const qualifiesFree = subtotal >= shop.freeShippingThreshold
  let shipping = 0
  if (method && itemCount > 0) {
    shipping = method.freeOverThreshold && qualifiesFree ? 0 : method.price
  }
  const tax = round((subtotal - discount) * shop.taxRate)
  return {
    subtotal,
    discount,
    shipping,
    tax,
    total: round(subtotal - discount + shipping + tax),
    freeShippingRemaining: Math.max(0, round(shop.freeShippingThreshold - subtotal)),
    itemCount,
  }
}
