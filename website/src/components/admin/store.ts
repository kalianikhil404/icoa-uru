"use client"

import { create } from "zustand"

/* State for the website editor: the content files, undo / redo and autosave. */

export type ContentName =
  | "products"
  | "collections"
  | "faqs"
  | "testimonials"
  | "settings"
  | "home"
  | "about"
  | "pages"
  | "theme"
  | "beadColors"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any
export type Content = Record<ContentName, Json>
type Snapshot = { name: ContentName; data: Json }
export type SaveStatus = "loading" | "saved" | "pending" | "saving" | "error"

type EditorState = {
  content: Content | null
  status: SaveStatus
  error: string
  past: Snapshot[]
  future: Snapshot[]
  /** bumps after every successful save (the preview listens to it) */
  savedAt: number
  load: () => Promise<void>
  change: (name: ContentName, next: Json, group?: string) => void
  undo: () => void
  redo: () => void
  saveNow: () => Promise<void>
  replaceAll: (content: Content) => void
}

const SAVE_DELAY = 650
const GROUP_MS = 1200
const MAX_STEPS = 200

let timer: ReturnType<typeof setTimeout> | undefined
let lastGroup = ""
let lastGroupAt = 0
const dirty = new Set<ContentName>()

export const useEditor = create<EditorState>((set, get) => {
  const schedule = () => {
    set({ status: "pending" })
    clearTimeout(timer)
    timer = setTimeout(() => void get().saveNow(), SAVE_DELAY)
  }

  return {
    content: null,
    status: "loading",
    error: "",
    past: [],
    future: [],
    savedAt: 0,

    async load() {
      set({ status: "loading", error: "" })
      try {
        const res = await fetch("/api/admin/content", { cache: "no-store" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Couldn't open the content files.")
        set({ content: data, status: "saved", past: [], future: [] })
      } catch (e) {
        set({ status: "error", error: (e as Error).message })
      }
    },

    change(name, next, group = "") {
      const { content, past } = get()
      if (!content || content[name] === next) return
      const now = Date.now()
      const key = `${name}:${group}`
      const sameGroup = group && key === lastGroup && now - lastGroupAt < GROUP_MS
      lastGroup = key
      lastGroupAt = now
      set({
        content: { ...content, [name]: next },
        past: sameGroup ? past : [...past.slice(-MAX_STEPS + 1), { name, data: content[name] }],
        future: [],
      })
      dirty.add(name)
      schedule()
    },

    undo() {
      const { content, past, future } = get()
      const step = past.at(-1)
      if (!content || !step) return
      lastGroup = ""
      set({
        content: { ...content, [step.name]: step.data },
        past: past.slice(0, -1),
        future: [{ name: step.name, data: content[step.name] }, ...future],
      })
      dirty.add(step.name)
      schedule()
    },

    redo() {
      const { content, past, future } = get()
      const step = future[0]
      if (!content || !step) return
      lastGroup = ""
      set({
        content: { ...content, [step.name]: step.data },
        past: [...past, { name: step.name, data: content[step.name] }],
        future: future.slice(1),
      })
      dirty.add(step.name)
      schedule()
    },

    async saveNow() {
      clearTimeout(timer)
      const content = get().content
      if (!content || !dirty.size) return
      const names = [...dirty]
      dirty.clear()
      set({ status: "saving" })
      try {
        for (const name of names) {
          const res = await fetch("/api/admin/content", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, data: get().content![name] }),
          })
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't save.")
        }
        set({ status: dirty.size ? "pending" : "saved", savedAt: Date.now(), error: "" })
      } catch (e) {
        names.forEach((n) => dirty.add(n))
        set({ status: "error", error: (e as Error).message })
      }
    },

    replaceAll(content) {
      dirty.clear()
      clearTimeout(timer)
      set({ content, past: [], future: [], status: "saved", savedAt: Date.now() })
    },
  }
})

/* ---------- small helpers for reading / writing nested values ---------- */

export type Path = (string | number)[]

export function getIn(obj: Json, path: Path): Json {
  return path.reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

export function setIn(obj: Json, path: Path, value: Json): Json {
  if (!path.length) return value
  const [k, ...rest] = path
  const base = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) }
  const next = setIn(base[k as keyof typeof base], rest, value)
  if (next === undefined && !Array.isArray(base)) delete (base as Record<string, unknown>)[k as string]
  else (base as Record<string | number, unknown>)[k] = next
  return base
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)

export function uniqueSlug(base: string, taken: string[]) {
  const root = slugify(base) || "item"
  let s = root
  let i = 2
  while (taken.includes(s)) s = `${root}-${i++}`
  return s
}
