import type { Metadata } from "next"
import { PageHeader } from "@/components/shared/page-header"
import { CollectionGrid } from "@/components/home/collection-grid"
import { pages } from "@/content/pages"

export const metadata: Metadata = {
  title: "Collections",
  description: "Bead bracelets grouped by theme. Lorem ipsum dolor sit amet.",
}

export default function CollectionsPage() {
  return (
    <>
      <PageHeader
        title={pages.collections.title}
        intro={pages.collections.intro}
        crumbs={[{ label: "Collections" }]}
      />
      <div className="container-page mt-12">
        <CollectionGrid />
      </div>
    </>
  )
}
