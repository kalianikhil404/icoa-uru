"use client"

import { useMemo, useSyncExternalStore } from "react"
import { beadSpriteUrl } from "@/lib/bead-sprites"
import { finishFor } from "@/lib/patterns"
import type { Finish } from "@/lib/seed-bead"

const noSubscribe = () => () => {}

/** Side-view seed bead images (data URLs) for a list of colours, made in the browser. */
export function useBeadUrls(hexes: string[], finishOf: (hex: string) => Finish = finishFor) {
  // false while the page is drawn on the server, true in the browser
  const inBrowser = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  )
  const key = [...new Set(hexes.map((h) => h.toLowerCase()))].sort().join(",")
  const urls = useMemo(() => {
    const out: Record<string, string> = {}
    if (!inBrowser || !key) return out
    for (const h of key.split(",")) out[h] = beadSpriteUrl(h, finishOf(h), 0, 40)
    return out
  }, [inBrowser, key, finishOf])
  // look-ups are case-insensitive
  return useMemo(() => new Proxy(urls, { get: (t, p: string) => t[String(p).toLowerCase()] }) as Record<string, string | undefined>, [urls])
}
