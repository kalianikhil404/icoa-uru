"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { AnimatePresence, LayoutGroup, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react"
import { Heart, Search, ShoppingBag } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { mainNav } from "@/content/site"
import { home } from "@/content/pages"
import { heroBackground } from "@/lib/hero-backgrounds"
import { cartCount, useCart, useUI, useWishlist } from "@/lib/stores"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"

// On a light home banner the menu bar stays light
const heroIsLight = heroBackground(home.hero.background).light

export function SiteHeader() {
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [overHero, setOverHero] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)
  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 24)
    setOverHero(v < window.innerHeight * 0.75)
  })
  // On the home page the bar turns dark while it floats over the dark hero
  const dark = pathname === "/" && overHero && !heroIsLight
  // Sits under the announcement bar, then glides to the top as you scroll.
  const top = useTransform(scrollY, [0, 36], [46, 10])

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  return (
    <motion.header style={{ top }} className="fixed inset-x-0 z-50 px-3 sm:px-4">
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        data-dark={dark || undefined}
        className={cn(
          "group/nav mx-auto flex h-[60px] max-w-6xl items-center justify-between rounded-full pr-2 pl-1.5 transition-[box-shadow,background-color,border-color] duration-500 sm:h-[74px] sm:pl-2",
          dark ? "glass-dark" : "glass",
          scrolled && !dark && "bg-white/80 shadow-[0_18px_40px_-20px_rgb(74_46_34/0.35)]"
        )}
      >
        <Logo light={dark} />

        <LayoutGroup>
          <nav className="hidden items-center md:flex" onMouseLeave={() => setHovered(null)} aria-label="Main">
            {mainNav.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHovered(item.href)}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[0.9rem] transition-colors lg:px-4",
                    dark
                      ? active
                        ? "text-white"
                        : "text-white/70 hover:text-white"
                      : active
                        ? "text-cocoa"
                        : "text-cocoa/70 hover:text-cocoa"
                  )}
                >
                  {hovered === item.href && (
                    <motion.span
                      layoutId="nav-hover"
                      className={cn("absolute inset-0 rounded-full", dark ? "bg-white/10" : "bg-sand/80")}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className={cn("absolute -bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full", dark ? "bg-marigold" : "bg-lagoon")}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </LayoutGroup>

        <div className="flex items-center gap-0.5">
          <SearchButton />
          <WishlistButton />
          <CartButton />
          <MobileNav />
        </div>
      </motion.div>
    </motion.header>
  )
}

const iconBtn =
  "relative grid size-10 place-items-center rounded-full text-cocoa transition-colors hover:bg-sand/80 focus-visible:ring-2 focus-visible:ring-ring group-data-[dark]/nav:text-white group-data-[dark]/nav:hover:bg-white/10 [&_svg]:size-[19px]"

function SearchButton() {
  const setOpen = useUI((s) => s.setSearchOpen)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={iconBtn} onClick={() => setOpen(true)} aria-label="Search">
          <Search />
        </button>
      </TooltipTrigger>
      <TooltipContent>Search (Ctrl K)</TooltipContent>
    </Tooltip>
  )
}

function Badge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-clay px-1 text-[0.66rem] font-semibold text-white tabular-nums"
        >
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

function WishlistButton() {
  const mounted = useMounted()
  const count = useWishlist((s) => s.slugs.length)
  return (
    <Link href="/wishlist" className={cn(iconBtn, "hidden sm:grid")} aria-label="Wishlist">
      <Heart />
      <Badge count={mounted ? count : 0} />
    </Link>
  )
}

function CartButton() {
  const mounted = useMounted()
  const items = useCart((s) => s.items)
  const open = useCart((s) => s.open)
  const [bump, setBump] = useState(0)
  useEffect(() => {
    const onBump = () => setBump((b) => b + 1)
    window.addEventListener("icoa:cart-bump", onBump)
    return () => window.removeEventListener("icoa:cart-bump", onBump)
  }, [])
  return (
    <motion.button
      type="button"
      data-cart-target
      onClick={open}
      className={iconBtn}
      aria-label="Open bag"
      key={bump}
      animate={bump ? { scale: [1, 1.22, 0.94, 1], rotate: [0, -8, 6, 0] } : undefined}
      transition={{ duration: 0.5 }}
    >
      <ShoppingBag />
      <Badge count={mounted ? cartCount(items) : 0} />
    </motion.button>
  )
}
