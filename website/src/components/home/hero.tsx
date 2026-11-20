"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import { Gift, Hand, Gem, Shuffle, Sparkles } from "lucide-react"
import { BeadEngine } from "@/components/effects/bead-engine"
import { WordReveal } from "@/components/motion/word-reveal"
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text"
import { BorderBeam } from "@/components/magicui/border-beam"
import { ShimmerLink } from "@/components/shared/shimmer-link"
import { finishFor, paletteHex, patterns } from "@/lib/patterns"
import { home } from "@/content/pages"
import { heroBackground } from "@/lib/hero-backgrounds"
import { sizes, sizeById, widthCm } from "@/content/site"
import { cn } from "@/lib/utils"

const ease = [0.22, 1, 0.36, 1] as const

/* The loom needs room: 63 beads across. On phones (under 768px) only the falling beads show. */
const WIDE = "(min-width: 768px)"
const subscribeWide = (cb: () => void) => {
  const m = window.matchMedia(WIDE)
  m.addEventListener("change", cb)
  return () => m.removeEventListener("change", cb)
}
const TRUST_ICONS = [Hand, Gem, Gift]

export function Hero() {
  const hero = home.hero
  const bg = heroBackground(hero.background)
  const light = bg.light
  const length = hero.loomLength || 63
  const back = useRef<HTMLCanvasElement>(null)
  const front = useRef<HTMLCanvasElement>(null)
  const loom = useRef<HTMLDivElement>(null)
  const engine = useRef<BeadEngine | null>(null)
  const [count, setCount] = useState({ placed: 0, total: 0 })
  const [woven, setWoven] = useState(false)
  const [patternIdx, setPatternIdx] = useState(0)
  const [sizeId, setSizeId] = useState(sizeById(hero.loomSize)?.id ?? sizes[1]?.id ?? sizes[0].id)
  const size = sizeById(sizeId) ?? sizes[0]
  const sizeRows = useRef(size.rows)
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => true
  )

  useEffect(() => {
    if (!back.current) return
    if (!wide) {
      // phones: just the shower of beads, no loom
      const shower = new BeadEngine({
        back: back.current,
        mode: "shower",
        theme: light ? "light" : "dark",
        density: 0.7,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      })
      shower.start()
      engine.current = null
      return () => shower.destroy()
    }
    if (!front.current) return
    let raf = 0
    let latest = { placed: 0, total: 0 }
    const e = new BeadEngine({
      back: back.current,
      front: front.current,
      loom: loom.current,
      mode: "weave",
      theme: light ? "light" : "dark",
      cols: length,
      rows: sizeRows.current,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      getPattern: (cols, rows, i) =>
        patterns[i % patterns.length].build(cols, rows).map((row) => row.map((id) => paletteHex[id] ?? "#f1e9dc")),
      finishFor,
      onProgress: (placed, total) => {
        latest = { placed, total }
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => setCount(latest))
      },
      onWoven: () => setWoven(true),
    })
    engine.current = e
    e.start()
    return () => {
      cancelAnimationFrame(raf)
      e.destroy()
    }
    // the engine is made again only when switching between phone and wider screens; size changes go through setRows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide])

  const weaveAnother = () => {
    setWoven(false)
    setPatternIdx((i) => i + 1)
    engine.current?.reweave()
  }
  const chooseSize = (id: string) => {
    const s = sizeById(id)
    if (!s || id === sizeId) return
    setWoven(false)
    setSizeId(id)
    sizeRows.current = s.rows
    engine.current?.setRows(s.rows)
  }

  const pattern = patterns[patternIdx % patterns.length]

  return (
    <section
      data-light={light || undefined}
      style={{ background: bg.base }}
      className={cn("relative mx-2 overflow-hidden rounded-[28px] sm:mx-3 sm:rounded-[36px]", light && "shadow-[inset_0_0_0_1px_rgb(74_46_34/0.07)]")}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 right-[-10%] size-[620px] rounded-full blur-[140px]" style={{ background: bg.glows[0] }} />
        <div className="absolute bottom-[-30%] left-[-12%] size-[560px] rounded-full blur-[140px]" style={{ background: bg.glows[1] }} />
        <div className="absolute top-1/3 left-1/2 size-[300px] rounded-full blur-[120px]" style={{ background: bg.glows[2] }} />
        <div className={cn("grain absolute inset-0", light ? "opacity-30" : "opacity-70")} />
      </div>

      {/* Falling seed beads (behind the glass) */}
      <canvas ref={back} aria-hidden className="absolute inset-0 size-full" />

      <div className="container-page relative z-10 grid min-h-[86svh] items-center gap-12 pt-28 pb-14 md:min-h-[100svh] md:pt-32 md:pb-20 lg:min-h-[860px] lg:grid-cols-12 lg:gap-8 lg:pt-28">
        <div className="lg:col-span-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.1 }}>
            <Link
              href={hero.badgeLink || "/shop"}
              className={cn(
                "inline-flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-[0.8rem] transition-colors",
                light ? "glass-soft hover:bg-white/80" : "glass-dark hover:bg-white/10"
              )}
            >
              <span className="grid size-6 place-items-center rounded-full bg-marigold/90 text-espresso">
                <Sparkles className="size-3.5" />
              </span>
              <AnimatedShinyText className={cn("mx-0", light ? "text-cocoa/75 via-espresso" : "text-white/70 via-white")}>{hero.badgeText}</AnimatedShinyText>
            </Link>
          </motion.div>

          <WordReveal
            text={hero.headline}
            delay={0.15}
            className={cn(
              "mt-7 font-display text-[2.9rem] leading-[1.02] font-light tracking-[-0.03em] sm:text-6xl lg:text-[4.6rem]",
              light ? "text-espresso" : "text-[#fbf3e8]"
            )}
          />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.75 }}
            className={cn("mt-6 max-w-md text-[1.05rem] leading-relaxed", light ? "text-cocoa/75" : "text-white/60")}
          >
            {hero.intro}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.9 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <ShimmerLink href="/shop">{hero.primaryButton}</ShimmerLink>
            <Link
              href="/custom"
              className={cn(
                "inline-flex h-12 items-center rounded-full px-6 text-[0.95rem] transition-all duration-300 hover:-translate-y-0.5",
                light ? "glass-soft text-cocoa hover:bg-white/80" : "glass-dark text-white hover:bg-white/10"
              )}
            >
              {hero.secondaryButton}
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.15 }}
            className={cn("mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[0.82rem]", light ? "text-cocoa/70" : "text-white/55")}
          >
            {hero.trust.map((label, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length]
              return (
                <li key={label} className="flex items-center gap-2">
                  <Icon className={cn("size-4", light ? "text-[#b27a1c]" : "text-marigold/90")} /> {label}
                </li>
              )
            })}
          </motion.ul>
        </div>

        {/* The loom (not on phones) */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1, ease, delay: 0.15 }} className="hidden md:block lg:col-span-7">
          <div
            className={cn("relative cursor-pointer overflow-hidden rounded-[28px] p-4 select-none sm:p-5", light ? "glass-soft" : "glass-dark")}
            onPointerDown={(e) => engine.current?.ripple(e.clientX, e.clientY)}
            role="img"
            aria-label={`Bead loom weaving the ${pattern.name} pattern, ${length} beads long and ${size.rows} rows wide`}
          >
            <BorderBeam size={180} duration={9} colorFrom="#d7a13b" colorTo="#2e7c79" borderWidth={1.5} />
            <div className={cn("flex items-center justify-between px-1 text-[0.78rem]", light ? "text-cocoa/65" : "text-white/55")}>
              <span className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-marigold/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-marigold" />
                </span>
                On the loom
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={pattern.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={light ? "text-cocoa/85" : "text-white/80"}
                >
                  {pattern.name}
                </motion.span>
              </AnimatePresence>
            </div>

            <div ref={loom} className="mt-2 aspect-[3/1] w-full cursor-none sm:aspect-[3.6/1]" />

            {/* Size chips: the loom re-weaves at that width */}
            <LayoutGroup id="hero-size">
              <div
                role="radiogroup"
                aria-label="Bracelet width"
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "no-scrollbar mx-auto mb-3 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border p-1",
                  light ? "border-cocoa/10 bg-white/55" : "border-white/10 bg-white/5"
                )}
              >
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={s.id === sizeId}
                    onClick={() => chooseSize(s.id)}
                    className={cn(
                      "relative rounded-full px-3 py-1 text-[0.74rem] whitespace-nowrap transition-colors",
                      s.id === sizeId ? "text-espresso" : light ? "text-cocoa/65 hover:text-cocoa" : "text-white/70 hover:text-white"
                    )}
                  >
                    {s.id === sizeId && (
                      <motion.span layoutId="hero-size-pill" className="absolute inset-0 rounded-full bg-marigold" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                    )}
                    <span className="relative">
                      {s.label} <span className="opacity-60">{s.rows}</span>
                    </span>
                  </button>
                ))}
              </div>
            </LayoutGroup>

            <div className="flex items-center justify-between gap-3 px-1">
              <p className={cn("text-[0.78rem] tabular-nums", light ? "text-cocoa/65" : "text-white/55")}>
                <span className={light ? "text-cocoa" : "text-white"}>{count.placed.toLocaleString()}</span>
                {count.total > 0 && <> / {count.total.toLocaleString()}</>} beads
                <span className={cn("ml-2 hidden sm:inline", light ? "text-cocoa/45" : "text-white/35")}>
                  {length} long × {size.rows} wide, {widthCm(size.rows)}
                </span>
                <AnimatePresence>
                  {woven && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("ml-2 hidden lg:inline", light ? "text-cocoa/45" : "text-white/35")}>
                      Tap the loom
                    </motion.span>
                  )}
                </AnimatePresence>
              </p>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={weaveAnother}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.78rem] transition-colors",
                  light ? "border-cocoa/15 bg-white/60 text-cocoa/85 hover:bg-white" : "border-white/15 bg-white/5 text-white/80 hover:bg-white/15"
                )}
              >
                <Shuffle className="size-3.5" /> Weave another
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 lg:block"
      >
        <div className={cn("flex h-9 w-5.5 justify-center rounded-full border pt-2", light ? "border-cocoa/25" : "border-white/25")}>
          <motion.span
            className="size-1.5 rounded-full bg-marigold"
            animate={{ y: [0, 12, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      {/* Beads that pass in front of the glass */}
      <canvas ref={front} aria-hidden className="pointer-events-none absolute inset-0 z-20 size-full" />
    </section>
  )
}
