"use client"

import { useEffect, useState } from "react"
import { sizes } from "@/content/site"
import { beadSpriteUrl } from "@/lib/bead-sprites"

/** Each width drawn to scale with real-looking seed beads. */
export function SizeBands() {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    setUrl(beadSpriteUrl("#2e7c79", "opaque", 0, 48)) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])
  const cols = 24
  return (
    <div className="space-y-5 rounded-[28px] border bg-white/60 p-6">
      {sizes.map((s) => (
        <div key={s.id} className="flex items-center gap-4">
          <span className="w-20 shrink-0 text-sm text-cocoa">
            {s.label}
            <span className="block text-xs text-muted-foreground">{s.rows} rows</span>
          </span>
          <div
            className="grid flex-1"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 0 }}
            aria-label={`${s.label}: ${s.rows} rows`}
          >
            {Array.from({ length: cols * s.rows }, (_, i) => (
              <span
                key={i}
                className="aspect-[10/7] bg-center bg-no-repeat"
                style={{ backgroundImage: url ? `url(${url})` : undefined, backgroundSize: "112% auto", backgroundColor: url ? undefined : "#2e7c79" }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
