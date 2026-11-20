import Link from "next/link"
import { ArrowRight, Gem, Hand, Link2 } from "lucide-react"
import { BorderBeam } from "@/components/magicui/border-beam"
import { Reveal } from "@/components/motion/reveal"
import { SpinningBadge } from "@/components/shared/spinning-badge"
import { getProduct } from "@/lib/catalog"
import { formatPrice } from "@/lib/format"
import { home } from "@/content/pages"

const ICONS = [Hand, Gem, Link2]
const mbh = home.madeByHand
const FEATURES = mbh.features.map((f, i) => ({ ...f, Icon: ICONS[i % ICONS.length] }))

export function MadeByHand() {
  const featured = getProduct(mbh.productSlug)
  return (
    <section className="container-page mt-28 md:mt-40">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="relative lg:col-span-5">
          <SpinningBadge className="absolute -top-8 -right-2 z-10 hidden sm:grid lg:-right-10" />
          <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-[32px] bg-sand shadow-lift">
            <video
              src={mbh.video}
              poster={featured?.images[0]}
              autoPlay
              muted
              loop
              playsInline
              className="size-full object-cover"
              aria-label={featured ? `The ${featured.name} bracelet being worn` : "A bracelet being worn"}
            />
            <BorderBeam size={220} duration={10} colorFrom="#c65a42" colorTo="#d7a13b" borderWidth={2} />
            {featured && (
              <Link
                href={`/shop/${featured.slug}`}
                className="glass absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl px-4 py-3 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <span>
                  <span className="block font-display text-lg leading-tight text-cocoa">{featured.name}</span>
                  <span className="text-xs text-cocoa/70">{formatPrice(featured.price)}</span>
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-cocoa text-white">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            )}
          </div>
        </Reveal>

        <div className="lg:col-span-7">
          <Reveal>
            <h2 className="max-w-xl text-[2.1rem] leading-[1.05] font-normal text-cocoa md:text-5xl">
              {mbh.title}
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
              {mbh.text}
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ Icon, title, text }, i) => (
              <Reveal key={title} delay={0.08 * i}>
                <div className="h-full rounded-3xl border bg-white/60 p-5 transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-soft">
                  <span className="grid size-10 place-items-center rounded-full bg-sand text-lagoon">
                    <Icon className="size-[18px]" />
                  </span>
                  <p className="mt-4 font-medium text-cocoa">{title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <Link href="/about" className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-cocoa">
              Meet Icoa, the designer
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
