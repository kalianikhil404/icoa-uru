import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { products } from "@/content/products"
import { site } from "@/content/site"
import { getCollection, getProduct, getRelated } from "@/lib/catalog"
import { ProductGallery } from "@/components/shop/product-gallery"
import { ProductInfo } from "@/components/shop/product-info"
import { ProductCard } from "@/components/shop/product-card"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/motion/reveal"

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return {}
  return {
    title: product.name,
    description: product.short,
    openGraph: { images: [{ url: product.images[0] }] },
  }
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()
  const related = getRelated(product)
  const collection = getCollection(product.collections[0])

  // Lets Google show price and stock in search results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => `${site.url}${i}`),
    description: product.short,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "CAD",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `${site.url}/shop/${product.slug}`,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-page pt-32 md:pt-36">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1 text-[0.82rem] text-muted-foreground">
          <Link href="/" className="hover:text-cocoa">
            Home
          </Link>
          <ChevronRight className="size-3.5 opacity-60" />
          <Link href="/shop" className="hover:text-cocoa">
            Shop
          </Link>
          {collection && (
            <>
              <ChevronRight className="size-3.5 opacity-60" />
              <Link href={`/collections/${collection.slug}`} className="hover:text-cocoa">
                {collection.name}
              </Link>
            </>
          )}
          <ChevronRight className="size-3.5 opacity-60" />
          <span className="text-cocoa">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-7" y={10}>
            <div className="lg:sticky lg:top-28">
              <ProductGallery images={product.images} video={product.video} name={product.name} />
            </div>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={0.1} y={10}>
            <ProductInfo product={product} />
          </Reveal>
        </div>
      </div>

      <section className="container-page mt-28">
        <SectionHeading
          title="You might also like"
          action={
            <Link href="/shop" className="text-sm text-cocoa underline-offset-4 hover:underline">
              View all bracelets
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
          {related.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}
