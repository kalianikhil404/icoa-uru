/* Reads settings.json (edit it in the website editor at /admin). */
import settings from "./settings.json"
import type { DiscountCode, ShippingMethod, SizeOption } from "./types"

export type { ShippingMethod, SizeOption }

export const site = {
  ...settings.site,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
}

export const shop = settings.shop
export const beads = settings.beads

export const sizes: SizeOption[] = settings.sizes
export const defaultSize = settings.defaultSize

export const shippingMethods: ShippingMethod[] = settings.shippingMethods

export const discountCodes: Record<string, { percent: number; label: string }> = Object.fromEntries(
  (settings.discountCodes as DiscountCode[]).map((d) => [d.code.trim().toUpperCase(), { percent: d.percent, label: d.label }])
)

export const payments = {
  etransfer: { enabled: true, label: settings.payments.etransferLabel, instructions: settings.payments.etransferInstructions },
  card: { enabled: process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true", label: settings.payments.cardLabel },
}

/* ---------- sizes ---------- */
export const sizeById = (id?: string) => sizes.find((s) => s.id === id)
export const sizeForRows = (rows: number) =>
  [...sizes].sort((a, b) => Math.abs(a.rows - rows) - Math.abs(b.rows - rows))[0]
/** Approximate band width, e.g. "≈ 1.4 cm" */
export const widthCm = (rows: number) => `≈ ${((rows * beads.beadHeightMm) / 10).toFixed(1)} cm`
/** Approximate band length without clasp, e.g. "≈ 12.6 cm" */
export const lengthCm = (len: number) => `≈ ${((len * beads.beadWidthMm) / 10).toFixed(1)} cm`
export const sizeLabel = (id?: string) => {
  const s = sizeById(id)
  return s ? `${s.label}, ${s.rows} rows` : (id ?? "")
}

/* ---------- navigation ---------- */
export const mainNav = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Design your own", href: "/custom" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export const footerNav = [
  {
    title: "Shop",
    links: [
      { label: "All bracelets", href: "/shop" },
      { label: "Collections", href: "/collections" },
      { label: "Design your own", href: "/custom" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "My orders", href: "/orders" },
      { label: "Sizes & care", href: "/size-guide" },
      { label: "FAQ", href: "/faq" },
      { label: "Shipping & returns", href: "/policies#shipping" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Studio",
    links: [
      { label: "About Icoa", href: "/about" },
      { label: "Privacy", href: "/policies#privacy" },
      { label: "Terms", href: "/policies#terms" },
    ],
  },
]
