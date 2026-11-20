import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getFeatured } from "@/lib/catalog"
import { ProductCard } from "@/components/shop/product-card"
import { SectionHeading } from "@/components/shared/section-heading"
import { Stagger, StaggerItem } from "@/components/motion/reveal"
import { home } from "@/content/pages"

export function FeaturedProducts() {
  const items = getFeatured(home.featured.count || 4)
  return (
    <section className="container-page mt-28 md:mt-36">
      <SectionHeading
        title={home.featured.title}
        intro={home.featured.intro}
        action={
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 rounded-full border bg-white/60 px-5 py-2.5 text-sm text-cocoa transition-colors hover:bg-white"
          >
            Shop all <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      />
      <Stagger className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
        {items.map((p, i) => (
          <StaggerItem key={p.id}>
            <ProductCard product={p} priority={i < 2} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
