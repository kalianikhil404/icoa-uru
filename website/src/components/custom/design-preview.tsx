import { beadPalette } from "@/content/bead-colors"
import type { CustomDesign } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Small picture of a custom pattern (used in the bag and checkout). */
export function DesignPreview({
  design,
  className,
  vertical = false,
}: {
  design: CustomDesign
  className?: string
  /** Draw the band standing up (for small square thumbnails) */
  vertical?: boolean
}) {
  const { rows, cols, cells } = design
  return (
    <svg
      viewBox={vertical ? `0 0 ${rows} ${cols}` : `0 0 ${cols} ${rows}`}
      className={cn("rounded-sm shadow-sm", className)}
      role="img"
      aria-label="Custom bead pattern"
    >
      {Array.from({ length: rows * cols }, (_, i) => {
        const hex = beadPalette[parseInt(cells[i] ?? "0", 16)]?.hex ?? "#eee"
        const x = i % cols
        const y = Math.floor(i / cols)
        return <rect key={i} x={vertical ? y : x} y={vertical ? x : y} width={0.92} height={0.92} rx={0.3} fill={hex} />
      })}
    </svg>
  )
}
