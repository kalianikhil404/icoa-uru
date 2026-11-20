import { NewsletterForm } from "@/components/shared/newsletter-form"
import { BeadRow } from "@/components/shared/bead-row"
import { Reveal } from "@/components/motion/reveal"
import { home } from "@/content/pages"

export function Newsletter() {
  return (
    <section className="container-page mt-28 md:mt-40">
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] border bg-gradient-to-br from-[#f8e6dc] via-sand to-[#dcefee] px-6 py-16 text-center md:px-16 md:py-20">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-white/60 blur-[90px]" />
          <div className="relative">
            <BeadRow count={9} size={18} className="justify-center" />
            <h2 className="mx-auto mt-8 max-w-xl text-[2.1rem] leading-[1.05] font-normal text-cocoa md:text-5xl">
              {home.newsletter.title}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              {home.newsletter.text}
            </p>
            <NewsletterForm className="mx-auto mt-8 max-w-md text-left" />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
