import { beadPalette } from "@/content/bead-colors"
import type { Finish } from "@/content/types"

/* Bead patterns used by the home-page loom animation and as presets
   on the "Design your own" page. Each pattern returns a grid of
   palette ids (see src/content/bead-colors.ts). */

export type PaletteId = string
export type Grid = PaletteId[][]

export const paletteHex = Object.fromEntries(beadPalette.map((c) => [c.id, c.hex])) as Record<PaletteId, string>
export const paletteIndex = Object.fromEntries(beadPalette.map((c, i) => [c.id, i])) as Record<PaletteId, number>
const finishByHex = Object.fromEntries(beadPalette.map((c) => [c.hex.toLowerCase(), c.finish])) as Record<string, Finish>
/** Glass finish for a palette colour (opaque if unknown) */
export const finishFor = (hex: string): Finish => finishByHex[hex.toLowerCase()] ?? "opaque"

/** Small deterministic random generator so patterns look the same every time */
export function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const blank = (cols: number, rows: number, bg: PaletteId): Grid =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => bg))

/* Pixel motifs: each character maps to a palette id */
const MOTIFS: Record<string, { art: string[]; map: Record<string, PaletteId> }> = {
  strawberry: {
    art: ["..GgG..", ".GRRRG.", "RRKRRRR", "RRRRKRR", ".RKRRR.", "..RRR..", "...R..."],
    map: { G: "leaf", g: "lime", R: "berry", K: "jet" },
  },
  heart: {
    art: [".RR.RR.", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."],
    map: { R: "berry" },
  },
  star: {
    art: ["...Y...", "...Y...", "YYYYYYY", ".YYYYY.", "..YYY..", ".YY.YY.", ".Y...Y."],
    map: { Y: "marigold" },
  },
  daisy: {
    art: ["...W...", ".W.W.W.", "..WYW..", "WWYYYWW", "..WYW..", ".W.W.W.", "...W..."],
    map: { W: "snow", Y: "marigold" },
  },
}

/** How much to enlarge a motif so it suits the band width */
const motifScale = (rows: number, motifH: number) => Math.max(1, Math.floor((rows - 1) / motifH))

function stamp(grid: Grid, motif: keyof typeof MOTIFS, col: number, scale: number, flip = false) {
  const { art, map } = MOTIFS[motif]
  const rows = grid.length
  const lines = flip ? [...art].reverse() : art
  const top = Math.floor((rows - lines.length * scale) / 2)
  lines.forEach((line, y) =>
    [...line].forEach((ch, x) => {
      if (ch === ".") return
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) {
          const r = top + y * scale + dy
          const c = col + x * scale + dx
          if (r >= 0 && r < rows && c >= 0 && c < grid[0].length) grid[r][c] = map[ch]
        }
    })
  )
}

/** Mini bands (under 7 rows) are too narrow for motifs: use dots in the motif colours */
function miniDots(cols: number, rows: number, bg: PaletteId, colors: PaletteId[]) {
  const g = blank(cols, rows, bg)
  const mid = Math.floor(rows / 2)
  for (let c = 1; c < cols; c += 4) {
    const col = colors[Math.floor(c / 4) % colors.length]
    g[mid][c] = col
    if (rows >= 3) {
      g[mid - 1][c] = col
      if (mid + 1 < rows) g[mid + 1][c] = col
      if (c + 1 < cols) g[mid][c + 1] = col
      if (c - 1 >= 0) g[mid][c - 1] = col
    }
  }
  return g
}

function repeatMotif(cols: number, rows: number, bg: PaletteId, motif: keyof typeof MOTIFS, gap: number, flipAlt = false) {
  const art = MOTIFS[motif].art
  if (rows < art.length) return miniDots(cols, rows, bg, [...new Set(Object.values(MOTIFS[motif].map))])
  const scale = motifScale(rows, art.length)
  const g = blank(cols, rows, bg)
  const w = Math.max(...art.map((l) => l.length)) * scale
  const step = w + gap * scale
  const count = Math.max(1, Math.floor((cols + gap * scale) / step))
  const start = Math.floor((cols - (count * step - gap * scale)) / 2)
  for (let i = 0; i < count; i++) stamp(g, motif, start + i * step, scale, flipAlt && i % 2 === 1)
  return g
}

export const patterns: { id: string; name: string; build: (cols: number, rows: number) => Grid }[] = [
  {
    id: "desert-diamond",
    name: "Desert Diamond",
    build: (cols, rows) => {
      const g = blank(cols, rows, "bone")
      const rings: PaletteId[] = ["clay", "bone", "lagoon", "clay", "lagoon", "marigold"]
      const period = Math.max(8, (rows - 1) * 2)
      const offset = Math.floor(((cols % period) + period) / 2)
      for (let c = 0; c < cols; c++)
        for (let r = 0; r < rows; r++) {
          const dx = Math.abs(((c - offset + period * 10) % period) - period / 2) / (period / 2)
          const dy = rows > 1 ? Math.abs(r - (rows - 1) / 2) / ((rows - 1) / 2) : 0
          const i = Math.floor((dx + dy) * (rings.length / 1.15))
          if (i < rings.length) g[r][c] = rings[i]
        }
      return g
    },
  },
  {
    id: "aqua-peaks",
    name: "Aqua Peaks",
    build: (cols, rows) => {
      const g = blank(cols, rows, "aqua")
      const rand = seeded(7)
      for (let c = 0; c < cols; c++) for (let r = 1; r < rows - 1; r++) if (rand() < 0.07) g[r][c] = "snow"
      const thick = rows >= 15 ? 2 : 1
      const P = Math.max(6, Math.round(rows * 1.0))
      for (let c = 0; c < cols; c++) {
        const ph = c % P
        const h = ph <= P / 2 ? ph : P - ph
        const r = rows - 2 - Math.round((h * Math.max(1, rows - 3)) / (P / 2))
        for (let t = 0; t < thick; t++) {
          const rr = Math.min(rows - 1, Math.max(0, r + t))
          g[rr][c] = "cobalt"
        }
      }
      return g
    },
  },
  {
    id: "strawberry-patch",
    name: "Strawberry Patch",
    build: (cols, rows) => repeatMotif(cols, rows, "blush", "strawberry", 3, true),
  },
  {
    id: "love-notes",
    name: "Love Notes",
    build: (cols, rows) => repeatMotif(cols, rows, "blush", "heart", 3),
  },
  {
    id: "midnight-stars",
    name: "Midnight Stars",
    build: (cols, rows) => {
      const g = repeatMotif(cols, rows, "cobalt", "star", 3)
      const rand = seeded(3)
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) if (g[r][c] === "cobalt" && rand() < 0.05) g[r][c] = "snow"
      return g
    },
  },
  {
    id: "daisy-chain",
    name: "Daisy Chain",
    build: (cols, rows) => repeatMotif(cols, rows, "lime", "daisy", 2),
  },
]

/* ---------- 5×7 pixel font for name bracelets ---------- */
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "11110", "10001", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "11110", "10000", "10000", "10000", "11111"],
  F: ["11111", "10000", "11110", "10000", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
  H: ["10001", "10001", "11111", "10001", "10001", "10001", "10001"],
  I: ["111", "010", "010", "010", "010", "010", "111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "11100", "10010", "10001", "10001", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "01110", "00001", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "01010", "00100", "00100", "01010", "10001", "10001"],
  Y: ["10001", "01010", "00100", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00010", "00100", "01000", "10000", "10000", "11111"],
  "♥": ["01010", "11111", "11111", "01110", "00100", "00000", "00000"],
  " ": ["00", "00", "00", "00", "00", "00", "00"],
}

/** Writes text into a grid (centered). Returns false if it doesn't fit. */
export function writeText(grid: Grid, text: string, color: PaletteId) {
  const chars = [...text.toUpperCase()].map((ch) => FONT[ch] ?? FONT[" "])
  const width = chars.reduce((w, g) => w + g[0].length + 1, -1)
  const cols = grid[0].length
  const rows = grid.length
  if (rows < 7) return false
  // letters grow on wide bands when they still fit
  let s = Math.max(1, Math.floor(rows / 8))
  while (s > 1 && width * s > cols) s--
  if (width * s > cols) return false
  let x = Math.floor((cols - width * s) / 2)
  const top = Math.floor((rows - 7 * s) / 2)
  for (const glyph of chars) {
    glyph.forEach((line, y) =>
      [...line].forEach((bit, dx) => {
        if (bit !== "1") return
        for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) grid[top + y * s + a][x + dx * s + b] = color
      })
    )
    x += (glyph[0].length + 1) * s
  }
  return true
}
