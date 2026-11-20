"use client"

import { Check } from "lucide-react"
import { HERO_BACKGROUND_GROUPS, HERO_BACKGROUNDS, heroBackground, type HeroBackground } from "@/lib/hero-backgrounds"
import { cn } from "@/lib/utils"
import { Label } from "./fields"

const preview = (b: HeroBackground) =>
  `radial-gradient(circle at 88% 0%, ${b.glows[0]}, transparent 62%), radial-gradient(circle at 0% 100%, ${b.glows[1]}, transparent 60%), ${b.base}`

/** Tiles for choosing the home banner's background colour. */
export function HeroBackgroundPicker({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  const current = heroBackground(value).id
  return (
    <div>
      <Label hint="The colour behind the falling beads and the loom. Light colours get dark writing, dark colours get light writing.">
        Background colour
      </Label>
      <div className="space-y-4">
        {HERO_BACKGROUND_GROUPS.map((g) => (
          <div key={g.id}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{g.label}</p>
            <div role="radiogroup" aria-label={`${g.label} backgrounds`} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {HERO_BACKGROUNDS.filter((b) => b.group === g.id).map((b) => {
                const on = b.id === current
                const ink = b.light ? "bg-espresso/70" : "bg-white/80"
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onChange(b.id)}
                    className="group text-left"
                  >
                    <span
                      style={{ background: preview(b) }}
                      className={cn(
                        "relative block aspect-[4/3] overflow-hidden rounded-xl border transition-shadow",
                        on ? "border-cocoa shadow-[0_0_0_2px_var(--color-cocoa)]" : "border-cocoa/12 group-hover:border-cocoa/35"
                      )}
                    >
                      {/* a tiny headline and loom, to show the writing colour */}
                      <span className={cn("absolute top-[30%] left-[12%] h-1 w-[34%] rounded-full", ink)} />
                      <span className={cn("absolute top-[42%] left-[12%] h-1 w-[26%] rounded-full", ink)} />
                      <span
                        className={cn(
                          "absolute top-[30%] right-[10%] h-[34%] w-[36%] rounded-md border",
                          b.light ? "border-cocoa/10 bg-white/60" : "border-white/15 bg-white/10"
                        )}
                      />
                      <span className="absolute bottom-[22%] left-[12%] h-1.5 w-[18%] rounded-full bg-lagoon" />
                      {on && (
                        <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-cocoa text-white">
                          <Check className="size-3" />
                        </span>
                      )}
                    </span>
                    <span className={cn("mt-1 block truncate text-xs", on ? "font-medium text-cocoa" : "text-muted-foreground")}>{b.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
