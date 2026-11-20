import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { ShopView } from "@/components/shop/shop-view"
import { products } from "@/content/products"
import { pages } from "@/content/pages"

export const metadata: Metadata = {
  title: "Shop all bracelets",
  description: "Handwoven loom bead bracelets. Lorem ipsum dolor sit amet.",
}

export default function ShopPage() {
  return (
    <>
      <PageHeader
        title={pages.shop.title}
        intro={`${products.length} handwoven pieces. ${pages.shop.intro}`}
        crumbs={[{ label: "Shop" }]}
      />
      <Suspense>
        <ShopView />
      </Suspense>
    </>
  )
}
