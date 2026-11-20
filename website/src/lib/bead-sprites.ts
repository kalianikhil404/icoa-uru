"use client"

/* Browser helpers around the seed bead renderer: cached sprites
   (canvases / image URLs) and the pre-rendered tumbling-bead atlas. */

import { buildGeometry, shadeBead, type BeadGeometry, type Finish } from "@/lib/seed-bead"
import { ATLAS } from "@/lib/bead-atlas"

export { ATLAS }

let atlasPromise: Promise<HTMLImageElement> | null = null
export function loadAtlas() {
  if (!atlasPromise) {
    atlasPromise = new Promise((resolve, reject) => {
      const img = new Image()
      img.decoding = "async"
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = ATLAS.src
    })
  }
  return atlasPromise
}

/* ---------- live sprites for any colour ---------- */
const geomCache = new Map<string, BeadGeometry>()
const spriteCache = new Map<string, HTMLCanvasElement>()
const urlCache = new Map<string, string>()

function geometry(size: number, tilt: number) {
  const key = `${size}|${tilt}`
  let g = geomCache.get(key)
  if (!g) {
    g = buildGeometry(size, tilt, 2)
    geomCache.set(key, g)
  }
  return g
}

/** A seed bead sprite (square canvas). tilt 0 = side view as woven on a loom. */
export function beadSprite(hex: string, finish: Finish = "opaque", tilt = 0, size = 48) {
  const key = `${hex}|${finish}|${tilt}|${size}`
  let c = spriteCache.get(key)
  if (!c) {
    c = document.createElement("canvas")
    c.width = c.height = size
    const data = shadeBead(geometry(size, tilt), hex, finish)
    c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(data), size, size), 0, 0)
    spriteCache.set(key, c)
  }
  return c
}

/** Same sprite as a data URL, for CSS backgrounds. */
export function beadSpriteUrl(hex: string, finish: Finish = "opaque", tilt = 0, size = 48) {
  const key = `${hex}|${finish}|${tilt}|${size}`
  let u = urlCache.get(key)
  if (!u) {
    u = beadSprite(hex, finish, tilt, size).toDataURL("image/png")
    urlCache.set(key, u)
  }
  return u
}

/** In a side-view sprite, the bead fills this share of the sprite's width and height. */
export const SIDE_BEAD = { w: 2 / 2.2, h: 1.3 / 2.2 }
