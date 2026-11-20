"use client"

import Link from "next/link"
import { AnimatePresence } from "motion/react"
import { ShoppingBag } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { CartLine } from "@/components/cart/cart-line"
import { FreeShippingBar } from "@/components/cart/free-shipping-bar"
import { BeadRow } from "@/components/shared/bead-row"
import { cartCount, useCart } from "@/lib/stores"
import { calcTotals } from "@/lib/pricing"
import { formatPrice } from "@/lib/format"
import { useMounted } from "@/hooks/use-mounted"

export function CartDrawer() {
  const mounted = useMounted()
  const { items, isOpen, setOpen, close } = useCart()
  const list = mounted ? items : []
  const totals = calcTotals(list)

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full gap-0 border-none bg-porcelain p-0 sm:max-w-md">
        <div className="flex items-center gap-3 border-b px-6 py-5">
          <SheetTitle className="font-display text-2xl font-normal text-cocoa">Your bag</SheetTitle>
          <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs text-cocoa tabular-nums">{cartCount(list)}</span>
          <SheetDescription className="sr-only">Items in your shopping bag</SheetDescription>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-sand">
              <ShoppingBag className="size-6 text-cocoa" />
            </div>
            <div>
              <p className="font-display text-2xl text-cocoa">Your bag is empty</p>
              <p className="mt-2 text-sm text-muted-foreground">Find a bracelet you love, or design your own.</p>
            </div>
            <BeadRow count={7} size={8} />
            <div className="flex gap-2">
              <Button asChild className="rounded-full" onClick={close}>
                <Link href="/shop">Shop bracelets</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full" onClick={close}>
                <Link href="/custom">Design your own</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 pt-5">
              <FreeShippingBar subtotal={totals.subtotal} />
            </div>
            <ul className="flex-1 divide-y overflow-y-auto px-6">
              <AnimatePresence initial={false}>
                {list.map((item) => (
                  <CartLine key={item.key} item={item} compact />
                ))}
              </AnimatePresence>
            </ul>
            <div className="space-y-4 border-t bg-white/60 px-6 py-5 backdrop-blur">
              <div className="flex items-center justify-between text-cocoa">
                <span>Subtotal</span>
                <span className="font-display text-2xl tabular-nums">{formatPrice(totals.subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping and discount codes are applied at checkout.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="lg" className="h-12 rounded-full" onClick={close}>
                  <Link href="/cart">View bag</Link>
                </Button>
                <Button asChild size="lg" className="h-12 rounded-full" onClick={close}>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
