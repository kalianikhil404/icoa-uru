"use client"

import { useEffect, useRef } from "react"
import { BeadEngine } from "@/components/effects/bead-engine"
import { cn } from "@/lib/utils"

/** A soft shower of seed beads that falls when the page opens, then keeps drifting. */
export function BeadShower({
  className,
  density = 0.8,
  theme = "light",
}: {
  className?: string
  density?: number
  theme?: "light" | "dark"
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const engine = new BeadEngine({ back: ref.current, mode: "shower", theme, density })
    engine.start()
    return () => engine.destroy()
  }, [theme, density])
  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 size-full", className)} />
}
