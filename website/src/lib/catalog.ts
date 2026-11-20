import { products, type Product } from "@/content/products"
import { collections } from "@/content/collections"

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug)
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id)
}

export function getCollection(slug: string) {
  return collections.find((c) => c.slug === slug)
}

export function getCollectionProducts(slug: string) {
  return products.filter((p) => p.collections.includes(slug))
}

export function getFeatured(limit = 4) {
  const featured = products.filter((p) => p.featured)
  return (featured.length ? featured : products).slice(0, limit)
}

/** Products sharing a collection or colour with the given one */
export function getRelated(product: Product, limit = 4) {
  return products
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      score:
        p.collections.filter((c) => product.collections.includes(c)).length * 2 +
        p.colors.filter((c) => product.colors.includes(c)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p)
}

export const isSoldOut = (p: Product) => p.stock <= 0
