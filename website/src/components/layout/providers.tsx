"use client"

import { MotionConfig } from "motion/react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { CartDrawer } from "@/components/layout/cart-drawer"
import { SearchCommand } from "@/components/layout/search-command"
import { FlyToCartLayer } from "@/components/effects/fly-to-cart"

/** App-wide helpers: motion settings, tooltips, bag drawer, search and toasts. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={250}>
        {children}
        <CartDrawer />
        <SearchCommand />
        <FlyToCartLayer />
        <Toaster position="bottom-right" toastOptions={{ classNames: { toast: "rounded-2xl" } }} />
      </TooltipProvider>
    </MotionConfig>
  )
}
