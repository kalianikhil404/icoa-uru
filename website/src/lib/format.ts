import { shop } from "@/content/site"

const formatter = new Intl.NumberFormat(shop.locale, {
  style: "currency",
  currency: shop.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** 48 -> "$48", 48.5 -> "$48.50" */
export function formatPrice(amount: number) {
  const hasCents = Math.round(amount * 100) % 100 !== 0
  return hasCents
    ? new Intl.NumberFormat(shop.locale, { style: "currency", currency: shop.currency }).format(amount)
    : formatter.format(amount)
}
