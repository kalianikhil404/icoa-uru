import { ATLAS } from "@/lib/bead-atlas"
import { cn } from "@/lib/utils"

/** A strand of real-looking seed beads (from the bead atlas), used as a divider. */
const ORDER = [9, 11, 4, 3, 2, 0, 5, 1, 10]

export function BeadRow({ count = 9, size = 14, className }: { count?: number; size?: number; className?: string }) {
  const cell = ATLAS.cell
  const scale = size / (cell * 0.9)
  const sheetW = cell * ATLAS.tilts * scale
  const sheetH = cell * ATLAS.colors.length * scale
  return (
    <div aria-hidden className={cn("flex items-center", className)} style={{ gap: size * 0.05 }}>
      {Array.from({ length: count }, (_, i) => {
        const row = ORDER[i % ORDER.length]
        const tilt = 6 + (i % 3) // three-quarter views, so the hole shows
        return (
          <span
            key={i}
            className="shrink-0 bg-no-repeat"
            style={{
              width: cell * scale * 0.92,
              height: cell * scale * 0.92,
              backgroundImage: `url(${ATLAS.src})`,
              backgroundSize: `${sheetW}px ${sheetH}px`,
              backgroundPosition: `${-(tilt * cell + cell * 0.04) * scale}px ${-(row * cell + cell * 0.04) * scale}px`,
            }}
          />
        )
      })}
    </div>
  )
}
