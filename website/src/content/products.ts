/* Reads products.json — add and edit bracelets in the website editor (/admin). */
import data from "./products.json"
import type { BeadColor, Product } from "./types"

export type { BeadColor, Product }

const PLACEHOLDER = "/images/brand/logo-badge.png"
const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]).filter((x) => x !== "" && x != null) : [])

/** Fills in anything missing, so a half-finished bracelet never breaks a page. */
function tidy(p: Partial<Product>, i: number): Product {
  const slug = p.slug || `bracelet-${i + 1}`
  return {
    ...p,
    id: p.id || slug,
    slug,
    name: p.name || "Untitled bracelet",
    price: Number(p.price) || 0,
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
    short: p.short ?? "",
    description: list<string>(p.description),
    details: list<string>(p.details),
    images: list<string>(p.images).length ? list<string>(p.images) : [PLACEHOLDER],
    collections: list<string>(p.collections),
    colors: list<BeadColor>(p.colors),
    stock: Math.max(0, Number(p.stock ?? 0)),
    added: p.added || "2026-01-01",
  }
}

const seen = new Set<string>()
export const products: Product[] = (data as Partial<Product>[]).map(tidy).filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
