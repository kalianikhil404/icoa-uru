"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Plus } from "lucide-react"
import type { Product } from "@/content/products"
import { shop } from "@/content/site"
import { unitPriceFor } from "@/lib/pricing"
import { filterSwatches } from "@/content/bead-colors"
import { WishlistButton } from "@/components/shop/wishlist-button"
import { Price } from "@/components/shared/price"
import { addToBag, lineKey } from "@/lib/cart-actions"
import { isSoldOut } from "@/lib/catalog"
import { cn } from "@/lib/utils"

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const soldOut = isSoldOut(product)
  const low = !soldOut && product.stock <= shop.lowStockAt
  const second = product.images[1]
  const quickAdd = (el: HTMLElement) => {
    addToBag(
      {
        key: lineKey([product.id]),
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        unitPrice: unitPriceFor({ productId: product.id }) ?? product.price,
        quantity: 1,
      },
      el,
      filterSwatches[product.colors[0]]
    )
  }

  return (
    <motion.article
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="group relative"
    >
      <Link href={`/shop/${product.slug}`} className="block rounded-[18px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:rounded-[24px]">
        <motion.div
          variants={{ rest: { y: 0 }, hover: { y: -6 } }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-sand shadow-soft transition-shadow duration-500 group-hover:shadow-lift sm:rounded-[24px]"
        >
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, 48vw"
            className={cn(
              "object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]",
              second && "group-hover:opacity-0",
              soldOut && "grayscale-[40%]"
            )}
          />
          {second && (
            <Image
              src={second}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, 48vw"
              className="scale-[1.06] object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
            />
          )}

          {(product.badge || soldOut) && (
            <span
              className={cn(
                "absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium backdrop-blur-md sm:top-3 sm:left-3 sm:px-3 sm:py-1 sm:text-[0.72rem]",
                soldOut ? "bg-cocoa/80 text-white" : "glass text-cocoa"
              )}
            >
              {soldOut ? "Sold out" : product.badge}
            </span>
          )}

          {/* Quick add (desktop). Made-to-order bracelets go to their page to pick a width. */}
          {!soldOut && (
            <div className="absolute inset-x-3 bottom-3 hidden translate-y-3 opacity-0 transition-all duration-400 ease-out group-hover:translate-y-0 group-hover:opacity-100 md:block">
              {product.customSize ? (
                <span className="glass flex h-10 items-center justify-center gap-1.5 rounded-full text-[0.8rem] font-medium text-cocoa">
                  Choose your width <ArrowRight className="size-3.5" />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    quickAdd(e.currentTarget)
                  }}
                  className="glass flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[0.8rem] font-medium text-cocoa transition-colors hover:bg-lagoon hover:text-white"
                >
                  <Plus className="size-3.5" /> Add to bag
                </button>
              )}
            </div>
          )}
        </motion.div>
      </Link>

      <WishlistButton slug={product.slug} name={product.name} className="absolute top-2 right-2 sm:top-3 sm:right-3" />

      <div className="mt-3 flex flex-col gap-1 px-0.5 sm:mt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:px-1">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[1.02rem] leading-tight text-cocoa sm:text-[1.2rem]">
            <Link href={`/shop/${product.slug}`}>{product.name}</Link>
          </h3>
          <div className="mt-1.5 hidden items-center gap-1 sm:mt-2 sm:flex" aria-label={`Colours: ${product.colors.join(", ")}`}>
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c}
                className="size-3 rounded-full ring-1 ring-black/10"
                style={{ background: filterSwatches[c] }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-baseline gap-2 sm:block sm:text-right">
          <Price amount={product.price} compareAt={product.compareAtPrice} className="text-[0.9rem] text-cocoa sm:text-[0.95rem]" />
          {low && <p className="text-[0.7rem] text-clay sm:mt-1 sm:text-[0.72rem]">Only {product.stock} left</p>}
        </div>
      </div>
    </motion.article>
  )
}
