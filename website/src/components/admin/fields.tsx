"use client"

import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "motion/react"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, Eye, EyeOff, ImagePlus, Loader2, Plus, Star, Trash2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getIn, type Content, type Json, type Path } from "./store"

/* ------------------------------------------------------------------
   The building blocks of the editor's forms. Each section in
   sections.ts is a list of these fields.
------------------------------------------------------------------- */

export type Opt = { value: string; label: string }
type Options = Opt[] | ((c: Content) => Opt[])
type Base = { label: string; hint?: string; wide?: boolean }

export type Field =
  | { type: "heading"; label: string; hint?: string }
  | (Base & { type: "text"; path: Path; placeholder?: string; long?: boolean; rows?: number; maxLength?: number })
  | (Base & { type: "number"; path: Path; step?: number; min?: number; max?: number; prefix?: string; suffix?: string; optional?: boolean })
  | (Base & { type: "toggle"; path: Path })
  | (Base & { type: "select"; path: Path; options: Options; optional?: boolean })
  | (Base & { type: "chips"; path: Path; options: Options })
  | (Base & { type: "color"; path: Path })
  | (Base & { type: "image"; path: Path; folder: string | ((item: Json) => string); video?: boolean })
  | (Base & { type: "images"; path: Path; folder: string | ((item: Json) => string) })
  | (Base & { type: "strings"; path: Path; long?: boolean; addLabel?: string; placeholder?: string })
  | (Base & { type: "tags"; path: Path; placeholder?: string })
  | (Base & {
      type: "repeater"
      path: Path
      fields: Field[]
      itemTitle: (item: Json, i: number) => string
      newItem: (c: Content) => Json
      addLabel?: string
    })
  | (Base & { type: "sections"; path: Path; names: Record<string, string> })
  | { type: "row"; fields: Field[] }
  | { type: "custom"; render: (ctx: FieldCtx) => ReactNode }

export type FieldCtx = {
  /** the object these fields edit (e.g. one product) */
  value: Json
  content: Content
  update: (path: Path, v: Json) => void
}

const Ctx = createContext<FieldCtx | null>(null)
const useCtx = () => useContext(Ctx)!

export function Fields({ fields, ...ctx }: FieldCtx & { fields: Field[] }) {
  return (
    <Ctx.Provider value={ctx}>
      <div className="space-y-5">
        {fields.map((f, i) => (
          <FieldView key={i} field={f} />
        ))}
      </div>
    </Ctx.Provider>
  )
}

function FieldView({ field }: { field: Field }) {
  const ctx = useCtx()
  switch (field.type) {
    case "heading":
      return (
        <div className="pt-4 first:pt-0">
          <h3 className="font-display text-xl text-cocoa">{field.label}</h3>
          {field.hint && <p className="mt-0.5 text-sm text-muted-foreground">{field.hint}</p>}
        </div>
      )
    case "row":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {field.fields.map((f, i) => (
            <FieldView key={i} field={f} />
          ))}
        </div>
      )
    case "custom":
      return <>{field.render(ctx)}</>
    default: {
      const value = getIn(ctx.value, field.path)
      const set = (v: Json) => ctx.update(field.path, v)
      return <Control field={field} value={value} set={set} />
    }
  }
}

/* ---------- shared bits ---------- */

export function Label({ children, hint, htmlFor, aside }: { children: ReactNode; hint?: string; htmlFor?: string; aside?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-end justify-between gap-3">
      <div>
        <label htmlFor={htmlFor} className="text-sm font-medium text-cocoa">
          {children}
        </label>
        {hint && <p className="text-xs leading-snug text-muted-foreground">{hint}</p>}
      </div>
      {aside}
    </div>
  )
}

export const inputCls =
  "w-full rounded-xl border border-cocoa/15 bg-white px-3 py-2 text-[0.94rem] text-cocoa shadow-[0_1px_0_rgba(0,0,0,0.02)] outline-none transition-[border-color,box-shadow] placeholder:text-cocoa/35 focus:border-lagoon focus:ring-4 focus:ring-lagoon/15"

const iconBtn =
  "grid size-8 shrink-0 place-items-center rounded-lg text-cocoa/60 transition-colors hover:bg-sand hover:text-cocoa disabled:pointer-events-none disabled:opacity-30"

const optionsOf = (o: Options, c: Content) => (typeof o === "function" ? o(c) : o)

function move<T>(arr: T[], from: number, to: number) {
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  const [x] = next.splice(from, 1)
  next.splice(to, 0, x)
  return next
}

export async function uploadFile(file: File, folder: string): Promise<string | null> {
  const body = new FormData()
  body.append("file", file)
  body.append("folder", folder)
  const res = await fetch("/api/admin/upload", { method: "POST", body })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    toast.error(data.error || "That file couldn't be added.")
    return null
  }
  return data.url as string
}

/* ---------- the controls ---------- */

function Control({ field, value, set }: { field: Exclude<Field, { type: "heading" | "row" | "custom" }>; value: Json; set: (v: Json) => void }) {
  const id = useId()
  const ctx = useCtx()
  switch (field.type) {
    case "text":
      return (
        <div>
          <Label htmlFor={id} hint={field.hint} aside={field.maxLength ? <Count n={(value ?? "").length} max={field.maxLength} /> : null}>
            {field.label}
          </Label>
          {field.long ? (
            <textarea
              id={id}
              value={value ?? ""}
              rows={field.rows ?? 4}
              maxLength={field.maxLength}
              placeholder={field.placeholder}
              onChange={(e) => set(e.target.value)}
              className={cn(inputCls, "resize-y leading-relaxed")}
            />
          ) : (
            <input id={id} value={value ?? ""} maxLength={field.maxLength} placeholder={field.placeholder} onChange={(e) => set(e.target.value)} className={inputCls} />
          )}
        </div>
      )
    case "number":
      return (
        <div>
          <Label htmlFor={id} hint={field.hint}>
            {field.label}
          </Label>
          <div className="relative">
            {field.prefix && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-cocoa/50">{field.prefix}</span>}
            <input
              id={id}
              type="number"
              inputMode="decimal"
              step={field.step ?? 1}
              min={field.min}
              max={field.max}
              value={value ?? ""}
              placeholder={field.optional ? "None" : "0"}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === "") return set(field.optional ? undefined : 0)
                const n = Number(raw)
                if (Number.isFinite(n)) set(n)
              }}
              className={cn(inputCls, "tabular-nums", field.prefix && "pl-7", field.suffix && "pr-14")}
            />
            {field.suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-cocoa/50">{field.suffix}</span>}
          </div>
        </div>
      )
    case "toggle":
      return (
        <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-cocoa/10 bg-white px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-cocoa">{field.label}</span>
            {field.hint && <span className="block text-xs text-muted-foreground">{field.hint}</span>}
          </span>
          <Switch id={id} checked={!!value} onCheckedChange={(v) => set(v)} />
        </label>
      )
    case "select": {
      const opts = optionsOf(field.options, ctx.content)
      return (
        <div>
          <Label hint={field.hint}>{field.label}</Label>
          <Select value={value || (field.optional ? "__none" : undefined)} onValueChange={(v) => set(v === "__none" ? undefined : v)}>
            <SelectTrigger className="h-10 w-full rounded-xl border-cocoa/15 bg-white" aria-label={field.label}>
              <SelectValue placeholder="Choose…" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {field.optional && (
                <SelectItem value="__none" className="rounded-lg text-muted-foreground">
                  None
                </SelectItem>
              )}
              {opts.map((o) => (
                <SelectItem key={o.value} value={o.value} className="rounded-lg">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }
    case "chips": {
      const opts = optionsOf(field.options, ctx.content)
      const list: string[] = Array.isArray(value) ? value : []
      return (
        <div>
          <Label hint={field.hint}>{field.label}</Label>
          <div className="flex flex-wrap gap-1.5">
            {opts.map((o) => {
              const on = list.includes(o.value)
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set(on ? list.filter((x) => x !== o.value) : [...list, o.value])}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    on ? "border-cocoa bg-cocoa text-white" : "border-cocoa/15 bg-white text-cocoa hover:border-cocoa/40"
                  )}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>
      )
    }
    case "color":
      return <ColorField id={id} label={field.label} hint={field.hint} value={value} set={set} />
    case "image": {
      const folder = typeof field.folder === "function" ? field.folder(ctx.value) : field.folder
      return <ImageField label={field.label} hint={field.hint} value={value} set={set} folder={folder} video={field.video} />
    }
    case "images": {
      const folder = typeof field.folder === "function" ? field.folder(ctx.value) : field.folder
      return <ImagesField label={field.label} hint={field.hint} value={Array.isArray(value) ? value : []} set={set} folder={folder} />
    }
    case "strings":
      return <StringsField field={field} value={Array.isArray(value) ? value : []} set={set} />
    case "tags":
      return <TagsField label={field.label} hint={field.hint} placeholder={field.placeholder} value={Array.isArray(value) ? value : []} set={set} />
    case "repeater":
      return <Repeater field={field} value={Array.isArray(value) ? value : []} set={set} />
    case "sections":
      return <SectionOrder label={field.label} hint={field.hint} names={field.names} value={Array.isArray(value) ? value : []} set={set} />
  }
}

function Count({ n, max }: { n: number; max: number }) {
  return <span className={cn("text-xs tabular-nums", n > max * 0.9 ? "text-clay" : "text-muted-foreground")}>{n}/{max}</span>
}

export function ColorField({ id, label, hint, value, set }: { id?: string; label: string; hint?: string; value: string; set: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const hex = /^#[0-9a-f]{6}$/i.test(value ?? "") ? value : "#000000"
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-black/10" style={{ background: hex }}>
          <input type="color" value={hex} onChange={(e) => set(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label={`${label}: pick a colour`} />
        </label>
        <input
          id={id}
          value={draft ?? value ?? ""}
          onChange={(e) => {
            const v = e.target.value.trim()
            setDraft(v)
            const full = v.startsWith("#") ? v : `#${v}`
            if (/^#[0-9a-f]{6}$/i.test(full)) set(full.toLowerCase())
          }}
          onBlur={() => setDraft(null)}
          spellCheck={false}
          className={cn(inputCls, "font-mono text-sm uppercase")}
        />
      </div>
    </div>
  )
}

function useDrop(onFiles: (files: File[]) => void) {
  const [over, setOver] = useState(false)
  return {
    over,
    props: {
      onDragOver: (e: React.DragEvent) => {
        if (![...e.dataTransfer.types].includes("Files")) return
        e.preventDefault()
        setOver(true)
      },
      onDragLeave: () => setOver(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        setOver(false)
        const files = [...e.dataTransfer.files]
        if (files.length) onFiles(files)
      },
    },
  }
}

const isVideo = (src: string) => /\.(mp4|webm|mov)$/i.test(src)

function Thumb({ src, className }: { src: string; className?: string }) {
  if (!src) return null
  if (isVideo(src)) return <video src={src} muted playsInline className={cn("size-full object-cover", className)} />
  return <Image src={src} alt="" fill sizes="160px" className={cn("object-cover", className)} unoptimized={src.startsWith("blob:")} />
}

function ImageField({ label, hint, value, set, folder, video }: { label: string; hint?: string; value: string; set: (v: string | undefined) => void; folder: string; video?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const add = async (files: File[]) => {
    if (!files[0]) return
    setBusy(true)
    const url = await uploadFile(files[0], folder)
    setBusy(false)
    if (url) set(url)
  }
  const drop = useDrop(add)
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div {...drop.props} className={cn("flex items-center gap-4 rounded-2xl border border-dashed border-cocoa/20 bg-white p-3 transition-colors", drop.over && "border-lagoon bg-lagoon/5")}>
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-sand">
          {value ? <Thumb src={value} /> : <ImagePlus className="absolute inset-0 m-auto size-6 text-cocoa/30" />}
          {busy && <Loader2 className="absolute inset-0 m-auto size-6 animate-spin text-white drop-shadow" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => input.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-full bg-cocoa px-4 text-sm text-white hover:bg-espresso">
              <Upload className="size-4" /> {value ? "Replace" : video ? "Add video" : "Add photo"}
            </button>
            {value && (
              <button type="button" onClick={() => set(undefined)} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-cocoa/70 hover:bg-sand">
                <X className="size-4" /> Remove
              </button>
            )}
          </div>
          <p className="mt-1.5 truncate text-xs text-muted-foreground">{value || "or drag a file here"}</p>
        </div>
        <input
          ref={input}
          type="file"
          hidden
          accept={video ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/avif,image/gif"}
          onChange={(e) => {
            void add([...(e.target.files ?? [])])
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}

function ImagesField({ label, hint, value, set, folder }: { label: string; hint?: string; value: string[]; set: (v: string[]) => void; folder: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(0)
  const add = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/") || /\.hei[cf]$/i.test(f.name))
    setBusy(imgs.length)
    const urls: string[] = []
    for (const f of imgs) {
      const url = await uploadFile(f, folder)
      if (url) urls.push(url)
      setBusy((b) => b - 1)
    }
    if (urls.length) set([...value, ...urls])
  }
  const drop = useDrop(add)
  return (
    <div>
      <Label hint={hint ?? "The first photo is the main one. Drag photos in, or use the arrows to change the order."}>{label}</Label>
      <div {...drop.props} className={cn("grid grid-cols-3 gap-2 rounded-2xl border border-dashed border-cocoa/20 bg-white p-2 transition-colors", drop.over && "border-lagoon bg-lagoon/5")}>
        <AnimatePresence initial={false}>
          {value.map((src, i) => (
            <motion.div key={src} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="group relative aspect-square overflow-hidden rounded-xl bg-sand">
              <Thumb src={src} />
              {i === 0 && <span className="absolute top-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[0.7rem] font-medium text-cocoa">Main</span>}
              <div className="absolute inset-x-1 bottom-1 flex justify-between rounded-lg bg-white/90 p-0.5 opacity-0 backdrop-blur transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <button type="button" aria-label="Move left" className={iconBtn} disabled={i === 0} onClick={() => set(move(value, i, i - 1))}>
                  <ArrowLeft className="size-3.5" />
                </button>
                <button type="button" aria-label="Make main photo" className={iconBtn} disabled={i === 0} onClick={() => set(move(value, i, 0))}>
                  <Star className="size-3.5" />
                </button>
                <button type="button" aria-label="Remove photo" className={iconBtn} onClick={() => set(value.filter((_, k) => k !== i))}>
                  <Trash2 className="size-3.5" />
                </button>
                <button type="button" aria-label="Move right" className={iconBtn} disabled={i === value.length - 1} onClick={() => set(move(value, i, i + 1))}>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {Array.from({ length: busy }, (_, i) => (
          <div key={`b${i}`} className="grid aspect-square place-items-center rounded-xl bg-sand">
            <Loader2 className="size-5 animate-spin text-cocoa/50" />
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-cocoa/10 text-sm text-cocoa/70 transition-colors hover:bg-sand"
        >
          <ImagePlus className="size-5" /> Add photos
        </button>
      </div>
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(e) => {
          void add([...(e.target.files ?? [])])
          e.target.value = ""
        }}
      />
    </div>
  )
}

function StringsField({ field, value, set }: { field: Extract<Field, { type: "strings" }>; value: string[]; set: (v: string[]) => void }) {
  return (
    <div>
      <Label hint={field.hint}>{field.label}</Label>
      <div className="space-y-2">
        {value.map((s, i) => (
          <div key={i} className="flex items-start gap-1">
            {field.long ? (
              <textarea value={s} rows={3} onChange={(e) => set(value.map((x, k) => (k === i ? e.target.value : x)))} placeholder={field.placeholder} className={cn(inputCls, "resize-y leading-relaxed")} />
            ) : (
              <input value={s} onChange={(e) => set(value.map((x, k) => (k === i ? e.target.value : x)))} placeholder={field.placeholder} className={inputCls} />
            )}
            <div className={cn("flex shrink-0", field.long ? "flex-col" : "")}>
              <button type="button" aria-label="Move up" className={iconBtn} disabled={i === 0} onClick={() => set(move(value, i, i - 1))}>
                <ArrowUp className="size-4" />
              </button>
              <button type="button" aria-label="Move down" className={iconBtn} disabled={i === value.length - 1} onClick={() => set(move(value, i, i + 1))}>
                <ArrowDown className="size-4" />
              </button>
              <button type="button" aria-label="Remove" className={iconBtn} onClick={() => set(value.filter((_, k) => k !== i))}>
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set([...value, ""])} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-cocoa/25 px-4 text-sm text-cocoa hover:bg-white">
          <Plus className="size-4" /> {field.addLabel ?? "Add"}
        </button>
      </div>
    </div>
  )
}

function TagsField({ label, hint, placeholder, value, set }: { label: string; hint?: string; placeholder?: string; value: string[]; set: (v: string[]) => void }) {
  const [draft, setDraft] = useState("")
  const add = () => {
    const t = draft.trim()
    if (t && !value.includes(t)) set([...value, t])
    setDraft("")
  }
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-cocoa/15 bg-white p-2">
        {value.map((t, i) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-sand py-1 pr-1 pl-3 text-sm text-cocoa">
            {t}
            <button type="button" aria-label={`Move ${t} left`} disabled={i === 0} onClick={() => set(move(value, i, i - 1))} className="grid size-5 place-items-center rounded-full hover:bg-white disabled:hidden">
              <ArrowLeft className="size-3" />
            </button>
            <button type="button" aria-label={`Remove ${t}`} onClick={() => set(value.filter((x) => x !== t))} className="grid size-5 place-items-center rounded-full hover:bg-white">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              add()
            }
          }}
          onBlur={add}
          placeholder={placeholder ?? "Type and press Enter"}
          className="h-8 min-w-32 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-cocoa/35"
        />
      </div>
    </div>
  )
}

function Repeater({ field, value, set }: { field: Extract<Field, { type: "repeater" }>; value: Json[]; set: (v: Json[]) => void }) {
  const ctx = useCtx()
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div>
      <Label hint={field.hint}>{field.label}</Label>
      <div className="space-y-2">
        {value.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i} className={cn("overflow-hidden rounded-2xl border bg-white transition-shadow", isOpen ? "border-cocoa/25 shadow-soft" : "border-cocoa/10")}>
              <div className="flex items-center gap-1 pr-2">
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left">
                  <ChevronDown className={cn("size-4 shrink-0 text-cocoa/50 transition-transform", isOpen && "rotate-180")} />
                  <span className="truncate text-sm text-cocoa">{field.itemTitle(item, i) || <span className="text-muted-foreground">Untitled</span>}</span>
                </button>
                <button type="button" aria-label="Move up" className={iconBtn} disabled={i === 0} onClick={() => (set(move(value, i, i - 1)), setOpen(isOpen ? i - 1 : open))}>
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" aria-label="Move down" className={iconBtn} disabled={i === value.length - 1} onClick={() => (set(move(value, i, i + 1)), setOpen(isOpen ? i + 1 : open))}>
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  className={cn(iconBtn, "hover:bg-clay/10 hover:text-clay")}
                  onClick={() => {
                    set(value.filter((_, k) => k !== i))
                    setOpen(null)
                    toast("Removed", { description: "Press Undo if that was a mistake." })
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                    <div className="border-t border-cocoa/10 bg-porcelain/50 p-4">
                      <Fields
                        fields={field.fields}
                        value={item}
                        content={ctx.content}
                        update={(path, v) => {
                          const next = [...value]
                          next[i] = setDeep(item, path, v)
                          set(next)
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
        <button
          type="button"
          onClick={() => {
            set([...value, field.newItem(ctx.content)])
            setOpen(value.length)
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-cocoa/25 px-4 text-sm text-cocoa hover:bg-white"
        >
          <Plus className="size-4" /> {field.addLabel ?? "Add"}
        </button>
      </div>
    </div>
  )
}

function setDeep(obj: Json, path: Path, v: Json): Json {
  if (!path.length) return v
  const [k, ...rest] = path
  const base = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) }
  const next = setDeep(base[k], rest, v)
  if (next === undefined && !Array.isArray(base)) delete base[k]
  else base[k] = next
  return base
}

function SectionOrder({ label, hint, names, value, set }: { label: string; hint?: string; names: Record<string, string>; value: { id: string; visible: boolean }[]; set: (v: Json) => void }) {
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <ul className="overflow-hidden rounded-2xl border border-cocoa/10 bg-white">
        <AnimatePresence initial={false}>
          {value.map((s, i) => (
            <motion.li key={s.id} layout transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="flex items-center gap-1 border-b border-cocoa/10 px-2 py-1.5 last:border-b-0">
              <span className="w-6 text-center text-xs text-muted-foreground tabular-nums">{i + 1}</span>
              <span className={cn("flex-1 text-sm", s.visible ? "text-cocoa" : "text-cocoa/40 line-through")}>{names[s.id] ?? s.id}</span>
              <button
                type="button"
                aria-label={s.visible ? `Hide ${names[s.id]}` : `Show ${names[s.id]}`}
                className={iconBtn}
                onClick={() => set(value.map((x, k) => (k === i ? { ...x, visible: !x.visible } : x)))}
              >
                {s.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
              <button type="button" aria-label="Move up" className={iconBtn} disabled={i === 0} onClick={() => set(move(value, i, i - 1))}>
                <ArrowUp className="size-4" />
              </button>
              <button type="button" aria-label="Move down" className={iconBtn} disabled={i === value.length - 1} onClick={() => set(move(value, i, i + 1))}>
                <ArrowDown className="size-4" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
