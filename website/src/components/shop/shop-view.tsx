"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { products, type Product } from "@/content/products"
import { collections } from "@/content/collections"
import { filterSwatches } from "@/content/bead-colors"
import { ProductCard } from "@/components/shop/product-card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
]
const MAX_PRICE = Math.ceil(Math.max(...products.map((p) => p.price)) / 10) * 10
const ALL_COLORS = Object.keys(filterSwatches).filter((c) => products.some((p) => p.colors.includes(c as never)))

type Filters = {
  q: string
  collections: string[]
  colors: string[]
  max: number
  inStock: boolean
  sort: string
}

function useFilters(locked?: string) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const list = (k: string) => params.get(k)?.split(",").filter(Boolean) ?? []
  const filters: Filters = {
    q: params.get("q") ?? "",
    collections: locked ? [locked] : list("collection"),
    colors: list("color"),
    max: Number(params.get("max")) || MAX_PRICE,
    inStock: params.get("instock") === "1",
    sort: params.get("sort") ?? "featured",
  }
  const set = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch }
    const sp = new URLSearchParams()
    if (next.q) sp.set("q", next.q)
    if (!locked && next.collections.length) sp.set("collection", next.collections.join(","))
    if (next.colors.length) sp.set("color", next.colors.join(","))
    if (next.max < MAX_PRICE) sp.set("max", String(next.max))
    if (next.inStock) sp.set("instock", "1")
    if (next.sort !== "featured") sp.set("sort", next.sort)
    const qs = sp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }
  return { filters, set }
}

function applyFilters(all: Product[], f: Filters) {
  const q = f.q.trim().toLowerCase()
  const out = all.filter(
    (p) =>
      (!q || `${p.name} ${p.short} ${p.colors.join(" ")} ${p.collections.join(" ")}`.toLowerCase().includes(q)) &&
      (!f.collections.length || f.collections.some((c) => p.collections.includes(c))) &&
      (!f.colors.length || f.colors.some((c) => p.colors.includes(c as never))) &&
      p.price <= f.max &&
      (!f.inStock || p.stock > 0)
  )
  const sorters: Record<string, (a: Product, b: Product) => number> = {
    featured: (a, b) => Number(!!b.featured) - Number(!!a.featured),
    newest: (a, b) => b.added.localeCompare(a.added),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
  }
  return [...out].sort(sorters[f.sort] ?? sorters.featured)
}

function FilterPanel({ filters, set, locked }: { filters: Filters; set: (p: Partial<Filters>) => void; locked?: string }) {
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  return (
    <div className="space-y-8">
      {!locked && (
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-cocoa">Collection</legend>
          <div className="space-y-2.5">
            {collections.map((c) => (
              <Label key={c.slug} className="flex cursor-pointer items-center gap-3 font-normal text-cocoa/80">
                <Checkbox
                  checked={filters.collections.includes(c.slug)}
                  onCheckedChange={() => set({ collections: toggle(filters.collections, c.slug) })}
                />
                {c.name}
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {products.filter((p) => p.collections.includes(c.slug)).length}
                </span>
              </Label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-cocoa">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {ALL_COLORS.map((c) => {
            const on = filters.colors.includes(c)
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                aria-label={c}
                title={c}
                onClick={() => set({ colors: toggle(filters.colors, c) })}
                className={cn(
                  "relative size-8 rounded-full ring-1 ring-black/10 transition-transform duration-200 hover:scale-110",
                  on && "ring-2 ring-cocoa ring-offset-2 ring-offset-porcelain"
                )}
                style={{
                  background: `radial-gradient(circle at 32% 30%, rgb(255 255 255 / .65), transparent 40%), ${filterSwatches[c]}`,
                }}
              />
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-4 flex w-full items-center justify-between text-sm font-medium text-cocoa">
          Max price <span className="font-normal text-muted-foreground tabular-nums">{formatPrice(filters.max)}</span>
        </legend>
        <Slider
          min={20}
          max={MAX_PRICE}
          step={2}
          value={[filters.max]}
          onValueChange={([v]) => set({ max: v })}
          aria-label="Maximum price"
        />
      </fieldset>

      <Label className="flex cursor-pointer items-center justify-between font-normal text-cocoa">
        In stock only
        <Switch checked={filters.inStock} onCheckedChange={(v) => set({ inStock: v })} />
      </Label>
    </div>
  )
}

export function ShopView({ lockedCollection }: { lockedCollection?: string }) {
  const { filters: urlFilters, set } = useFilters(lockedCollection)
  // Typing updates the list instantly; the address bar catches up a moment later.
  const [query, setQuery] = useState(urlFilters.q)
  useEffect(() => {
    if (query === urlFilters.q) return
    const t = setTimeout(() => set({ q: query }), 300)
    return () => clearTimeout(t)
  })
  const filters = { ...urlFilters, q: query }
  const results = applyFilters(products, filters)

  const chips = [
    ...(!lockedCollection
      ? filters.collections.map((c) => ({
          label: collections.find((x) => x.slug === c)?.name ?? c,
          clear: () => set({ collections: filters.collections.filter((x) => x !== c) }),
        }))
      : []),
    ...filters.colors.map((c) => ({ label: c, clear: () => set({ colors: filters.colors.filter((x) => x !== c) }) })),
    ...(filters.max < MAX_PRICE ? [{ label: `Under ${formatPrice(filters.max)}`, clear: () => set({ max: MAX_PRICE }) }] : []),
    ...(filters.inStock ? [{ label: "In stock", clear: () => set({ inStock: false }) }] : []),
    ...(filters.q ? [{ label: `“${filters.q}”`, clear: () => (setQuery(""), set({ q: "" })) }] : []),
  ]
  const clearAll = () => {
    setQuery("")
    set({ q: "", collections: [], colors: [], max: MAX_PRICE, inStock: false })
  }

  return (
    <div className="container-page mt-10">
      {/* Toolbar */}
      <div className="glass sticky top-[76px] z-30 mb-8 flex items-center gap-2 rounded-full p-1.5 pl-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bracelets"
          aria-label="Search bracelets"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm text-cocoa outline-none placeholder:text-muted-foreground"
        />
        <span className="hidden text-xs text-muted-foreground tabular-nums sm:block">
          {results.length} {results.length === 1 ? "bracelet" : "bracelets"}
        </span>
        <Select value={filters.sort} onValueChange={(v) => set({ sort: v })}>
          <SelectTrigger className="h-9 w-auto gap-2 rounded-full border-none bg-white/70 shadow-none" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-2xl">
            {SORTS.map((s) => (
              <SelectItem key={s.id} value={s.id} className="rounded-xl">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm" className="h-9 rounded-full lg:hidden">
              <SlidersHorizontal /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full overflow-y-auto bg-porcelain p-6 pt-14 sm:max-w-sm">
            <SheetTitle className="mb-6 font-display text-2xl font-normal">Filters</SheetTitle>
            <FilterPanel filters={filters} set={set} locked={lockedCollection} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-10 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-40">
            <FilterPanel filters={filters} set={set} locked={lockedCollection} />
            {chips.length > 0 && (
              <button type="button" onClick={clearAll} className="mt-8 text-sm text-clay underline-offset-4 hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        <div>
          <AnimatePresence initial={false}>
            {chips.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-6 flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={c.clear}
                      className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-xs text-cocoa capitalize transition-colors hover:bg-clay/15"
                    >
                      {c.label} <X className="size-3" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {results.length === 0 ? (
            <div className="rounded-[28px] border border-dashed p-12 text-center">
              <p className="font-display text-2xl text-cocoa">No bracelets match those filters</p>
              <p className="mt-2 text-sm text-muted-foreground">Remove a filter, or design exactly what you want.</p>
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" className="rounded-full" onClick={clearAll}>
                  Clear filters
                </Button>
                <Button asChild className="rounded-full">
                  <a href="/custom">Design your own</a>
                </Button>
              </div>
            </div>
          ) : (
            <LayoutGroup>
              <motion.ul layout className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {results.map((p, i) => (
                    <motion.li
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 24, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                      transition={{ type: "spring", stiffness: 260, damping: 28, delay: Math.min(i, 8) * 0.03 }}
                    >
                      <ProductCard product={p} priority={i < 3} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            </LayoutGroup>
          )}
        </div>
      </div>
    </div>
  )
}
