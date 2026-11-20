import { Marquee } from "@/components/magicui/marquee"
import { SectionHeading } from "@/components/shared/section-heading"
import { testimonials } from "@/content/testimonials"
import { home } from "@/content/pages"

export function Testimonials() {
  if (testimonials.length === 0) return null
  return (
    <section id="reviews" className="mt-28 scroll-mt-24 md:mt-40">
      <div className="container-page">
        <SectionHeading title={home.reviews.title} />
      </div>
      <div className="relative [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <Marquee pauseOnHover repeat={2} className="[--duration:55s] [--gap:1.25rem]">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="relative w-[280px] shrink-0 sm:w-[320px] rounded-[26px] border bg-white/70 p-6 shadow-soft backdrop-blur md:w-[380px]"
            >
              <div className="mb-4 flex gap-1" aria-hidden>
                {["#c65a42", "#d7a13b", "#2e7c79", "#d7a13b", "#c65a42"].map((c, j) => (
                  <span key={j} className="size-2.5 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <blockquote className="font-display text-xl leading-snug text-cocoa">“{t.quote}”</blockquote>
              <figcaption className="mt-5 text-sm text-muted-foreground">
                {t.name}
                {t.product && <span className="text-cocoa/60">, wears {t.product}</span>}
              </figcaption>
            </figure>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
