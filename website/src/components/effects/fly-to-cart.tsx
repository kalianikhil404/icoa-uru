"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

type Flight = { id: number; x0: number; y0: number; x1: number; y1: number; color: string }

/** Call from any "Add to bag" button: a bead flies from the button into the bag icon. */
export function flyToCart(from: HTMLElement, color = "#2e7c79") {
  const r = from.getBoundingClientRect()
  window.dispatchEvent(
    new CustomEvent("icoa:fly", { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2, color } })
  )
}

/** Mounted once in the layout. Draws the flying beads. */
export function FlyToCartLayer() {
  const [flights, setFlights] = useState<Flight[]>([])

  useEffect(() => {
    let id = 0
    const onFly = (e: Event) => {
      const { x, y, color } = (e as CustomEvent).detail
      const targets = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].filter(
        (el) => el.offsetParent !== null
      )
      const t = targets[0]
      if (!t || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.dispatchEvent(new Event("icoa:cart-bump"))
        return
      }
      const r = t.getBoundingClientRect()
      setFlights((f) => [...f, { id: ++id, x0: x, y0: y, x1: r.left + r.width / 2, y1: r.top + r.height / 2, color }])
    }
    window.addEventListener("icoa:fly", onFly)
    return () => window.removeEventListener("icoa:fly", onFly)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden>
      <AnimatePresence>
        {flights.map((f) => {
          const peak = Math.min(f.y0, f.y1) - 140
          return (
            <motion.span
              key={f.id}
              className="absolute top-0 left-0 size-4 rounded-full"
              style={{
                background: `radial-gradient(circle at 32% 30%, #fff9 0 18%, transparent 40%), ${f.color}`,
                boxShadow: `0 4px 14px ${f.color}66`,
              }}
              initial={{ x: f.x0 - 8, y: f.y0 - 8, scale: 0.6, opacity: 0 }}
              animate={{
                x: [f.x0 - 8, (f.x0 + f.x1) / 2 - 8, f.x1 - 8],
                y: [f.y0 - 8, peak, f.y1 - 8],
                scale: [0.6, 1.3, 0.5],
                opacity: [0, 1, 1],
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.85, ease: [0.45, 0, 0.2, 1], times: [0, 0.45, 1] }}
              onAnimationComplete={() => {
                window.dispatchEvent(new Event("icoa:cart-bump"))
                setFlights((all) => all.filter((x) => x.id !== f.id))
              }}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}
