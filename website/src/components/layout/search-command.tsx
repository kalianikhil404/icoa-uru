"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FileText, Layers } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { products } from "@/content/products"
import { collections } from "@/content/collections"
import { mainNav } from "@/content/site"
import { formatPrice } from "@/lib/format"
import { useUI } from "@/lib/stores"

/** Ctrl/⌘ + K search across bracelets, collections and pages. */
export function SearchCommand() {
  const open = useUI((s) => s.searchOpen)
  const setOpen = useUI((s) => s.setSearchOpen)
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(!useUI.getState().searchOpen)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [setOpen])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search bracelets, collections and pages"
      className="rounded-3xl sm:max-w-xl"
    >
      <CommandInput placeholder="Search bracelets, colours, collections…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No matches. Try a colour like “pink” or a theme like “fruit”.</CommandEmpty>
        <CommandGroup heading="Bracelets">
          {products.map((p) => (
            <CommandItem
              key={p.id}
              value={`${p.name} ${p.colors.join(" ")} ${p.collections.join(" ")}`}
              onSelect={() => go(`/shop/${p.slug}`)}
              className="gap-3 rounded-xl"
            >
              <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-sand">
                <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover" />
              </span>
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-muted-foreground tabular-nums">{formatPrice(p.price)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Collections">
          {collections.map((c) => (
            <CommandItem key={c.slug} value={`collection ${c.name}`} onSelect={() => go(`/collections/${c.slug}`)} className="rounded-xl">
              <Layers /> {c.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Pages">
          {[...mainNav, { label: "Size guide", href: "/size-guide" }, { label: "FAQ", href: "/faq" }].map((l) => (
            <CommandItem key={l.href} value={`page ${l.label}`} onSelect={() => go(l.href)} className="rounded-xl">
              <FileText /> {l.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
