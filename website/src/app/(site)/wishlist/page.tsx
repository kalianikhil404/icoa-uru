"use client"

import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { Heart } from "lucide-react"
import { products } from "@/content/products"
import { useWishlist } from "@/lib/stores"
import { useMounted } from "@/hooks/use-mounted"
import { ProductCard } from "@/components/shop/product-card"
import { ShimmerLink } from "@/components/shared/shimmer-link"

export default function WishlistPage() {
  const mounted = useMounted()
  const slugs = useWishlist((s) => s.slugs)
  const saved = mounted ? products.filter((p) => slugs.includes(p.slug)) : []

  return (
    <div className="container-page pt-36 md:pt-40">
      <h1 className="font-display text-5xl font-light text-cocoa md:text-6xl">Wishlist</h1>
      <p className="mt-3 text-muted-foreground">Saved on this device. Tap the heart on any bracelet to add it here.</p>

      {mounted && saved.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-[32px] border bg-white/60 px-6 py-16 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-sand">
            <Heart className="size-6 text-clay" />
          </div>
          <p className="mt-5 font-display text-3xl text-cocoa">No favourites yet</p>
          <p className="mt-2 text-muted-foreground">Save bracelets you love and come back to them later.</p>
          <div className="mt-8">
            <ShimmerLink href="/shop">Browse bracelets</ShimmerLink>
          </div>
        </div>
      ) : (
        <motion.ul layout className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {saved.map((p) => (
              <motion.li key={p.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <ProductCard product={p} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
      {saved.length > 0 && (
        <p className="mt-12 text-center text-sm">
          <Link href="/shop" className="text-lagoon underline-offset-4 hover:underline">
            Keep browsing
          </Link>
        </p>
      )}
    </div>
  )
}
