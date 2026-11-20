import type { Metadata } from "next"
import { PageHeader } from "@/components/shared/page-header"
import { PatternDesigner } from "@/components/custom/pattern-designer"
import { ContactForm } from "@/components/contact/contact-form"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/motion/reveal"
import { pages } from "@/content/pages"

export const metadata: Metadata = {
  title: "Design your own bracelet",
  description: "Paint your own loom bracelet pattern bead by bead. Lorem ipsum dolor sit amet.",
}

export default function CustomPage() {
  return (
    <>
      <PageHeader
        title={pages.custom.title}
        intro={pages.custom.intro}
        crumbs={[{ label: "Design your own" }]}
        tint="from-[#dcefee]"
      />
      <div className="container-page mt-12">
        <Reveal>
          <PatternDesigner />
        </Reveal>
      </div>
      <section className="container-page mt-28">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading
              title="Rather talk it through?"
              intro="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Matching sets, events and bigger ideas welcome."
              className="mb-0 md:mb-0"
            />
          </div>
          <Reveal className="lg:col-span-8" delay={0.1}>
            <div className="rounded-[28px] border bg-white/60 p-6 shadow-soft backdrop-blur md:p-8">
              <ContactForm mode="custom" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
