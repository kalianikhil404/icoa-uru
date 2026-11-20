"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "motion/react"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { BeadRow } from "@/components/shared/bead-row"
import { SocialIcons } from "@/components/shared/social-icons"
import { mainNav } from "@/content/site"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const links = [...mainNav, { label: "My orders", href: "/orders" }, { label: "Wishlist", href: "/wishlist" }, { label: "FAQ", href: "/faq" }]
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full text-cocoa hover:bg-sand/80 group-data-[dark]/nav:text-white group-data-[dark]/nav:hover:bg-white/10 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full border-none bg-porcelain p-0 sm:max-w-sm">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex h-full flex-col px-7 pt-20 pb-8">
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: 24 }}
                animate={open ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.08 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-cocoa/10 py-4 font-display text-3xl text-cocoa"
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>
          <div className="mt-auto space-y-6">
            <BeadRow count={11} size={14} />
            <SocialIcons className="text-cocoa" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
