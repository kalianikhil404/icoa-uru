"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import { Eraser, FlipHorizontal2, Paintbrush, PaintBucket, Pipette, Redo2, RotateCcw, ShoppingBag, Shuffle, Type, Undo2 } from "lucide-react"
import { beadPalette } from "@/content/bead-colors"
import { beads, shop, sizeForRows, sizes, widthCm, lengthCm, defaultSize, sizeById } from "@/content/site"
import { patterns, paletteIndex, writeText, seeded, type Grid } from "@/lib/patterns"
import { addToBag, lineKey } from "@/lib/cart-actions"
import { formatPrice } from "@/lib/format"
import { useBeadUrls } from "@/hooks/use-bead-urls"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BandPreview } from "@/components/custom/band-preview"
import { cn } from "@/lib/utils"

const COLS = beads.standardLength || 63
type Tool = "brush" | "fill" | "eraser" | "picker"

const toIdx = (g: Grid) => g.flat().map((id) => paletteIndex[id] ?? 0)
const finishOf = (hex: string) => beadPalette.find((b) => b.hex.toLowerCase() === hex.toLowerCase())?.finish ?? "opaque"

/** Keep the design centred when the band gets wider or narrower */
function resizeRows(cells: number[], oldRows: number, newRows: number, fill: number) {
  const out = Array(COLS * newRows).fill(fill)
  const off = Math.floor((newRows - oldRows) / 2)
  for (let r = 0; r < oldRows; r++) {
    const nr = r + off
    if (nr < 0 || nr >= newRows) continue
    for (let c = 0; c < COLS; c++) out[nr * COLS + c] = cells[r * COLS + c]
  }
  return out
}

const Bead = memo(function Bead({ i, url, hex }: { i: number; url?: string; hex: string }) {
  return (
    <span
      data-bead={i}
      className="aspect-[10/7] bg-center bg-no-repeat transition-transform duration-100 hover:z-10 hover:scale-125"
      style={{ backgroundImage: url ? `url(${url})` : undefined, backgroundColor: url ? undefined : hex, backgroundSize: "112% auto" }}
    />
  )
})

export function PatternDesigner() {
  const startSize = sizeById(defaultSize) ?? sizes[0]
  const [rows, setRows] = useState(startSize.rows)
  const [cells, setCells] = useState<number[]>(() => toIdx(patterns[0].build(COLS, startSize.rows)))
  const [color, setColor] = useState(paletteIndex.cobalt ?? 0)
  const [bg, setBg] = useState(paletteIndex.bone ?? 0)
  const [tool, setTool] = useState<Tool>("brush")
  const [mirror, setMirror] = useState(false)
  const [text, setText] = useState("")
  const [history, setHistory] = useState<{ cells: number[]; rows: number }[]>([])
  const [future, setFuture] = useState<{ cells: number[]; rows: number }[]>([])
  const painting = useRef(false)
  const urls = useBeadUrls(beadPalette.map((b) => b.hex), finishOf)

  const commit = useCallback(
    (next: number[], nextRows = rows) => {
      setHistory((h) => [...h.slice(-79), { cells, rows }])
      setFuture([])
      setCells(next)
      setRows(nextRows)
    },
    [cells, rows]
  )
  const undo = () => {
    const prev = history.at(-1)
    if (!prev) return
    setFuture((f) => [{ cells, rows }, ...f])
    setHistory((h) => h.slice(0, -1))
    setCells(prev.cells)
    setRows(prev.rows)
  }
  const redo = () => {
    const next = future[0]
    if (!next) return
    setHistory((h) => [...h, { cells, rows }])
    setFuture((f) => f.slice(1))
    setCells(next.cells)
    setRows(next.rows)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const paintAt = (i: number, base: number[]) => {
    const value = tool === "eraser" ? bg : color
    const next = [...base]
    if (tool === "fill") {
      const target = base[i]
      if (target === value) return base
      const stack = [i]
      while (stack.length) {
        const k = stack.pop()!
        if (next[k] !== target) continue
        next[k] = value
        const kr = Math.floor(k / COLS)
        const kc = k % COLS
        if (kc > 0) stack.push(k - 1)
        if (kc < COLS - 1) stack.push(k + 1)
        if (kr > 0) stack.push(k - COLS)
        if (kr < rows - 1) stack.push(k + COLS)
      }
      return next
    }
    next[i] = value
    if (mirror) next[Math.floor(i / COLS) * COLS + (COLS - 1 - (i % COLS))] = value
    return next
  }

  const beadAt = (e: React.PointerEvent) => {
    const el = (e.pointerType === "mouse" ? e.target : document.elementFromPoint(e.clientX, e.clientY)) as HTMLElement | null
    const v = el?.dataset?.bead
    return v === undefined ? -1 : Number(v)
  }
  const onDown = (e: React.PointerEvent) => {
    const i = beadAt(e)
    if (i < 0) return
    e.preventDefault()
    if (tool === "picker") {
      setColor(cells[i])
      setTool("brush")
      return
    }
    painting.current = tool !== "fill"
    commit(paintAt(i, cells))
  }
  const onMove = (e: React.PointerEvent) => {
    if (!painting.current) return
    const i = beadAt(e)
    if (i >= 0) setCells((prev) => paintAt(i, prev))
  }
  useEffect(() => {
    const stop = () => (painting.current = false)
    window.addEventListener("pointerup", stop)
    return () => window.removeEventListener("pointerup", stop)
  }, [])

  const changeWidth = (newRows: number) => {
    if (newRows === rows) return
    commit(resizeRows(cells, rows, newRows, bg), newRows)
  }
  const loadPreset = (id: string) => {
    const p = patterns.find((x) => x.id === id)
    if (p) commit(toIdx(p.build(COLS, rows)))
  }
  const fillBackground = (idx: number) => {
    const old = bg
    setBg(idx)
    commit(cells.map((c) => (c === old ? idx : c)))
  }
  const applyText = () => {
    const grid: Grid = Array.from({ length: rows }, (_, r) => Array.from({ length: COLS }, (_, c) => beadPalette[cells[r * COLS + c]].id))
    if (writeText(grid, text || "♥", beadPalette[color].id)) commit(toIdx(grid))
  }
  const surprise = () => {
    const rand = seeded(Date.now() % 100000)
    const picks = [bg, ...Array.from({ length: 3 }, () => Math.floor(rand() * beadPalette.length))]
    commit(
      cells.map((_, i) => {
        const c = i % COLS
        const r = Math.floor(i / COLS)
        return picks[Math.floor(Math.abs((c % (rows + 1)) - rows / 2) + Math.abs(r - (rows - 1) / 2)) % picks.length]
      })
    )
  }

  const used = useMemo(() => {
    const counts = new Map<number, number>()
    cells.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [cells])

  const size = sizeForRows(rows)
  const price = Math.max(0, shop.customBasePrice + (size?.priceAdd ?? 0))
  const design = { rows, cols: COLS, cells: cells.map((c) => c.toString(16)).join("") }
  const addDesign = (el: HTMLElement) =>
    addToBag(
      {
        key: lineKey(["custom", size?.id, design.cells.slice(0, 40), design.cells.length, Date.now()]),
        productId: "custom",
        slug: "custom",
        name: "Custom loom bracelet",
        image: "/images/brand/logo-mark.png",
        unitPrice: price,
        quantity: 1,
        size: size?.id,
        design,
      },
      el,
      beadPalette[color].hex
    )

  const tools: { id: Tool; label: string; Icon: typeof Paintbrush }[] = [
    { id: "brush", label: "Brush", Icon: Paintbrush },
    { id: "fill", label: "Fill area", Icon: PaintBucket },
    { id: "eraser", label: "Eraser", Icon: Eraser },
    { id: "picker", label: "Pick a colour from the design", Icon: Pipette },
  ]

  return (
    <div className="grid gap-8 xl:grid-cols-12">
      <div className="min-w-0 xl:col-span-8">
        <div className="rounded-[28px] border bg-white/70 p-4 shadow-soft backdrop-blur sm:p-6">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-sand/70 p-1">
              {tools.map(({ id, label, Icon }) => (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={label}
                      aria-pressed={tool === id}
                      onClick={() => setTool(id)}
                      className={cn("relative grid size-9 place-items-center rounded-full text-cocoa", tool === id && "text-white")}
                    >
                      {tool === id && <motion.span layoutId="tool" className="absolute inset-0 rounded-full bg-cocoa" />}
                      <Icon className="relative size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
            <button
              type="button"
              aria-pressed={mirror}
              onClick={() => setMirror((m) => !m)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                mirror ? "border-lagoon bg-lagoon/10 text-lagoon" : "text-cocoa hover:bg-sand/60"
              )}
            >
              <FlipHorizontal2 className="size-4" /> Mirror
            </button>
            <div className="ml-auto flex items-center gap-1">
              {[
                { label: "Undo (Ctrl Z)", Icon: Undo2, fn: undo, disabled: !history.length },
                { label: "Redo (Ctrl Y)", Icon: Redo2, fn: redo, disabled: !future.length },
                { label: "Surprise me", Icon: Shuffle, fn: surprise, disabled: false },
                { label: "Clear", Icon: RotateCcw, fn: () => commit(Array(COLS * rows).fill(bg)), disabled: false },
              ].map(({ label, Icon, fn, disabled }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={label}
                      onClick={fn}
                      disabled={disabled}
                      className="grid size-9 place-items-center rounded-full text-cocoa transition-colors hover:bg-sand disabled:opacity-30"
                    >
                      <Icon className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-[#efe6da] p-3 sm:p-4">
            <div
              className={cn("mx-auto grid min-w-[640px] touch-none select-none", tool === "picker" ? "cursor-crosshair" : "cursor-pointer")}
              style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerLeave={() => (painting.current = false)}
              role="application"
              aria-label="Bead grid: click or drag to paint"
            >
              {cells.map((c, i) => (
                <Bead key={i} i={i} hex={beadPalette[c]?.hex ?? "#eee"} url={urls[beadPalette[c]?.hex ?? ""]} />
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {COLS} beads long × {rows} wide. Click or drag to paint, Ctrl + Z to undo. Scroll sideways on small screens.
          </p>
        </div>

        <div className="mt-6 grid gap-6 rounded-[28px] border bg-white/70 p-5 shadow-soft backdrop-blur sm:p-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium text-cocoa">
              Bead colour <span className="font-normal text-muted-foreground">{beadPalette[color]?.name}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {beadPalette.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={p.name}
                  aria-pressed={color === i}
                  title={p.name}
                  onClick={() => {
                    setColor(i)
                    if (tool === "eraser" || tool === "picker") setTool("brush")
                  }}
                  className={cn("grid size-10 place-items-center rounded-xl transition-transform hover:scale-110", color === i && "bg-sand ring-2 ring-cocoa")}
                >
                  <span className="h-6 w-8 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: urls[p.hex] ? `url(${urls[p.hex]})` : undefined, backgroundColor: urls[p.hex] ? undefined : p.hex }} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-cocoa">Background</p>
              <div className="flex flex-wrap gap-1.5">
                {beadPalette.slice(0, 10).map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-label={`Background ${p.name}`}
                    onClick={() => fillBackground(i)}
                    className={cn("size-6 rounded-full ring-1 ring-black/10", bg === i && "ring-2 ring-cocoa ring-offset-1")}
                    style={{ background: p.hex }}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select onValueChange={loadPreset}>
                <SelectTrigger className="h-10 flex-1 rounded-full bg-white" aria-label="Start from a pattern">
                  <SelectValue placeholder="Start from a pattern" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {patterns.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="rounded-xl">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-1 items-center gap-1 rounded-full border bg-white p-1 pl-4">
                <Type className="size-4 shrink-0 text-muted-foreground" />
                <input
                  value={text}
                  maxLength={9}
                  onChange={(e) => setText(e.target.value.replace(/[^a-zA-Z ♥]/g, ""))}
                  placeholder="Add a name"
                  aria-label="Name to weave"
                  className="h-8 min-w-0 flex-1 bg-transparent text-sm uppercase outline-none"
                />
                <button type="button" onClick={applyText} disabled={rows < 7} className="h-8 rounded-full bg-cocoa px-3 text-xs text-white disabled:opacity-40">
                  Weave
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0 xl:col-span-4">
        <div className="space-y-5 xl:sticky xl:top-28">
          <div className="overflow-hidden rounded-[28px] border bg-white/70 shadow-soft backdrop-blur">
            <div className="bg-gradient-to-br from-sand to-porcelain p-5">
              <BandPreview cells={cells} rows={rows} cols={COLS} />
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <p className="mb-2 text-sm font-medium text-cocoa">
                  Width <span className="font-normal text-muted-foreground">{rows} beads, {widthCm(rows)}</span>
                </p>
                <LayoutGroup id="designer-width">
                  <div className="grid grid-cols-5 gap-1 rounded-2xl bg-sand/60 p-1">
                    {sizes.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => changeWidth(s.rows)}
                        className={cn("relative rounded-xl py-2 text-xs leading-tight", rows === s.rows ? "text-white" : "text-cocoa hover:bg-white/60")}
                      >
                        {rows === s.rows && <motion.span layoutId="designer-width-pill" className="absolute inset-0 rounded-xl bg-cocoa" />}
                        <span className="relative block">{s.label}</span>
                        <span className={cn("relative block tabular-nums", rows === s.rows ? "text-white/70" : "text-muted-foreground")}>{s.rows}</span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
                <p className="mt-2 text-xs text-muted-foreground">
                  {COLS} beads long ({lengthCm(COLS)}) plus clasp and {beads.extenderCm} cm extender chain.
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-cocoa">Colours in your design</p>
                <ul className="flex flex-wrap gap-1.5">
                  <AnimatePresence initial={false}>
                    {used.map(([idx, n]) => (
                      <motion.li
                        key={idx}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-sand/60 py-1 pr-2.5 pl-1 text-xs text-cocoa"
                      >
                        <span className="size-4 rounded-full ring-1 ring-black/10" style={{ background: beadPalette[idx]?.hex }} />
                        {beadPalette[idx]?.name}
                        <span className="text-muted-foreground tabular-nums">{n}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
              <div className="flex items-end justify-between border-t pt-5">
                <div>
                  <p className="text-xs text-muted-foreground">{size?.label} custom bracelet</p>
                  <p className="font-display text-3xl text-cocoa">{formatPrice(price)}</p>
                </div>
                <p className="text-right text-xs text-muted-foreground">
                  {(rows * COLS).toLocaleString()} beads
                  <br />
                  Woven in about 2 weeks
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => addDesign(e.currentTarget)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lagoon text-[0.95rem] font-medium text-white transition-colors hover:bg-lagoon-deep"
              >
                <ShoppingBag className="size-4" /> Add my design to bag
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
