"use client"

/* Anonymous visit tracking for the shop's own control center (no ads, nothing sold).
   A visitor can say "No thanks" in the privacy notice, and browsers that send
   "Do Not Track" or "Global Privacy Control" are never tracked. */

const V = "iu-vid"
const S = "iu-sid"
const C = "iu-consent"
const ORDERS = "iu-orders"

const rid = () => (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`).replace(/[^\w-]/g, "")

function read(store: Storage, key: string) {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}
function write(store: Storage, key: string, value: string) {
  try {
    store.setItem(key, value)
  } catch {
    /* private mode */
  }
}

export type Consent = "yes" | "no" | null
export const getConsent = (): Consent => (read(localStorage, C) as Consent) ?? null
export function setConsent(v: "yes" | "no") {
  write(localStorage, C, v)
  if (v === "no") {
    try {
      localStorage.removeItem(V)
    } catch {}
  }
  window.dispatchEvent(new Event("iu-consent"))
}

const browserSaysNo = () => {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; doNotTrack?: string }
  return n.globalPrivacyControl === true || n.doNotTrack === "1"
}

export function visitorId() {
  if (typeof window === "undefined" || getConsent() === "no" || browserSaysNo()) return undefined
  let id = read(localStorage, V)
  if (!id) {
    id = rid()
    write(localStorage, V, id)
  }
  return id
}

function sessionId() {
  let id = read(sessionStorage, S)
  if (!id) {
    id = rid().slice(0, 16)
    write(sessionStorage, S, id)
  }
  return id
}

export function track(type: "pageview" | "product_view" | "add_to_bag" | "checkout_start", data: { path?: string; slug?: string; ref?: string; value?: number; title?: string } = {}) {
  const v = visitorId()
  if (!v) return
  const body = JSON.stringify({ v, s: sessionId(), type, path: data.path ?? location.pathname, ...data })
  try {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {})
  } catch {
    /* never get in the way of shopping */
  }
}

/* ---------- orders this browser has placed (so "My orders" works without an account) ---------- */

export type OrderRef = { n: string; k: string }
export function rememberOrder(n: string, k: string) {
  if (!n || !k) return
  const list = rememberedOrders().filter((o) => o.n !== n)
  write(localStorage, ORDERS, JSON.stringify([{ n, k }, ...list].slice(0, 30)))
}
export function rememberedOrders(): OrderRef[] {
  try {
    const v = JSON.parse(read(localStorage, ORDERS) ?? "[]")
    return Array.isArray(v) ? v.filter((o) => o && typeof o.n === "string" && typeof o.k === "string") : []
  } catch {
    return []
  }
}
export function forgetOrder(n: string) {
  write(localStorage, ORDERS, JSON.stringify(rememberedOrders().filter((o) => o.n !== n)))
}
