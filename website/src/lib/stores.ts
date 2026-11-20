"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "@/lib/types"

/* ---------------- Cart (saved in the browser) ---------------- */
type CartState = {
  items: CartItem[]
  discountCode: string | null
  isOpen: boolean
  add: (item: CartItem) => void
  remove: (key: string) => void
  setQuantity: (key: string, quantity: number) => void
  clear: () => void
  setDiscount: (code: string | null) => void
  open: () => void
  close: () => void
  setOpen: (open: boolean) => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      discountCode: null,
      isOpen: false,
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.key === item.key)
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.key === item.key ? { ...i, quantity: Math.min(20, i.quantity + item.quantity) } : i
              ),
            }
          }
          return { items: [...s.items, item] }
        }),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      setQuantity: (key, quantity) =>
        set((s) => ({
          items: s.items.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(20, quantity)) } : i)),
        })),
      clear: () => set({ items: [], discountCode: null }),
      setDiscount: (code) => set({ discountCode: code }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "icoa-cart",
      partialize: (s) => ({ items: s.items, discountCode: s.discountCode }),
    }
  )
)

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0)

/* ---------------- Wishlist (saved in the browser) ---------------- */
type WishlistState = {
  slugs: string[]
  toggle: (slug: string) => boolean
  has: (slug: string) => boolean
  remove: (slug: string) => void
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) => {
        const on = !get().slugs.includes(slug)
        set((s) => ({ slugs: on ? [...s.slugs, slug] : s.slugs.filter((x) => x !== slug) }))
        return on
      },
      has: (slug) => get().slugs.includes(slug),
      remove: (slug) => set((s) => ({ slugs: s.slugs.filter((x) => x !== slug) })),
    }),
    { name: "icoa-wishlist" }
  )
)

/* ---------------- Small UI store (search palette) ---------------- */
type UIState = { searchOpen: boolean; setSearchOpen: (v: boolean) => void }
export const useUI = create<UIState>()((set) => ({
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}))
