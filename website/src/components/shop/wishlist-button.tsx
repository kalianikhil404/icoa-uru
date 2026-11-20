"use client"

import { AnimatePresence, motion } from "motion/react"
import { Heart } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useWishlist } from "@/lib/stores"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"

const BURST = ["#c65a42", "#d7a13b", "#2e7c79", "#f4c9d2", "#c65a42", "#2e7c79"]

export function WishlistButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const mounted = useMounted()
  const on = useWishlist((s) => s.slugs.includes(slug))
  const toggle = useWishlist((s) => s.toggle)
  const [burst, setBurst] = useState(0)
  const active = mounted && on

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const added = toggle(slug)
        if (added) setBurst((b) => b + 1)
        toast(added ? "Saved to your wishlist" : "Removed from your wishlist", { description: name })
      }}
      className={cn(
        "glass relative grid size-10 place-items-center rounded-full transition-transform duration-300 hover:scale-110 active:scale-95",
        className
      )}
    >
      <motion.span key={`h-${burst}`} animate={burst ? { scale: [1, 1.35, 1] } : undefined} transition={{ duration: 0.4 }}>
        <Heart className={cn("size-[18px] transition-colors", active ? "fill-clay text-clay" : "text-cocoa")} />
      </motion.span>
      <AnimatePresence>
        {burst > 0 && (
          <span key={burst} className="pointer-events-none absolute inset-0">
            {BURST.map((c, i) => {
              const a = (i / BURST.length) * Math.PI * 2
              return (
                <motion.span
                  key={i}
                  className="absolute top-1/2 left-1/2 size-1.5 rounded-full"
                  style={{ background: c }}
                  initial={{ x: -3, y: -3, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(a) * 22 - 3, y: Math.sin(a) * 22 - 3, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              )
            })}
          </span>
        )}
      </AnimatePresence>
    </button>
  )
}
