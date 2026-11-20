"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import { Check, Hand, Link2, ShoppingBag, Truck } from "lucide-react"
import type { Product } from "@/content/products"
import { beads, defaultSize, lengthCm, shop, sizes, widthCm } from "@/content/site"
import { filterSwatches } from "@/content/bead-colors"
import { Price } from "@/components/shared/price"
import { QuantityStepper } from "@/components/shared/quantity-stepper"
import { WishlistButton } from "@/components/shop/wishlist-button"
import { SizeGuideDialog } from "@/components/shop/size-guide-dialog"
import { DesignPreview } from "@/components/custom/design-preview"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { addToBag, lineKey } from "@/lib/cart-actions"
import { unitPriceFor } from "@/lib/pricing"
import { formatPrice } from "@/lib/format"
import { paletteIndex, writeText, type Grid } from "@/lib/patterns"
import { cn } from "@/lib/utils"
import { track } from "@/lib/track"

export function ProductInfo({ product }: { product: Product }) {
  // Only made-to-order bracelets let the customer pick a width; ready-made ones have one fixed size.
  const choose = !!product.customSize
  const [size, setSize] = useState<string>(sizes.find((s) => s.id === defaultSize)?.id ?? sizes[0]?.id ?? defaultSize)
  const len = product.length ?? beads.standardLength
  const [qty, setQty] = useState(1)
  const [giftWrap, setGiftWrap] = useState(false)
  const [name, setName] = useState("")
  const [added, setAdded] = useState(false)
  const [showBar, setShowBar] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const soldOut = product.stock <= 0
  const low = !soldOut && product.stock <= shop.lowStockAt
  const unit = unitPriceFor({ productId: product.id, giftWrap, personalization: name, size: choose ? size : undefined }) ?? product.price
  const current = choose ? sizes.find((s) => s.id === size) : undefined
  const rows = choose ? (current?.rows ?? 10) : (product.rows ?? 10)

  useEffect(() => {
    track("product_view", { slug: product.slug, value: product.price })
  }, [product.slug, product.price])

  // Sticky bar on phones once the main button scrolls away
  useEffect(() => {
    const el = buttonRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const add = (from: HTMLElement | null) => {
    if (soldOut) return
    addToBag(
      {
        key: lineKey([product.id, choose && size, giftWrap && "gift", name.trim().toUpperCase()]),
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        unitPrice: unit,
        quantity: qty,
        size: choose ? size : undefined,
        giftWrap,
        personalization: name.trim() ? name.trim().toUpperCase() : undefined,
      },
      from,
      filterSwatches[product.colors[0]]
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  // live preview of a woven name (the React compiler keeps this cheap)
  let namePreview: { fits: boolean; design: { rows: number; cols: number; cells: string } } | null = null
  if (product.personalizable) {
    const grid: Grid = Array.from({ length: rows }, () => Array.from({ length: len }, () => "bone"))
    const fits = writeText(grid, name || "NAME", "clay")
    namePreview = { fits, design: { rows, cols: len, cells: grid.flat().map((id) => paletteIndex[id].toString(16)).join("") } }
  }

  return (
    <div>
      {product.badge && (
        <span className="mb-4 inline-flex rounded-full bg-sand px-3 py-1 text-xs font-medium text-cocoa">{product.badge}</span>
      )}
      <h1 className="font-display text-4xl leading-[1.05] font-light text-cocoa md:text-5xl">{product.name}</h1>
      <div className="mt-4 flex items-center gap-4">
        <Price amount={unit} compareAt={product.compareAtPrice} className="font-display text-2xl text-cocoa" />
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={cn("size-2 rounded-full", soldOut ? "bg-muted-foreground" : low ? "bg-clay" : "bg-lagoon")} />
          {soldOut ? "Sold out" : low ? `Only ${product.stock} left` : "In stock, ready to ship"}
        </span>
      </div>
      <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">{product.short}</p>

      {/* Size: fixed for ready-made bracelets */}
      {!choose && (
        <dl className="mt-8 grid grid-cols-2 gap-3 rounded-3xl border bg-white/50 p-5 text-sm">
          <div>
            <dt className="text-muted-foreground">Width</dt>
            <dd className="mt-0.5 font-medium text-cocoa">
              {rows} rows <span className="font-normal text-muted-foreground">{widthCm(rows)}</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Length</dt>
            <dd className="mt-0.5 font-medium text-cocoa">
              {len} beads <span className="font-normal text-muted-foreground">{lengthCm(len)}</span>
            </dd>
          </div>
          <p className="col-span-2 text-muted-foreground">
            One of a kind, in this size. Clasp and {beads.extenderCm} cm extender chain to adjust the fit.{" "}
            <a href="/custom" className="text-lagoon underline-offset-4 hover:underline">
              Want another width? Design your own
            </a>
          </p>
        </dl>
      )}

      {/* Size: made-to-order bracelets */}
      {choose && (
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-cocoa">
            Width{" "}
            <span className="font-normal text-muted-foreground">
              {current?.rows} beads wide, {current && widthCm(current.rows)}
            </span>
          </p>
          <SizeGuideDialog />
        </div>
        <LayoutGroup id="size">
          <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const on = s.id === size
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSize(s.id)}
                  className={cn(
                    "relative flex h-12 min-w-16 flex-col items-center justify-center rounded-2xl border px-3 text-sm leading-none transition-colors",
                    on ? "border-transparent text-white" : "bg-white/60 text-cocoa hover:border-cocoa/40"
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="size-pill"
                      className="absolute inset-0 rounded-2xl bg-cocoa"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative">{s.label}</span>
                  <span className={cn("relative mt-1 text-[0.68rem]", on ? "text-white/70" : "text-muted-foreground")}>{s.rows} rows</span>
                </button>
              )
            })}
          </div>
        </LayoutGroup>
      </div>
      )}

      {/* Personalisation */}
      {product.personalizable && namePreview && (
        <div className="mt-7 rounded-3xl bg-sand/50 p-5">
          <Label htmlFor="name-input" className="text-sm font-medium text-cocoa">
            Your name or word{" "}
            <span className="font-normal text-muted-foreground">(+{formatPrice(shop.personalizationPrice)}, up to 7 letters)</span>
          </Label>
          <input
            id="name-input"
            value={name}
            maxLength={7}
            onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z ♥]/g, ""))}
            placeholder="e.g. MAYA"
            className="mt-3 h-11 w-full rounded-full border bg-white px-5 text-sm tracking-[0.2em] text-cocoa uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <p className="mt-4 mb-2 text-xs text-muted-foreground">Live preview</p>
          <DesignPreview design={namePreview.design} className="w-full" />
          {!namePreview.fits && (
            <p className="mt-2 text-xs text-clay">Names need at least 7 rows{choose ? ": choose Small or wider" : ""}.</p>
          )}
        </div>
      )}

      {/* Gift wrap */}
      <Label className="mt-6 flex cursor-pointer items-center gap-3 font-normal text-cocoa">
        <Checkbox checked={giftWrap} onCheckedChange={(v) => setGiftWrap(v === true)} />
        Gift wrap with a handwritten note
        <span className="text-muted-foreground">+{formatPrice(shop.giftWrapPrice)}</span>
      </Label>

      {/* Add to bag */}
      <div className="mt-8 flex items-center gap-3">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(10, product.stock))} />
        <motion.button
          ref={buttonRef}
          type="button"
          disabled={soldOut}
          onClick={(e) => add(e.currentTarget)}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "relative flex h-12 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full text-[0.95rem] font-medium text-white transition-colors",
            soldOut ? "bg-muted-foreground/40" : added ? "bg-cocoa" : "bg-lagoon hover:bg-lagoon-deep"
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={soldOut ? "sold" : added ? "added" : "add"}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              {soldOut ? (
                "Sold out"
              ) : added ? (
                <>
                  <Check className="size-4" /> Added to bag
                </>
              ) : (
                <>
                  <ShoppingBag className="size-4" /> Add to bag, {formatPrice(unit * qty)}
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <WishlistButton slug={product.slug} name={product.name} className="size-12 shrink-0" />
      </div>
      {soldOut && (
        <p className="mt-3 text-sm text-muted-foreground">
          This one has found a home. <a href="/contact" className="text-lagoon underline-offset-4 hover:underline">Ask about a remake</a>.
        </p>
      )}

      <ul className="mt-8 grid gap-3 rounded-3xl border bg-white/50 p-5 text-sm text-cocoa/80 sm:grid-cols-3">
        <li className="flex items-center gap-2.5">
          <Truck className="size-4 text-lagoon" /> Free shipping over {formatPrice(shop.freeShippingThreshold)}
        </li>
        <li className="flex items-center gap-2.5">
          <Link2 className="size-4 text-lagoon" /> Extender chain
        </li>
        <li className="flex items-center gap-2.5">
          <Hand className="size-4 text-lagoon" /> Handwoven
        </li>
      </ul>

      <Accordion type="single" collapsible defaultValue="description" className="mt-8">
        <AccordionItem value="description">
          <AccordionTrigger className="text-base text-cocoa">Description</AccordionTrigger>
          <AccordionContent className="space-y-3 leading-relaxed text-muted-foreground">
            {product.description.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="details">
          <AccordionTrigger className="text-base text-cocoa">Details</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2 text-muted-foreground">
              {product.details.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-marigold" /> {d}
                </li>
              ))}
              <li className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-marigold" /> {len} beads long ({lengthCm(len)}) plus clasp
                and {beads.extenderCm} cm extender chain
              </li>
              <li className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-marigold" /> {beads.name}, about{" "}
                {(len * rows).toLocaleString()} beads{choose ? " at this width" : ""}
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="shipping">
          <AccordionTrigger className="text-base text-cocoa">Shipping & care</AccordionTrigger>
          <AccordionContent className="leading-relaxed text-muted-foreground">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
            magna aliqua.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Phone: sticky add-to-bag bar */}
      <AnimatePresence>
        {showBar && !soldOut && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="glass fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-full p-2 pl-5 md:hidden"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-cocoa">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {current ? `${current.label}, ` : ""}
                {formatPrice(unit)}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => add(e.currentTarget)}
              className="h-11 rounded-full bg-lagoon px-5 text-sm font-medium text-white"
            >
              Add to bag
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
