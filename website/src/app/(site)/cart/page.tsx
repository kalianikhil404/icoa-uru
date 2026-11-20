"use client"

import Link from "next/link"
import { AnimatePresence } from "motion/react"
import { Lock, ShoppingBag } from "lucide-react"
import { CartLine } from "@/components/cart/cart-line"
import { FreeShippingBar } from "@/components/cart/free-shipping-bar"
import { DiscountField } from "@/components/cart/discount-field"
import { TotalsList } from "@/components/cart/totals-list"
import { ShimmerLink } from "@/components/shared/shimmer-link"
import { BeadRow } from "@/components/shared/bead-row"
import { ProductCard } from "@/components/shop/product-card"
import { Reveal } from "@/components/motion/reveal"
import { cartCount, useCart } from "@/lib/stores"
import { calcTotals } from "@/lib/pricing"
import { getFeatured } from "@/lib/catalog"
import { useMounted } from "@/hooks/use-mounted"

export default function CartPage() {
  const mounted = useMounted()
  const items = useCart((s) => s.items)
  const discountCode = useCart((s) => s.discountCode)
  const list = mounted ? items : []
  const totals = calcTotals(list, { discountCode })
  const suggestions = getFeatured(8)
    .filter((p) => !list.some((i) => i.productId === p.id))
    .slice(0, 4)

  return (
    <div className="container-page pt-36 md:pt-40">
      <Reveal>
        <h1 className="font-display text-5xl font-light text-cocoa md:text-6xl">
          Your bag{" "}
          {list.length > 0 && <span className="align-top text-2xl text-muted-foreground tabular-nums">({cartCount(list)})</span>}
        </h1>
      </Reveal>

      {mounted && list.length === 0 ? (
        <Reveal className="mt-10">
          <div className="flex flex-col items-center rounded-[32px] border bg-white/60 px-6 py-16 text-center backdrop-blur">
            <div className="grid size-16 place-items-center rounded-full bg-sand">
              <ShoppingBag className="size-6 text-cocoa" />
            </div>
            <p className="mt-5 font-display text-3xl text-cocoa">Nothing in here yet</p>
            <p className="mt-2 text-muted-foreground">Browse the shop or paint your own pattern.</p>
            <BeadRow className="mt-6" />
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ShimmerLink href="/shop">Shop bracelets</ShimmerLink>
              <Link href="/custom" className="inline-flex h-12 items-center rounded-full border bg-white px-6 text-cocoa hover:bg-sand/50">
                Design your own
              </Link>
            </div>
          </div>
        </Reveal>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <FreeShippingBar subtotal={totals.subtotal} />
            <ul className="mt-4 divide-y">
              <AnimatePresence initial={false}>
                {list.map((item) => (
                  <CartLine key={item.key} item={item} />
                ))}
              </AnimatePresence>
            </ul>
          </div>
          <aside className="lg:col-span-5">
            <div className="glass space-y-6 rounded-[28px] p-6 lg:sticky lg:top-28 md:p-8">
              <h2 className="font-display text-2xl font-normal text-cocoa">Order summary</h2>
              <DiscountField />
              <TotalsList totals={totals} shippingKnown={false} />
              <Link
                href="/checkout"
                className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-lagoon py-3.5 text-[0.95rem] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-lagoon-deep"
              >
                <Lock className="size-4" /> Checkout
              </Link>
              <p className="text-center text-xs text-muted-foreground">Interac e-Transfer accepted. Taxes and shipping at checkout.</p>
            </div>
          </aside>
        </div>
      )}

      {suggestions.length > 0 && (
        <section className="mt-28">
          <h2 className="mb-10 font-display text-3xl font-normal text-cocoa md:text-4xl">Pairs well with</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
