"use client"

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/* Small shared pieces for the control center. */

/* ---------- loading data from the control-center APIs ---------- */

export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!url) return
    let alive = true
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null)
        if (!alive) return
        if (!r.ok) setError(d?.error ?? "Couldn't load this.")
        else {
          setData(d)
          setError("")
        }
      })
      .catch(() => alive && setError("Couldn't reach the website. Is the black window still open?"))
    return () => {
      alive = false
    }
  }, [url, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, reload, setData }
}

export async function api<T = unknown>(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: T & { error?: string } }> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) }).catch(() => null)
  const data = (await res?.json().catch(() => ({}))) ?? {}
  return { ok: !!res?.ok, data }
}

/* ---------- address-bar navigation (#orders/IU-123) that survives reloads ---------- */

let current: string | null = null
const listeners = new Set<() => void>()
const read = () => decodeURIComponent(window.location.hash.slice(1))
function subscribe(cb: () => void) {
  listeners.add(cb)
  const onPop = () => {
    current = read()
    listeners.forEach((l) => l())
  }
  window.addEventListener("popstate", onPop)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("popstate", onPop)
  }
}
export function go(hash: string) {
  if (hash === current) return
  current = hash
  window.history.pushState(null, "", `#${hash}`)
  listeners.forEach((l) => l())
}
export function useRoute() {
  const hash = useSyncExternalStore(
    subscribe,
    () => (current ??= read()),
    () => ""
  )
  const [section = "overview", ...rest] = hash.split("/")
  return { section: section || "overview", sub: rest.join("/") }
}

/* ---------- formatting ---------- */

export const money = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n || 0)
export const date = (v: string | number, time = false) =>
  new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric", year: new Date(v).getFullYear() === new Date().getFullYear() ? undefined : "numeric", ...(time ? { hour: "numeric", minute: "2-digit" } : {}) })
export function ago(v: string | number) {
  const s = Math.max(0, (Date.now() - new Date(v).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`
  return date(v)
}

/* ---------- pieces ---------- */

export function Panel({ title, intro, action, children, className }: { title?: string; intro?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[24px] border border-cocoa/10 bg-white p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-xl text-cocoa">{title}</h2>}
            {intro && <p className="mt-0.5 text-sm text-muted-foreground">{intro}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "lagoon" | "clay" | "marigold" }) {
  return (
    <div className="rounded-[22px] border border-cocoa/10 bg-white p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display text-[2rem] leading-none tabular-nums", tone === "clay" ? "text-clay" : tone === "lagoon" ? "text-lagoon" : "text-cocoa")}>{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-dashed border-cocoa/20 p-8 text-center">
      {icon && <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-sand text-lagoon">{icon}</div>}
      <p className="font-medium text-cocoa">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}

export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-2xl bg-sand/60" style={{ animationDelay: `${i * 70}ms` }} />
      ))}
    </div>
  )
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-clay/30 bg-clay/5 p-4 text-sm text-clay">
      {message}{" "}
      {onRetry && (
        <button type="button" onClick={onRetry} className="underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  )
}

export const STATUS_STYLE: Record<string, { label: string; cls: string; dot: string }> = {
  new: { label: "New", cls: "bg-marigold/20 text-[#7a5410]", dot: "bg-marigold" },
  paid: { label: "Paid", cls: "bg-lagoon/12 text-lagoon-deep", dot: "bg-lagoon" },
  weaving: { label: "Weaving", cls: "bg-sand text-cocoa", dot: "bg-cocoa/60" },
  shipped: { label: "Shipped", cls: "bg-cocoa text-white", dot: "bg-cocoa" },
  delivered: { label: "Delivered", cls: "bg-[#e6efe3] text-[#2f5d2a]", dot: "bg-[#4c8a44]" },
  cancelled: { label: "Cancelled", cls: "bg-clay/10 text-clay", dot: "bg-clay" },
}

export function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.new
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", s.cls)}>{s.label}</span>
}

export const field =
  "w-full rounded-xl border border-cocoa/15 bg-white px-3 py-2 text-[0.94rem] text-cocoa outline-none transition-[border-color,box-shadow] placeholder:text-cocoa/35 focus:border-lagoon focus:ring-4 focus:ring-lagoon/15"

export function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-10 w-full rounded-xl border border-cocoa/15 bg-white px-3.5 text-sm outline-none focus:border-lagoon focus:ring-4 focus:ring-lagoon/15 sm:w-72"
    />
  )
}

export function ExportButton({ type, label = "Download spreadsheet" }: { type: string; label?: string }) {
  return (
    <a
      href={`/api/admin/export?type=${type}`}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cocoa/15 bg-white px-3 text-sm text-cocoa hover:bg-sand"
      download
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 15V3" />
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5" />
      </svg>
      {label}
    </a>
  )
}

/** Simple bar chart for daily numbers. */
export function DailyBars({ data, valueKey, secondKey, height = 120 }: { data: Record<string, number | string>[]; valueKey: string; secondKey?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0))
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }} role="img" aria-label={`Daily ${valueKey}`}>
        {data.map((d) => {
          const v = Number(d[valueKey]) || 0
          const s = secondKey ? Number(d[secondKey]) || 0 : 0
          return (
            <div key={String(d.date)} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="w-full rounded-t-[4px] bg-lagoon/80 transition-colors group-hover:bg-lagoon" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 3 : 0 }} />
              {s > 0 && <span className="absolute -top-1.5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-marigold ring-2 ring-white" />}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-espresso px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
                {date(String(d.date))}: {v} {valueKey}
                {secondKey ? `, ${s} ${secondKey}` : ""}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.7rem] text-muted-foreground">
        <span>{data[0] ? date(String(data[0].date)) : ""}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

/** A ranked list with bars, e.g. top pages. */
export function RankList({ rows, empty = "Nothing yet." }: { rows: { label: ReactNode; value: number; sub?: ReactNode }[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (!rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>
  return (
    <ul className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={i} className="relative overflow-hidden rounded-lg px-2.5 py-1.5 text-sm">
          <span className="absolute inset-y-0 left-0 rounded-lg bg-sand/70" style={{ width: `${(r.value / max) * 100}%` }} />
          <span className="relative flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-cocoa">{r.label}</span>
            <span className="shrink-0 text-cocoa/70 tabular-nums">
              {r.sub}
              {r.value.toLocaleString()}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
