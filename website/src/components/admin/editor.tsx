"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  ImageOff,
  LayoutDashboard,
  Loader2,
  Monitor,
  PanelLeft,
  Plus,
  Redo2,
  Search,
  Trash2,
  Undo2,
} from "lucide-react"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Fields } from "./fields"
import { Preview } from "./preview"
import { SECTIONS, sectionById, type ListSection, type Section } from "./sections"
import { getIn, setIn, useEditor, type Json, type Path } from "./store"
import { SaveVersionButton, VersionsSheet } from "./versions"

/* ------------------------------------------------------------------
   The website editor: pick a section on the left, change it in the
   middle, see the website update on the right. Everything saves by
   itself; Undo / Redo and saved versions are at the top.
------------------------------------------------------------------- */

/* Which section / item is open lives in the address (#products/3), so a reload keeps your place.
   history.pushState is used (not location.hash) so Next.js keeps the address when the page refreshes. */
let navCurrent: string | null = null
const navListeners = new Set<() => void>()
const readHash = () => decodeURIComponent(window.location.hash.slice(1))
const subscribeNav = (cb: () => void) => {
  navListeners.add(cb)
  const onPop = () => {
    navCurrent = readHash()
    navListeners.forEach((l) => l())
  }
  window.addEventListener("popstate", onPop)
  return () => {
    navListeners.delete(cb)
    window.removeEventListener("popstate", onPop)
  }
}
const navSnapshot = () => (navCurrent ??= readHash())
const go = (hash: string) => {
  if (hash === navCurrent) return
  navCurrent = hash
  window.history.pushState(null, "", `#${hash}`)
  navListeners.forEach((l) => l())
}

export function Editor() {
  const content = useEditor((s) => s.content)
  const status = useEditor((s) => s.status)
  const error = useEditor((s) => s.error)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const { load, undo, redo, saveNow } = useEditor.getState()
  const [reloadSignal, setReloadSignal] = useState(0)
  const [view, setView] = useState<"edit" | "preview">("edit")

  const hash = useSyncExternalStore(subscribeNav, navSnapshot, () => "")
  const [sectionId, itemPart] = hash.split("/")
  const section = sectionById(sectionId || "home")
  const itemIndex = itemPart !== undefined && itemPart !== "" ? Number(itemPart) : null

  useEffect(() => {
    void load()
  }, [load])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault()
        redo()
      } else if (k === "s") {
        e.preventDefault()
        void saveNow().then(() => toast.success("Saved"))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo, saveNow])

  // don't lose a change that hasn't been written yet
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      const s = useEditor.getState().status
      if (s === "pending" || s === "saving") e.preventDefault()
    }
    window.addEventListener("beforeunload", onLeave)
    return () => window.removeEventListener("beforeunload", onLeave)
  }, [])

  const list = section.kind === "list" ? ((getIn(content?.[section.file], section.base) ?? []) as Json[]) : []
  const item = section.kind === "list" && itemIndex !== null ? list[itemIndex] : undefined
  const previewPath = section.kind === "list" ? section.preview(item) : section.preview

  return (
    <div className="grid h-dvh grid-rows-[auto_1fr] bg-porcelain text-cocoa">
      {/* ---------------- top bar ---------------- */}
      <header className="flex min-w-0 items-center gap-1.5 overflow-x-auto border-b border-cocoa/10 bg-white/80 px-3 py-2 backdrop-blur sm:px-4">
        <Link href="/control" className="flex items-center gap-2.5 rounded-xl py-1 pr-2" aria-label="Control center">
          <Image src="/images/brand/logo-mark.png" alt="" width={42} height={42} className="rounded-full" />
          <span className="hidden font-display text-lg leading-none sm:block">Website editor</span>
        </Link>
        <SaveStatus status={status} error={error} onRetry={() => void saveNow()} />
        <div className="ml-auto flex items-center gap-1">
          <ToolButton label="Undo" keys="Ctrl Z" onClick={undo} disabled={!canUndo}>
            <Undo2 className="size-4" />
          </ToolButton>
          <ToolButton label="Redo" keys="Ctrl Y" onClick={redo} disabled={!canRedo}>
            <Redo2 className="size-4" />
          </ToolButton>
          <span className="mx-1 h-6 w-px bg-cocoa/10" />
          <SaveVersionButton />
          <VersionsSheet
            onRestored={async () => {
              await load()
              setReloadSignal((n) => n + 1)
            }}
          />
          <span className="mx-1 hidden h-6 w-px bg-cocoa/10 sm:block" />
          <div className="flex rounded-xl bg-sand/70 p-0.5 xl:hidden">
            {(
              [
                ["edit", PanelLeft, "Edit"],
                ["preview", Monitor, "Preview"],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm", view === id ? "bg-white text-cocoa shadow-sm" : "text-cocoa/70")}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <a href="/" target="_blank" rel="noreferrer" className="hidden h-9 items-center gap-1.5 rounded-xl px-3 text-sm hover:bg-sand sm:inline-flex">
            <ExternalLink className="size-4" /> View website
          </a>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-1 md:grid-cols-[212px_minmax(0,1fr)] xl:grid-cols-[212px_440px_minmax(0,1fr)] 2xl:grid-cols-[232px_500px_minmax(0,1fr)]">
        {/* ---------------- sections ---------------- */}
        <nav aria-label="Sections" className={cn("min-h-0 overflow-y-auto border-r border-cocoa/10 bg-white/50 p-2", view === "preview" ? "hidden xl:block" : "hidden md:block")}>
          <ul className="space-y-0.5">
            {SECTIONS.map((s) => {
              const on = s.id === section.id
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(s.id)}
                    aria-current={on ? "page" : undefined}
                    className={cn("relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors", on ? "text-white" : "text-cocoa/80 hover:bg-sand/70")}
                  >
                    {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-cocoa" transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} />}
                    <s.icon className="relative size-4 shrink-0" />
                    <span className="relative">{s.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 border-t border-cocoa/10 pt-3">
            <Link href="/control" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-cocoa/80 hover:bg-sand/70">
              <LayoutDashboard className="size-4" /> Control center
            </Link>
          </div>
        </nav>

        {/* ---------------- editing panel ---------------- */}
        <main className={cn("min-h-0 overflow-y-auto border-r border-cocoa/10", view === "preview" && "hidden xl:block")}>
          <MobileSectionPicker current={section.id} />
          {!content ? (
            <PanelMessage status={status} error={error} onRetry={() => void load()} />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={section.id + (item ? `/${itemIndex}` : "")}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="px-4 py-6 sm:px-6"
              >
                {section.kind === "form" ? (
                  <FormPanel section={section} />
                ) : item && itemIndex !== null ? (
                  <ItemPanel section={section} index={itemIndex} item={item} />
                ) : (
                  <ListPanel section={section} items={list} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* ---------------- live preview ---------------- */}
        <section aria-label="Live preview" className={cn("min-h-0", view === "edit" ? "hidden xl:block" : "col-span-full xl:col-span-1")}>
          <Preview path={previewPath} reloadSignal={reloadSignal} saved={status === "saved"} />
        </section>
      </div>
    </div>
  )
}

/* ---------------- panels ---------------- */

function useUpdater(file: Section["file"], base: Path) {
  const change = useEditor((s) => s.change)
  return (path: Path, v: Json) => {
    const all = useEditor.getState().content
    if (!all) return
    const full = [...base, ...path]
    change(file, setIn(all[file], full, v), full.join("."))
  }
}

function PanelTitle({ title, intro, back }: { title: string; intro?: string; back?: { label: string; onClick: () => void } }) {
  return (
    <div className="mb-6">
      {back && (
        <button type="button" onClick={back.onClick} className="-ml-2 mb-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-cocoa/70 hover:bg-sand hover:text-cocoa">
          <ArrowLeft className="size-4" /> {back.label}
        </button>
      )}
      <h1 className="font-display text-[1.9rem] leading-tight">{title}</h1>
      {intro && <p className="mt-1 max-w-prose text-[0.94rem] text-muted-foreground">{intro}</p>}
    </div>
  )
}

function FormPanel({ section }: { section: Extract<Section, { kind: "form" }> }) {
  const content = useEditor((s) => s.content)!
  const update = useUpdater(section.file, section.base)
  return (
    <>
      <PanelTitle title={section.label} intro={section.intro} />
      <Fields fields={section.fields} value={getIn(content[section.file], section.base)} content={content} update={update} />
    </>
  )
}

function ListPanel({ section, items }: { section: ListSection; items: Json[] }) {
  const content = useEditor((s) => s.content)!
  const change = useEditor((s) => s.change)
  const [q, setQ] = useState("")
  const setList = (next: Json[]) => change(section.file, setIn(content[section.file], section.base, next))
  const shown = useMemo(
    () => items.map((it, i) => ({ it, i })).filter(({ it }) => !q || JSON.stringify(it).toLowerCase().includes(q.toLowerCase())),
    [items, q]
  )
  const add = () => {
    const created = section.create(content)
    setList([created, ...items])
    go(`${section.id}/0`)
  }
  return (
    <>
      <PanelTitle title={section.label} intro={section.intro} />
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cocoa/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${items.length} ${section.noun}s`}
            aria-label={`Search ${section.noun}s`}
            className="h-10 w-full rounded-xl border border-cocoa/15 bg-white pr-3 pl-9 text-sm outline-none focus:border-lagoon focus:ring-4 focus:ring-lagoon/15"
          />
        </div>
        <button type="button" onClick={add} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-lagoon px-4 text-sm font-medium text-white hover:bg-lagoon-deep">
          <Plus className="size-4" /> Add {section.noun}
        </button>
      </div>
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {shown.map(({ it, i }) => {
            const img = section.image?.(it)
            return (
              <motion.li
                key={it.id ?? it.slug ?? i}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-3 rounded-2xl border border-cocoa/10 bg-white p-2 pr-1.5 transition-shadow hover:shadow-soft"
              >
                <button type="button" onClick={() => go(`${section.id}/${i}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                    {img ? <Image src={img} alt="" fill sizes="56px" className="object-cover" /> : <ImageOff className="absolute inset-0 m-auto size-5 text-cocoa/30" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{section.title(it) || "Untitled"}</span>
                    {section.subtitle && <span className="block truncate text-xs text-muted-foreground">{section.subtitle(it, content)}</span>}
                  </span>
                </button>
                <div className="flex opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <RowButton label="Move up" disabled={i === 0 || !!q} onClick={() => setList(moveItem(items, i, i - 1))}>
                    <ArrowUp className="size-4" />
                  </RowButton>
                  <RowButton label="Move down" disabled={i === items.length - 1 || !!q} onClick={() => setList(moveItem(items, i, i + 1))}>
                    <ArrowDown className="size-4" />
                  </RowButton>
                  {section.duplicate && (
                    <RowButton label="Duplicate" onClick={() => setList([...items.slice(0, i + 1), section.duplicate!(it, content), ...items.slice(i + 1)])}>
                      <Copy className="size-4" />
                    </RowButton>
                  )}
                  <RowButton
                    label="Delete"
                    danger
                    onClick={() => {
                      setList(items.filter((_, k) => k !== i))
                      toast(`Deleted ${section.title(it)}`, { action: { label: "Undo", onClick: () => useEditor.getState().undo() } })
                    }}
                  >
                    <Trash2 className="size-4" />
                  </RowButton>
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
      {!shown.length && <p className="rounded-2xl border border-dashed border-cocoa/20 p-6 text-center text-sm text-muted-foreground">Nothing matches &ldquo;{q}&rdquo;.</p>}
    </>
  )
}

function ItemPanel({ section, index, item }: { section: ListSection; index: number; item: Json }) {
  const content = useEditor((s) => s.content)!
  const change = useEditor((s) => s.change)
  const update = useUpdater(section.file, [...section.base, index])
  const items = getIn(content[section.file], section.base) as Json[]
  const setList = (next: Json[]) => change(section.file, setIn(content[section.file], section.base, next))
  return (
    <>
      <PanelTitle title={section.title(item) || "Untitled"} back={{ label: `All ${section.label.toLowerCase()}`, onClick: () => go(section.id) }} />
      <div className="-mt-3 mb-6 flex flex-wrap gap-2">
        {section.duplicate && (
          <button
            type="button"
            onClick={() => {
              setList([...items.slice(0, index + 1), section.duplicate!(item, content), ...items.slice(index + 1)])
              go(`${section.id}/${index + 1}`)
              toast.success("Copy made. You're now editing the copy.")
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-cocoa/15 bg-white px-3 text-sm hover:bg-sand"
          >
            <Copy className="size-3.5" /> Duplicate
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setList(items.filter((_, k) => k !== index))
            go(section.id)
            toast(`Deleted ${section.title(item)}`, { action: { label: "Undo", onClick: () => useEditor.getState().undo() } })
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-cocoa/15 bg-white px-3 text-sm text-clay hover:bg-clay/10"
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      </div>
      <Fields fields={section.fields} value={item} content={content} update={update} />
    </>
  )
}

/* ---------------- small pieces ---------------- */

function moveItem<T>(arr: T[], from: number, to: number) {
  const next = [...arr]
  const [x] = next.splice(from, 1)
  next.splice(to, 0, x)
  return next
}

function RowButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className={cn("grid size-8 place-items-center rounded-lg text-cocoa/60 transition-colors hover:bg-sand hover:text-cocoa disabled:opacity-25", danger && "hover:bg-clay/10 hover:text-clay")}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ToolButton({ label, keys, onClick, disabled, children }: { label: string; keys?: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className="grid size-9 place-items-center rounded-xl text-cocoa transition-colors hover:bg-sand disabled:opacity-30">
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {keys && <span className="ml-2 opacity-60">{keys}</span>}
      </TooltipContent>
    </Tooltip>
  )
}

function SaveStatus({ status, error, onRetry }: { status: string; error: string; onRetry: () => void }) {
  const map = {
    loading: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Opening…", cls: "text-cocoa/60" },
    saved: { icon: <Check className="size-3.5" />, text: "All changes saved", cls: "text-lagoon" },
    pending: { icon: <span className="size-1.5 rounded-full bg-marigold" />, text: "Saving…", cls: "text-cocoa/60" },
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Saving…", cls: "text-cocoa/60" },
    error: { icon: <AlertCircle className="size-3.5" />, text: "Not saved", cls: "text-clay" },
  } as const
  const s = map[status as keyof typeof map] ?? map.saved
  return (
    <div className="ml-1 flex min-w-0 items-center gap-2 sm:ml-3">
      <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs whitespace-nowrap ring-1 ring-cocoa/10", s.cls)} role="status" title={error || undefined}>
        {s.icon}
        <span className="hidden sm:inline">{s.text}</span>
      </span>
      {status === "error" && (
        <button type="button" onClick={onRetry} className="text-xs text-clay underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  )
}

function PanelMessage({ status, error, onRetry }: { status: string; error: string; onRetry: () => void }) {
  if (status === "error")
    return (
      <div className="m-6 rounded-2xl border border-clay/30 bg-clay/5 p-5 text-sm">
        <p className="font-medium text-clay">{error}</p>
        <button type="button" onClick={onRetry} className="mt-3 rounded-full bg-cocoa px-4 py-2 text-white">
          Try again
        </button>
      </div>
    )
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-sand/70" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  )
}

function MobileSectionPicker({ current }: { current: string }) {
  return (
    <div className="sticky top-0 z-10 border-b border-cocoa/10 bg-porcelain/90 px-4 py-2 backdrop-blur md:hidden">
      <label className="sr-only" htmlFor="section-picker">
        Section
      </label>
      <select id="section-picker" value={current} onChange={(e) => go(e.target.value)} className="h-10 w-full rounded-xl border border-cocoa/15 bg-white px-3 text-sm">
        {SECTIONS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}

