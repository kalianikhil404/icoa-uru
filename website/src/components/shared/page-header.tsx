import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { BeadShower } from "@/components/effects/bead-shower"
import { Reveal } from "@/components/motion/reveal"
import { cn } from "@/lib/utils"

/** The banner at the top of every inner page, with falling beads. */
export function PageHeader({
  title,
  intro,
  crumbs = [],
  children,
  className,
  tint = "from-sand",
}: {
  title: string
  intro?: React.ReactNode
  crumbs?: { label: string; href?: string }[]
  children?: React.ReactNode
  className?: string
  tint?: string
}) {
  return (
    <section
      className={cn(
        "relative mx-2 overflow-hidden rounded-[28px] bg-gradient-to-b to-porcelain sm:mx-3 sm:rounded-[36px]",
        tint,
        className
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-[8%] size-[380px] rounded-full bg-lagoon/15 blur-[100px]" />
        <div className="absolute -bottom-40 left-[5%] size-[360px] rounded-full bg-clay/12 blur-[100px]" />
      </div>
      {/* faint bead-grid dots */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgb(74_46_34/0.1)_1.3px,transparent_1.6px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_top_right,#000_10%,transparent_65%)]"
      />
      <BeadShower />
      <div className="container-page relative pt-36 pb-14 md:pt-40 md:pb-20">
        {crumbs.length > 0 && (
          <Reveal y={8}>
            <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-[0.82rem] text-muted-foreground">
              <Link href="/" className="hover:text-cocoa">
                Home
              </Link>
              {crumbs.map((c) => (
                <span key={c.label} className="flex items-center gap-1">
                  <ChevronRight className="size-3.5 opacity-60" />
                  {c.href ? (
                    <Link href={c.href} className="hover:text-cocoa">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-cocoa">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </Reveal>
        )}
        <Reveal>
          <h1 className="max-w-3xl font-display text-5xl leading-[1.02] font-light text-cocoa md:text-7xl">{title}</h1>
        </Reveal>
        {intro && (
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-muted-foreground">{intro}</p>
          </Reveal>
        )}
        {children && <Reveal delay={0.2}>{children}</Reveal>}
      </div>
    </section>
  )
}
