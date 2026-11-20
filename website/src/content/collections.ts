/* Reads collections.json — edit collections in the website editor (/admin). */
import data from "./collections.json"
import productData from "./products.json"
import type { Collection } from "./types"

export type { Collection }

const firstPhoto = (slug: string) =>
  (productData as { collections?: string[]; images?: string[] }[]).find((p) => p.collections?.includes(slug) && p.images?.length)?.images?.[0]

export const collections: Collection[] = (data as Partial<Collection>[])
  .filter((c) => c.slug)
  .map((c) => ({
    slug: c.slug!,
    name: c.name || c.slug!,
    description: c.description ?? "",
    image: c.image || firstPhoto(c.slug!) || "/images/brand/logo-badge.png",
    tint: c.tint || "#efe5d8",
  }))
