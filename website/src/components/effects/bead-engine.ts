/* =====================================================================
   BEAD ENGINE — the falling seed-bead animation.
   - "weave" mode (home hero): beads rain in and weave a pattern on a loom
     (63 beads long by default, as wide as the chosen size).
   - "shower" mode (page headers): a short bead shower when a page opens.
   Beads are Miyuki-style 11/0 seed beads (see src/lib/seed-bead.ts):
   they tumble as they fall, so you see them from the side and through
   the hole. Pauses off-screen / in hidden tabs; still image for people
   who prefer less motion.
   ===================================================================== */

import { ATLAS, SIDE_BEAD, beadSprite, loadAtlas } from "@/lib/bead-sprites"
import type { Finish } from "@/lib/seed-bead"

type Drop = {
  x: number
  y: number
  vx: number
  vy: number
  d: number // drawn sprite size (css px)
  depth: number // 0 far … 1 near
  color: number // atlas row
  tilt: number // degrees, 0..180 cycle
  vt: number
  spin: number
  vs: number
  phase: number
  burst: boolean
  layer: "back" | "front"
}

type Cell = {
  tx: number
  ty: number
  hex: string
  finish: Finish
  start: number
  x0: number
  y0: number
  state: 0 | 1 | 2 | 3 // waiting, falling, landed, dropping out
  landedAt: number
  x: number
  y: number
  vy: number
  lift: number
  pulseAt: number
  alpha: number
  tilt0: number
}

export type EngineOptions = {
  back: HTMLCanvasElement
  front?: HTMLCanvasElement | null
  loom?: HTMLElement | null
  mode: "weave" | "shower"
  theme: "dark" | "light"
  /** Pattern as hex colours [row][col] */
  getPattern?: (cols: number, rows: number, index: number) => string[][]
  finishFor?: (hex: string) => Finish
  cols?: number
  rows?: number
  reducedMotion?: boolean
  density?: number
  onProgress?: (placed: number, total: number) => void
  onWoven?: () => void
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const BEAD_H = 0.7 // loom cell height ÷ width (Miyuki 11/0: 2.0 mm × 1.4 mm on the loom)

export class BeadEngine {
  private o: EngineOptions
  private bctx: CanvasRenderingContext2D
  private fctx: CanvasRenderingContext2D | null
  private w = 0
  private h = 0
  private dpr = 1
  private drops: Drop[] = []
  private cells: Cell[] = []
  private cols: number
  private rows: number
  private cw = 0
  private ch = 0
  private loomRect = { x: 0, y: 0, w: 0, h: 0 }
  private placed = 0
  private woven = false
  private raf = 0
  private last = 0
  private running = false
  /** set by destroy(): a stopped engine must never wake up again (React may start, stop and restart it) */
  private destroyed = false
  private visible = true
  private pointer = { x: -9999, y: -9999 }
  private io?: IntersectionObserver
  private ro?: ResizeObserver
  private t0 = 0
  private ambientTarget = 0
  private patternIndex = 0
  private atlas: HTMLImageElement | null = null
  private atlasSoft: HTMLCanvasElement | null = null
  private shadow: HTMLCanvasElement | null = null
  private lastSync = 0

  constructor(o: EngineOptions) {
    this.o = o
    this.cols = o.cols ?? 63
    this.rows = o.rows ?? 10
    this.bctx = o.back.getContext("2d")!
    this.fctx = o.front ? o.front.getContext("2d")! : null
    this.onPointer = this.onPointer.bind(this)
    this.onLeave = this.onLeave.bind(this)
    this.onVisibility = this.onVisibility.bind(this)
    this.loop = this.loop.bind(this)
  }

  start() {
    this.resize(true)
    this.t0 = performance.now()
    this.seedDrops()
    if (this.o.mode === "weave") this.scheduleWeave(this.t0 + 250)
    loadAtlas()
      .then((img) => {
        if (this.destroyed) return
        this.atlas = img
        this.atlasSoft = this.makeSoftAtlas(img)
        this.kick()
      })
      .catch(() => {})
    this.shadow = this.makeShadow()

    this.ro = new ResizeObserver(() => this.resize(false))
    this.ro.observe(this.o.back)
    if (this.o.loom) this.ro.observe(this.o.loom)
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      this.kick()
    })
    this.io.observe(this.o.back)
    window.addEventListener("pointermove", this.onPointer, { passive: true })
    document.addEventListener("pointerleave", this.onLeave)
    document.addEventListener("visibilitychange", this.onVisibility)
    this.kick()
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.running = false
    this.ro?.disconnect()
    this.io?.disconnect()
    window.removeEventListener("pointermove", this.onPointer)
    document.removeEventListener("pointerleave", this.onLeave)
    document.removeEventListener("visibilitychange", this.onVisibility)
  }

  /** Woven beads bounce outward from a point (client coords). */
  ripple(clientX: number, clientY: number) {
    if (this.destroyed) return
    const rect = this.o.back.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const now = performance.now()
    for (const c of this.cells) if (c.state === 2) c.pulseAt = now + Math.hypot(c.tx - x, c.ty - y) * 1.4
    this.kick()
  }

  /** Drop the current beads and weave the next pattern. */
  reweave() {
    if (this.destroyed) return
    this.patternIndex++
    this.restartWeave()
  }

  /** Change the band width (number of rows) and weave again. */
  setRows(rows: number) {
    if (this.destroyed) return
    if (rows === this.rows) return
    this.rows = rows
    this.restartWeave()
  }

  private restartWeave() {
    if (this.o.mode !== "weave") return
    const now = performance.now()
    if (this.o.reducedMotion) {
      this.layoutLoom(true)
      this.draw(now)
      return
    }
    const old = this.cells.filter((c) => c.state === 1 || c.state === 2)
    for (const c of old) {
      c.state = 3
      c.vy = rand(-0.04, 0.04)
      c.start = now + (c.tx - this.loomRect.x) * 0.5 + rand(0, 60)
    }
    this.woven = false
    this.placed = 0
    this.layoutLoom(false)
    this.scheduleWeave(now + 500)
    this.cells.push(...old)
    this.o.onProgress?.(0, this.cols * this.rows)
    this.kick()
  }

  /* ---------- setup ---------- */
  private makeSoftAtlas(img: HTMLImageElement) {
    // cheap cross-browser blur for far-away beads: shrink, then enlarge
    const small = document.createElement("canvas")
    small.width = Math.round(img.width / 4)
    small.height = Math.round(img.height / 4)
    const s = small.getContext("2d")!
    s.imageSmoothingQuality = "high"
    s.drawImage(img, 0, 0, small.width, small.height)
    const big = document.createElement("canvas")
    big.width = img.width
    big.height = img.height
    const b = big.getContext("2d")!
    b.imageSmoothingQuality = "high"
    b.drawImage(small, 0, 0, big.width, big.height)
    return big
  }

  private makeShadow() {
    const c = document.createElement("canvas")
    c.width = 64
    c.height = 32
    const g = c.getContext("2d")!
    const grd = g.createRadialGradient(32, 16, 0, 32, 16, 30)
    grd.addColorStop(0, "rgba(74,46,34,0.45)")
    grd.addColorStop(1, "rgba(74,46,34,0)")
    g.fillStyle = grd
    g.scale(1, 0.5)
    g.beginPath()
    g.arc(32, 32, 30, 0, Math.PI * 2)
    g.fill()
    return c
  }

  private resize(first: boolean) {
    const rect = this.o.back.getBoundingClientRect()
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.w = rect.width
    this.h = rect.height
    for (const c of [this.o.back, this.o.front]) {
      if (!c) continue
      c.width = Math.round(this.w * this.dpr)
      c.height = Math.round(this.h * this.dpr)
    }
    this.bctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.fctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    const density = this.o.density ?? 1
    this.ambientTarget = Math.round(Math.min(70, (this.w * this.h) / 15000) * density * (this.w < 640 ? 0.6 : 1))
    if (this.o.mode === "weave") {
      const done = this.cells.length > 0 && this.cells.every((c) => c.state === 2)
      this.layoutLoom(!first && done)
      if (!first && !done && !this.o.reducedMotion) {
        this.placed = 0
        this.woven = false
        this.scheduleWeave(performance.now() + 60)
      }
    }
    if (!first) this.kick()
  }

  private layoutLoom(landed: boolean) {
    const loom = this.o.loom
    if (!loom || !this.o.getPattern) return
    const base = this.o.back.getBoundingClientRect()
    const r = loom.getBoundingClientRect()
    const lr = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }
    const cols = this.cols
    const rows = this.rows
    const cw = Math.min((lr.w * 0.9) / cols, (lr.h * 0.84) / (rows * BEAD_H))
    const ch = cw * BEAD_H
    this.cw = cw
    this.ch = ch
    this.loomRect = { x: lr.x + (lr.w - cols * cw) / 2, y: lr.y + (lr.h - rows * ch) / 2, w: cols * cw, h: rows * ch }
    const grid = this.o.getPattern(cols, rows, this.patternIndex)
    const finishFor = this.o.finishFor ?? (() => "opaque" as Finish)
    const fresh: Cell[] = []
    const isLanded = landed || !!this.o.reducedMotion
    for (let c = 0; c < cols; c++) {
      for (let r2 = 0; r2 < rows; r2++) {
        const tx = this.loomRect.x + (c + 0.5) * cw
        const ty = this.loomRect.y + (r2 + 0.5) * ch
        const hex = grid[r2]?.[c] ?? "#f1e9dc"
        fresh.push({
          tx,
          ty,
          hex,
          finish: finishFor(hex),
          start: 0,
          x0: tx,
          y0: ty,
          state: isLanded ? 2 : 0,
          landedAt: -9999,
          x: tx,
          y: ty,
          vy: 0,
          lift: 0,
          pulseAt: -9999,
          alpha: 1,
          tilt0: rand(0, 180),
        })
      }
    }
    this.cells = fresh
    if (isLanded) {
      this.placed = fresh.length
      this.woven = true
      this.o.onProgress?.(this.placed, fresh.length)
    }
  }

  private scheduleWeave(at: number) {
    if (this.o.reducedMotion) return
    const colDelay = Math.max(16, Math.min(60, 2400 / this.cols))
    for (const c of this.cells) {
      if (c.state !== 0) continue
      const col = Math.round((c.tx - this.loomRect.x) / this.cw - 0.5)
      c.start = at + col * colDelay + rand(0, 160)
      c.x0 = c.tx + rand(-36, 36)
      c.y0 = -rand(20, 200)
    }
  }

  private newDrop(initial: boolean, burst = false): Drop {
    const depth = Math.pow(Math.random(), 0.8)
    const maxD = this.o.mode === "weave" ? 26 : 20
    const d = lerp(8, maxD, depth) * (burst ? rand(0.9, 1.15) : 1)
    const front = this.fctx !== null && depth > 0.9 && Math.random() < 0.45
    return {
      x: rand(-20, this.w + 20),
      y: initial ? (burst ? rand(-this.h * 1.1, -20) : rand(-this.h * 1.2, -20)) : rand(-60, -20),
      vx: rand(-0.02, 0.02),
      vy: burst ? rand(0.25, 0.6) : rand(0.02, 0.08),
      d,
      depth,
      color: Math.floor(Math.random() * ATLAS.colors.length),
      tilt: rand(0, 180),
      vt: rand(0.04, 0.16) * (Math.random() < 0.5 ? -1 : 1),
      spin: rand(-0.4, 0.4),
      vs: rand(-0.0004, 0.0004),
      phase: rand(0, Math.PI * 2),
      burst,
      layer: front ? "front" : "back",
    }
  }

  private seedDrops() {
    if (this.o.reducedMotion) return
    this.drops = []
    const burst = this.o.mode === "weave" ? Math.round(this.ambientTarget * 0.9) : Math.round(this.ambientTarget * 1.6)
    for (let i = 0; i < burst; i++) this.drops.push(this.newDrop(true, true))
    const ambient = this.o.mode === "weave" ? this.ambientTarget : Math.round(this.ambientTarget * 0.35)
    for (let i = 0; i < ambient; i++) this.drops.push(this.newDrop(true))
  }

  /* ---------- input ---------- */
  private onPointer(e: PointerEvent) {
    const rect = this.o.back.getBoundingClientRect()
    this.pointer.x = e.clientX - rect.left
    this.pointer.y = e.clientY - rect.top
    if (this.o.reducedMotion && this.o.mode === "weave") this.draw(performance.now())
  }
  private onLeave() {
    this.pointer.x = this.pointer.y = -9999
  }
  private onVisibility() {
    this.kick()
  }

  private kick() {
    if (this.destroyed) return
    const shouldRun = this.visible && !document.hidden
    if (shouldRun && !this.running) {
      this.running = true
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.loop)
    } else if (!shouldRun) {
      this.running = false
      cancelAnimationFrame(this.raf)
    }
    if (this.o.reducedMotion) this.draw(performance.now())
  }

  /* ---------- main loop ---------- */
  private loop(now: number) {
    if (!this.running || this.destroyed) return
    const dt = Math.min(34, now - this.last)
    this.last = now
    try {
      this.update(dt, now)
      this.draw(now)
    } catch (err) {
      // never let one bad frame stop the animation for good
      if (process.env.NODE_ENV !== "production") console.warn("bead engine frame skipped", err)
    }
    if (this.o.reducedMotion) {
      this.running = false
      return
    }
    this.raf = requestAnimationFrame(this.loop)
  }

  /** Keep the loom glued to its card if the layout shifts (fonts loading etc). */
  private syncLoom(now: number) {
    if (this.o.mode !== "weave" || !this.o.loom || now - this.lastSync < 250) return
    this.lastSync = now
    const base = this.o.back.getBoundingClientRect()
    const r = this.o.loom.getBoundingClientRect()
    const nx = r.left - base.left + (r.width - this.loomRect.w) / 2
    const ny = r.top - base.top + (r.height - this.loomRect.h) / 2
    const dx = nx - this.loomRect.x
    const dy = ny - this.loomRect.y
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
    this.loomRect.x = nx
    this.loomRect.y = ny
    for (const c of this.cells) {
      c.tx += dx
      c.ty += dy
      if (c.state === 2) {
        c.x = c.tx
        c.y = c.ty
      }
    }
  }

  private update(dt: number, now: number) {
    this.syncLoom(now)
    const g = 0.00042
    const px = this.pointer.x
    const py = this.pointer.y
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i]
      const speed = lerp(0.35, 1, d.depth)
      d.vy = Math.min(d.vy + g * dt * speed, (d.burst ? 0.75 : 0.11) * speed)
      if (d.burst && now - this.t0 > 1400) d.vy = Math.max(d.vy * 0.995, 0.12 * speed)
      d.vx *= 0.97
      d.x += (d.vx + Math.sin(now * 0.0011 + d.phase) * 0.012 * speed) * dt
      d.y += d.vy * dt
      d.tilt += d.vt * dt
      d.spin += d.vs * dt
      if (d.depth > 0.35) {
        const dx = d.x - px
        const dy = d.y - py
        const dist = Math.hypot(dx, dy)
        const reach = 150 * lerp(0.7, 1, d.depth)
        if (dist < reach && dist > 0.1) {
          const f = (1 - dist / reach) * 0.016 * dt * lerp(0.6, 1, d.depth)
          d.vx += (dx / dist) * f
          d.vy += (dy / dist) * f * 0.4
          d.vt += (dx > 0 ? 1 : -1) * f * 0.6 // a nudge makes it tumble
        }
      }
      if (d.y - d.d > this.h + 30) {
        if (d.burst) this.drops.splice(i, 1)
        else Object.assign(d, this.newDrop(false))
      }
    }
    if (this.o.mode !== "weave") return
    const G = 0.0045
    for (let i = this.cells.length - 1; i >= 0; i--) {
      const c = this.cells[i]
      if (c.state === 0 && now >= c.start) c.state = 1
      if (c.state === 1) {
        const e = now - c.start
        const y = c.y0 + 0.5 * G * e * e
        const fallT = Math.sqrt((2 * (c.ty - c.y0)) / G)
        const p = Math.min(1, e / fallT)
        c.x = lerp(c.x0, c.tx, 1 - Math.pow(1 - p, 3))
        c.y = Math.min(y, c.ty)
        if (y >= c.ty) {
          c.state = 2
          c.landedAt = now
          c.x = c.tx
          c.y = c.ty
          this.placed++
          this.o.onProgress?.(this.placed, this.cols * this.rows)
          if (!this.woven && this.placed >= this.cols * this.rows) {
            this.woven = true
            this.o.onWoven?.()
          }
        }
      } else if (c.state === 2) {
        c.lift = 0
      } else if (c.state === 3 && now >= c.start) {
        c.vy += G * 0.8 * dt
        c.y += c.vy * dt
        c.alpha = Math.max(0, 1 - (c.y - c.ty) / 240)
        if (c.alpha <= 0 || c.y > this.h + 20) this.cells.splice(i, 1)
      }
    }
  }

  /* ---------- drawing ---------- */
  private drawDrop(ctx: CanvasRenderingContext2D, d: Drop) {
    if (!this.atlas) return
    const soft = d.depth < 0.42
    const src = soft && this.atlasSoft ? this.atlasSoft : this.atlas
    // rock between the side view and a three-quarter view, so the hole shows a little but
    // a bead never turns fully hole-on (which reads as a ring rather than a bead)
    const a = (((d.tilt % 110) + 110) % 110)
    const deg = a <= 55 ? a : 110 - a
    const ti = Math.min(ATLAS.tilts - 1, Math.round((deg / 180) * ATLAS.tilts))
    const cell = ATLAS.cell
    ctx.globalAlpha = lerp(0.4, 1, d.depth)
    if (this.o.theme === "light" && this.shadow && !soft) {
      ctx.globalAlpha *= 0.55
      ctx.drawImage(this.shadow, d.x - d.d * 0.42, d.y + d.d * 0.12, d.d * 0.84, d.d * 0.42)
      ctx.globalAlpha = lerp(0.4, 1, d.depth)
    }
    ctx.save()
    ctx.translate(d.x, d.y)
    ctx.rotate(d.spin)
    ctx.drawImage(src, ti * cell, d.color * cell, cell, cell, -d.d / 2, -d.d / 2, d.d, d.d)
    ctx.restore()
  }

  private drawLoomFrame(ctx: CanvasRenderingContext2D) {
    const { x, y, w, h } = this.loomRect
    const cw = this.cw
    ctx.globalAlpha = 1
    ctx.strokeStyle = this.o.theme === "dark" ? "rgba(255,244,230,0.2)" : "rgba(74,46,34,0.18)"
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let r = 0; r <= this.rows; r++) {
      const yy = Math.round(y + r * this.ch) + 0.5
      ctx.moveTo(x - cw * 2.6, yy)
      ctx.lineTo(x + w + cw * 2.6, yy)
    }
    ctx.stroke()
    const bw = Math.max(8, cw * 1.6)
    for (const bx of [x - cw * 2.6 - bw, x + w + cw * 2.6]) {
      const by = y - Math.max(10, h * 0.12)
      const bh = h + Math.max(20, h * 0.24)
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0)
      g.addColorStop(0, "#7a4a2a")
      g.addColorStop(0.35, "#c99567")
      g.addColorStop(0.6, "#a8703f")
      g.addColorStop(1, "#5e361d")
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.roundRect(bx, by, bw, bh, bw / 2)
      ctx.fill()
      ctx.fillStyle = "rgba(255,255,255,0.18)"
      ctx.fillRect(bx + bw * 0.28, by + bw * 0.5, bw * 0.12, bh - bw)
    }
  }

  private draw(now: number) {
    const b = this.bctx
    b.clearRect(0, 0, this.w, this.h)
    const f = this.fctx
    if (f) f.clearRect(0, 0, this.w, this.h)

    for (const d of this.drops) if (d.layer === "back" || !f) this.drawDrop(b, d)
    b.globalAlpha = 1

    if (this.o.mode !== "weave" || !f) {
      if (f) for (const d of this.drops) if (d.layer === "front") this.drawDrop(f, d)
      if (f) f.globalAlpha = 1
      return
    }

    this.drawLoomFrame(f)
    const cw = this.cw
    // side-view sprite sized so the bead spans one cell (touching its neighbours)
    const S = (cw * 1.04) / SIDE_BEAD.w
    for (const c of this.cells) {
      if (c.state === 0) continue
      f.globalAlpha = c.alpha
      if (c.state === 1 || c.state === 3) {
        // tumbling on its way down
        const tilt = [0, 45, 90, 135][Math.floor((c.tilt0 + now * 0.25) / 45) % 4]
        const sp = beadSprite(c.hex, c.finish, tilt, 40)
        const s = S * 1.25
        f.drawImage(sp, c.x - s / 2, c.y - s / 2, s, s)
        continue
      }
      const le = now - c.landedAt
      let sx = 1
      let sy = 1
      if (le < 420) {
        const k = Math.exp(-le / 110) * Math.cos(le / 38)
        sx = 1 + 0.18 * k
        sy = 1 - 0.18 * k
      }
      const pe = now - c.pulseAt
      const pulse = pe > 0 && pe < 520 ? Math.sin((pe / 520) * Math.PI) * 0.3 : 0
      const k = 1 + c.lift * 0.22 + pulse
      const sp = beadSprite(c.hex, c.finish, 0, 48)
      const s = S * k
      f.drawImage(sp, c.tx - (s * sx) / 2, c.ty - (s * sy) / 2 - c.lift * cw * 0.15, s * sx, s * sy)
      if (le < 300 && this.o.theme === "dark") {
        f.globalAlpha = (1 - le / 300) * 0.3
        f.strokeStyle = "#ffe9c7"
        f.lineWidth = 1
        f.beginPath()
        f.arc(c.tx, c.ty, cw * (0.5 + le / 260), 0, Math.PI * 2)
        f.stroke()
      }
    }
    f.globalAlpha = 1
    this.drawLoupe(f, S)
    for (const d of this.drops) if (d.layer === "front") this.drawDrop(f, d)
    f.globalAlpha = 1
  }

  /** Magnifying glass over the loom, so the 63-bead band can be seen up close. */
  private drawLoupe(f: CanvasRenderingContext2D, S: number) {
    const { x: px, y: py } = this.pointer
    const lr = this.loomRect
    const pad = this.cw * 2
    if (px < lr.x - pad || px > lr.x + lr.w + pad || py < lr.y - pad || py > lr.y + lr.h + pad) return
    const R = Math.max(54, Math.min(84, this.w * 0.06))
    const Z = 3
    f.save()
    f.beginPath()
    f.arc(px, py, R, 0, Math.PI * 2)
    f.closePath()
    f.shadowColor = "rgba(0,0,0,0.45)"
    f.shadowBlur = 24
    f.fillStyle = this.o.theme === "dark" ? "#2a1a13" : "#efe6da"
    f.fill()
    f.shadowBlur = 0
    f.clip()
    // warp threads under the beads
    f.strokeStyle = this.o.theme === "dark" ? "rgba(255,244,230,0.25)" : "rgba(74,46,34,0.2)"
    f.lineWidth = 1
    f.beginPath()
    for (let r = 0; r <= this.rows; r++) {
      const yy = py + (lr.y + r * this.ch - py) * Z
      f.moveTo(px - R, yy)
      f.lineTo(px + R, yy)
    }
    f.stroke()
    const reach = R / Z + this.cw
    for (const c of this.cells) {
      if (c.state !== 2) continue
      if (Math.abs(c.tx - px) > reach || Math.abs(c.ty - py) > reach) continue
      const sp = beadSprite(c.hex, c.finish, 0, 96)
      const s = S * Z
      const cx = px + (c.tx - px) * Z
      const cy = py + (c.ty - py) * Z
      f.drawImage(sp, cx - s / 2, cy - s / 2, s, s)
    }
    f.restore()
    // glass rim
    f.save()
    f.beginPath()
    f.arc(px, py, R, 0, Math.PI * 2)
    f.lineWidth = 2
    f.strokeStyle = "rgba(255,255,255,0.55)"
    f.stroke()
    f.beginPath()
    f.arc(px, py, R - 4, Math.PI * 1.1, Math.PI * 1.45)
    f.lineWidth = 3
    f.strokeStyle = "rgba(255,255,255,0.35)"
    f.stroke()
    f.restore()
  }
}
