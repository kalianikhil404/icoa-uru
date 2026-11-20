"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Paintbrush } from "lucide-react"
import { BeadShower } from "@/components/effects/bead-shower"
import { paletteHex, patterns } from "@/lib/patterns"
import { useBeadUrls } from "@/hooks/use-bead-urls"
import { home } from "@/content/pages"
import { cn } from "@/lib/utils"

const COLS = 31
const ROWS = 10
const BRUSHES = ["#e8a82a", "#d0213c", "#8fd8d2", "#fbfbf8", "#1f3da3"]

/** A small interactive loom: patterns cycle on their own, and visitors can paint beads. */
export function DesignTeaser() {
  const t = home.designTeaser
  const [idx, setIdx] = useState(0)
  const [brush, setBrush] = useState(BRUSHES[0])
  const [painted, setPainted] = useState<Record<number, string>>({})
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (hovering || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = setInterval(() => {
      setIdx((i) => i + 1)
      setPainted({})
    }, 3600)
    return () => clearInterval(timer)
  }, [hovering])

  const grid = useMemo(
    () => patterns[idx % patterns.length].build(COLS, ROWS).flatMap((row) => row.map((id) => paletteHex[id])),
    [idx]
  )
  const urls = useBeadUrls([...grid, ...BRUSHES, ...Object.values(painted)])

  return (
    <section className="mx-2 mt-28 sm:mx-3 md:mt-40">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-lagoon-deep via-lagoon to-[#3f8f88] sm:rounded-[36px]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-20 size-[460px] rounded-full bg-marigold/25 blur-[120px]" />
          <div className="grain absolute inset-0 opacity-50" />
        </div>
        <BeadShower theme="dark" density={0.5} />
        <div className="container-page relative grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
          <div>
            <h2 className="max-w-md text-[2.4rem] leading-[1.02] font-light text-white md:text-6xl">{t.title}</h2>
            <p className="mt-5 max-w-md leading-relaxed text-white/70">{t.text}</p>
            <Link
              href="/custom"
              className="group mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[0.95rem] font-medium text-lagoon-deep transition-transform duration-300 hover:-translate-y-0.5"
            >
              {t.button} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="glass-dark rounded-[28px] p-5 sm:p-6" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            <div className="mb-4 flex items-center justify-between text-[0.8rem] text-white/70">
              <span className="flex items-center gap-2">
                <Paintbrush className="size-3.5" /> Try it: tap a bead
              </span>
              <div className="flex gap-1.5">
                {BRUSHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Paint with ${c}`}
                    onClick={() => setBrush(c)}
                    className={cn("grid size-7 place-items-center rounded-full transition-transform hover:scale-110", brush === c && "bg-white/20 ring-1 ring-white")}
                  >
                    <span className="size-6 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: urls[c] ? `url(${urls[c]})` : undefined }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-black/15 p-3">
              <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
                {grid.map((hex, i) => {
                  const col = i % COLS
                  const color = painted[i] ?? hex
                  return (
                    <button
                      key={i}
                      type="button"
                      tabIndex={-1}
                      aria-hidden
                      onClick={() => setPainted((p) => ({ ...p, [i]: brush }))}
                      className="aspect-[10/7] bg-center bg-no-repeat transition-transform duration-150 hover:z-10 hover:scale-125"
                      style={{
                        backgroundImage: urls[color] ? `url(${urls[color]})` : undefined,
                        backgroundColor: urls[color] ? undefined : color,
                        backgroundSize: "112% auto",
                        transition: `background-image .4s ${col * 0.02}s`,
                      }}
                    />
                  )
                })}
              </div>
            </div>
            <p className="mt-4 text-[0.8rem] text-white/60">{patterns[idx % patterns.length].name}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
