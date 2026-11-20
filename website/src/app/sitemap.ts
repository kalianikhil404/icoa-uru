import type { MetadataRoute } from "next"
import { products } from "@/content/products"
import { collections } from "@/content/collections"
import { site } from "@/content/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/shop", "/collections", "/custom", "/about", "/contact", "/faq", "/size-guide", "/policies"]
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...collections.map((c) => ({ url: `${site.url}/collections/${c.slug}`, priority: 0.7 })),
    ...products.map((p) => ({ url: `${site.url}/shop/${p.slug}`, priority: 0.8 })),
  ]
}
