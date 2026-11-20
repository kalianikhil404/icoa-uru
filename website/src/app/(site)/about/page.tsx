import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock, Palette, Sprout } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { Marquee } from "@/components/magicui/marquee"
import { MagicCard } from "@/components/magicui/magic-card"
import { ShimmerLink } from "@/components/shared/shimmer-link"
import { SpinningBadge } from "@/components/shared/spinning-badge"
import { products } from "@/content/products"
import { about } from "@/content/pages"

export const metadata: Metadata = {
  title: about.title,
  description: about.intro,
}

const ICONS = [Clock, Palette, Sprout]

export default function AboutPage() {
  return (
    <>
      <PageHeader title={about.title} intro={about.intro} crumbs={[{ label: "About" }]} />

      <section className="container-page mt-16 md:mt-24">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-sand shadow-lift">
                <Image src={about.mainImage} alt="" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
              </div>
              <SpinningBadge className="absolute -top-6 -left-4 sm:-left-8" />
              {about.smallImage && (
                <div className="glass absolute -right-3 -bottom-6 w-44 overflow-hidden rounded-[24px] p-2 sm:-right-8 sm:w-56">
                  <div className="relative aspect-square overflow-hidden rounded-[18px]">
                    <Image src={about.smallImage} alt="" fill sizes="224px" className="object-cover" />
                  </div>
                </div>
              )}
            </div>
          </Reveal>
          <Reveal className="lg:col-span-6" delay={0.1}>
            <h2 className="text-[2.1rem] leading-[1.05] font-normal text-cocoa md:text-5xl">{about.heading}</h2>
            <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
              {about.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="mt-8 font-display text-3xl text-cocoa italic">{about.signature}</p>
          </Reveal>
        </div>
      </section>

      <section className="container-page mt-28">
        <Stagger className="grid gap-5 md:grid-cols-3">
          {about.values.map(({ title, text }, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <StaggerItem key={title + i}>
                <MagicCard
                  className="h-full rounded-[28px] transition-transform duration-500 hover:-translate-y-1"
                  gradientFrom="#2e7c79"
                  gradientTo="#d7a13b"
                  gradientColor="#efe5d8"
                  gradientOpacity={0.6}
                >
                  <div className="p-7">
                    <span className="grid size-12 place-items-center rounded-2xl bg-sand text-lagoon transition-transform duration-500 group-hover:rotate-6">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-6 font-display text-2xl text-cocoa">{title}</h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </MagicCard>
              </StaggerItem>
            )
          })}
        </Stagger>
      </section>

      <section className="mt-28">
        <Marquee pauseOnHover repeat={2} className="[--duration:60s] [--gap:1rem]">
          {products.map((p) => (
            <Link key={p.id} href={`/shop/${p.slug}`} className="relative block aspect-[4/5] w-52 overflow-hidden rounded-[22px] bg-sand md:w-64">
              <Image src={p.images[0]} alt={p.name} fill sizes="256px" className="object-cover transition-transform duration-700 hover:scale-105" />
            </Link>
          ))}
        </Marquee>
      </section>

      <section className="container-page mt-24 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-[2.1rem] leading-[1.05] font-normal text-cocoa md:text-5xl">{about.ctaTitle}</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ShimmerLink href="/shop">Shop bracelets</ShimmerLink>
            <Link href="/custom" className="group inline-flex h-12 items-center gap-2 rounded-full border bg-white/70 px-6 text-cocoa transition-colors hover:bg-white">
              Design your own <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  )
}
