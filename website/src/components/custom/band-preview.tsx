"use client"

import { memo } from "react"
import { beadPalette } from "@/content/bead-colors"

/** A realistic-looking picture of the woven band, with silver ends and clasp. */
export const BandPreview = memo(function BandPreview({
  cells,
  rows,
  cols,
}: {
  cells: number[]
  rows: number
  cols: number
}) {
  const bw = 10
  const bh = 7
  const pad = 26
  const W = cols * bw + pad * 2 + 30
  const H = rows * bh + 40
  const x0 = pad + 10
  const y0 = 20
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full drop-shadow-[0_10px_14px_rgb(74_46_34/0.22)]" role="img" aria-label="Preview of your woven band">
      <defs>
        <linearGradient id="bead-shade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".22" />
          <stop offset=".22" stopColor="#fff" stopOpacity=".45" />
          <stop offset=".42" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".25" />
        </linearGradient>
        <linearGradient id="silver" x1="0" x2="1">
          <stop offset="0" stopColor="#8d9399" />
          <stop offset=".35" stopColor="#f4f6f8" />
          <stop offset=".6" stopColor="#c3c8ce" />
          <stop offset="1" stopColor="#7b8187" />
        </linearGradient>
      </defs>
      {/* edge thread */}
      <rect x={x0 - 1} y={y0 - 2} width={cols * bw + 2} height={rows * bh + 4} rx={3} fill="#e9dfd1" />
      {cells.map((c, i) => {
        const x = x0 + (i % cols) * bw
        const y = y0 + Math.floor(i / cols) * bh
        return (
          <g key={i}>
            <rect x={x + 0.4} y={y + 0.5} width={bw - 0.8} height={bh - 1} rx={3.2} fill={beadPalette[c]?.hex ?? "#eee"} />
            <rect x={x + 0.4} y={y + 0.5} width={bw - 0.8} height={bh - 1} rx={3.2} fill="url(#bead-shade)" />
          </g>
        )
      })}
      {/* silver end bars */}
      {[x0 - 7, x0 + cols * bw + 1].map((x) => (
        <rect key={x} x={x} y={y0 - 6} width={6} height={rows * bh + 12} rx={3} fill="url(#silver)" />
      ))}
      {/* clasp + chain */}
      <circle cx={x0 - 14} cy={y0 + (rows * bh) / 2} r={4} fill="none" stroke="#b9bec4" strokeWidth={2} />
      <ellipse cx={x0 - 24} cy={y0 + (rows * bh) / 2} rx={7} ry={4.5} fill="none" stroke="#c9ced3" strokeWidth={3} />
      {[0, 1, 2].map((k) => (
        <ellipse
          key={k}
          cx={x0 + cols * bw + 14 + k * 9}
          cy={y0 + (rows * bh) / 2}
          rx={k % 2 ? 3 : 5}
          ry={k % 2 ? 5 : 3}
          fill="none"
          stroke="#b9bec4"
          strokeWidth={1.8}
        />
      ))}
    </svg>
  )
})
