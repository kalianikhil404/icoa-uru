/* =====================================================================
   HOME PAGE — the order and visibility of sections come from
   src/content/home.json (change them in the website editor → Home page).
   ===================================================================== */

import { Hero } from "@/components/home/hero"
import { ValueStrip } from "@/components/home/value-strip"
import { FeaturedProducts } from "@/components/home/featured-products"
import { CollectionGrid } from "@/components/home/collection-grid"
import { MadeByHand } from "@/components/home/made-by-hand"
import { Process } from "@/components/home/process"
import { DesignTeaser } from "@/components/home/design-teaser"
import { Testimonials } from "@/components/home/testimonials"
import { Newsletter } from "@/components/home/newsletter"
import { SectionHeading } from "@/components/shared/section-heading"
import { home } from "@/content/pages"
import type { HomeSectionId } from "@/content/types"

const SECTIONS: Record<HomeSectionId, () => React.ReactNode> = {
  values: () => <ValueStrip />,
  featured: () => <FeaturedProducts />,
  collections: () => (
    <section className="container-page mt-28 md:mt-36">
      <SectionHeading title={home.collections.title} intro={home.collections.intro} />
      <CollectionGrid />
    </section>
  ),
  madeByHand: () => <MadeByHand />,
  process: () => <Process />,
  designTeaser: () => <DesignTeaser />,
  reviews: () => <Testimonials />,
  newsletter: () => <Newsletter />,
}

export default function HomePage() {
  return (
    <>
      <Hero />
      {home.sections
        .filter((s) => s.visible && SECTIONS[s.id])
        .map((s) => (
          <div key={s.id} id={`section-${s.id}`}>
            {SECTIONS[s.id]()}
          </div>
        ))}
    </>
  )
}
