"use client"

import { Minus, Plus } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = "md",
  className,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  size?: "sm" | "md"
  className?: string
}) {
  const h = size === "sm" ? "h-9" : "h-11"
  const btn = cn(
    "grid aspect-square h-full place-items-center rounded-full text-cocoa transition-colors hover:bg-sand disabled:opacity-30 disabled:hover:bg-transparent",
    size === "sm" ? "[&_svg]:size-3.5" : "[&_svg]:size-4"
  )
  return (
    <div className={cn("inline-flex items-center rounded-full border bg-white/70 p-1", h, className)}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus />
      </button>
      <span className="relative w-8 overflow-hidden text-center text-sm font-medium tabular-nums" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus />
      </button>
    </div>
  )
}
