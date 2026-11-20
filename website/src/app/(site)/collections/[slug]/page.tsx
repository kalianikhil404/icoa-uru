import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { collections } from "@/content/collections"
import { getCollection, getCollectionProducts } from "@/lib/catalog"
import { PageHeader } from "@/components/shared/page-header"
import { ShopView } from "@/components/shop/shop-view"

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const c = getCollection(slug)
  return c ? { title: c.name, description: c.description } : {}
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const { slug } = await params
  const collection = getCollection(slug)
  if (!collection) notFound()
  const count = getCollectionProducts(slug).length
  return (
    <>
      <PageHeader
        title={collection.name}
        intro={`${count} ${count === 1 ? "bracelet" : "bracelets"}. ${collection.description}`}
        crumbs={[{ label: "Collections", href: "/collections" }, { label: collection.name }]}
      />
      <Suspense>
        <ShopView lockedCollection={collection.slug} />
      </Suspense>
    </>
  )
}
