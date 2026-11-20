import type { Metadata } from "next"
import { Droplets, Sparkles, Sun } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { SizeTable } from "@/components/shop/size-table"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { pages } from "@/content/pages"
import { beads, lengthCm, sizes, widthCm } from "@/content/site"
import { SizeBands } from "@/components/shop/size-bands"

export const metadata: Metadata = {
  title: "Sizes & care",
  description: "Bracelet widths from Mini to Large, and how to care for beadwork.",
}

const CARE = [
  { Icon: Droplets, title: "Keep it dry", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  { Icon: Sun, title: "Store away from sun", text: "Sed do eiusmod tempor incididunt ut labore et dolore." },
  { Icon: Sparkles, title: "Wipe gently", text: "Ut enim ad minim veniam, quis nostrud exercitation." },
]

export default function SizeGuidePage() {
  return (
    <>
      <PageHeader title={pages.sizeGuide.title} intro={pages.sizeGuide.intro} crumbs={[{ label: "Sizes & care" }]} />
      <section className="container-page mt-14">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-3xl font-normal text-cocoa md:text-4xl">Widths</h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Each size is a number of {beads.name.toLowerCase()} across the band, from {sizes[0]?.label} (
              {sizes[0]?.rows} rows, {sizes[0] && widthCm(sizes[0].rows)}) to {sizes.at(-1)?.label} ({sizes.at(-1)?.rows} rows,{" "}
              {sizes.at(-1) && widthCm(sizes.at(-1)!.rows)}).
            </p>
            <div className="mt-8">
              <SizeTable />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl font-normal text-cocoa md:text-4xl">See them side by side</h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Every bracelet is {beads.standardLength} beads long ({lengthCm(beads.standardLength)}) plus the clasp and a{" "}
              {beads.extenderCm} cm extender chain, so it fits most wrists.
            </p>
            <div className="mt-8">
              <SizeBands />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-page mt-24">
        <h2 className="text-3xl font-normal text-cocoa md:text-4xl">Caring for your beadwork</h2>
        <Stagger className="mt-8 grid gap-5 md:grid-cols-3">
          {CARE.map(({ Icon, title, text }) => (
            <StaggerItem key={title}>
              <div className="h-full rounded-[28px] border bg-white/60 p-7 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                <Icon className="size-6 text-lagoon" />
                <h3 className="mt-5 font-display text-2xl text-cocoa">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </>
  )
}
