/* =====================================================================
   SEED BEAD RENDERER
   A small 3D model of a Miyuki 11/0 round rocaille (2.0 mm across,
   1.3 mm tall, 0.8 mm hole), ray-marched once per viewing angle and then
   coloured with real glass finishes. Pure math: no DOM, so the same code
   runs in the browser and in tests.
   ===================================================================== */

export type Finish = "opaque" | "transparent" | "silverlined" | "metallic" | "matte" | "luster"

export const FINISHES: Finish[] = ["opaque", "transparent", "silverlined", "metallic", "matte", "luster"]

/** Per-pixel geometry for one viewing angle (hi-res, before anti-aliasing). */
export type BeadGeometry = {
  size: number // output size in px
  ss: number // supersampling factor
  /** 8 floats per hi-res pixel: alpha, nx, ny, nz, ao, thickness, core, depth */
  buf: Float32Array
}

/* ---------- shape ---------- */
const RX = 1
const RY = 0.72
const SLAB = 0.65 // half height: 1.3 mm of a 2.0 mm bead
const HOLE = 0.4 // hole radius: 0.8 mm of a 2.0 mm bead

function smax(a: number, b: number, k: number) {
  const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (a - b)) / k))
  return b * (1 - h) + a * h + k * h * (1 - h)
}

/** Signed distance to the bead, in bead space (hole along +y). */
function sdf(x: number, y: number, z: number) {
  const px = x / RX
  const py = y / RY
  const pz = z / RX
  const k0 = Math.sqrt(px * px + py * py + pz * pz)
  const qx = x / (RX * RX)
  const qy = y / (RY * RY)
  const qz = z / (RX * RX)
  const k1 = Math.sqrt(qx * qx + qy * qy + qz * qz) || 1e-6
  const ell = (k0 * (k0 - 1)) / k1
  const slab = Math.abs(y) - SLAB
  const body = smax(ell, slab, 0.14)
  const hole = HOLE - Math.sqrt(x * x + z * z)
  return smax(body, hole, 0.09)
}

/**
 * Ray-march the bead for one tilt.
 * tilt 0°  = hole axis vertical (seen from the side, like beads on a loom)
 * tilt 90° = hole pointing at you (you see the ring and the hole)
 */
export function buildGeometry(size: number, tiltDeg: number, ss = 2): BeadGeometry {
  const N = size * ss
  const buf = new Float32Array(N * N * 8)
  const a = (tiltDeg * Math.PI) / 180
  const ca = Math.cos(a)
  const sa = Math.sin(a)
  const E = 1.1 // half-extent of the view in bead units
  // world -> bead: rotate by -a about x
  const toBead = (x: number, y: number, z: number): [number, number, number] => [x, y * ca + z * sa, -y * sa + z * ca]
  const f = (x: number, y: number, z: number) => {
    const p = toBead(x, y, z)
    return sdf(p[0], p[1], p[2])
  }

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const sx = ((i + 0.5) / N) * 2 * E - E
      const sy = E - ((j + 0.5) / N) * 2 * E
      const o = (j * N + i) * 8
      if (sx * sx + sy * sy > 1.06) continue
      // march from z = +2 towards -z
      const z0 = Math.sqrt(Math.max(0, 1.08 - sx * sx - sy * sy)) + 0.02
      let t = 0
      let hit = false
      let z = z0
      for (let s = 0; s < 90; s++) {
        z = z0 - t
        const d = f(sx, sy, z)
        if (d < 0.0012) {
          hit = true
          break
        }
        t += Math.max(d * 0.8, 0.002)
        if (t > 2 * z0 + 0.1) break
      }
      if (!hit) continue
      // normal (world space, via central differences)
      const e = 0.0025
      let nx = f(sx + e, sy, z) - f(sx - e, sy, z)
      let ny = f(sx, sy + e, z) - f(sx, sy - e, z)
      let nz = f(sx, sy, z + e) - f(sx, sy, z - e)
      const nl = Math.hypot(nx, ny, nz) || 1
      nx /= nl
      ny /= nl
      nz /= nl
      // ambient occlusion
      let occ = 0
      for (let k = 1; k <= 4; k++) {
        const h = 0.05 * k
        occ += (h - f(sx + nx * h, sy + ny * h, z + nz * h)) * Math.pow(0.5, k)
      }
      const ao = Math.min(1, Math.max(0, 1 - 2.6 * occ))
      // thickness of glass along the ray + how close it passes the hole lining
      let thick = 0
      let minRho = 9
      let zz = z - 0.01
      for (let s = 0; s < 40; s++) {
        const p = toBead(sx, sy, zz)
        const d = sdf(p[0], p[1], p[2])
        const rho = Math.hypot(p[0], p[2])
        if (rho < minRho) minRho = rho
        if (d > 0.002) break
        const st = Math.max(-d * 0.9, 0.03)
        zz -= st
        thick += st
      }
      const core = 1 - Math.min(1, Math.max(0, (minRho - HOLE) / 0.22))
      buf[o] = 1
      buf[o + 1] = nx
      buf[o + 2] = ny
      buf[o + 3] = nz
      buf[o + 4] = ao
      buf[o + 5] = thick
      buf[o + 6] = core
      buf[o + 7] = z
    }
  }
  return { size, ss, buf }
}

/* ---------- colour ---------- */
const toLin = (c: number) => Math.pow(c / 255, 2.2)
const toSrgb = (c: number) => Math.round(255 * Math.pow(Math.min(1, Math.max(0, c)), 1 / 2.2))

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "")
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// lights (world space, y up, viewer at +z)
const L = norm(-0.5, 0.72, 0.55)
const L2 = norm(0.7, -0.25, 0.65)
function norm(x: number, y: number, z: number): [number, number, number] {
  const l = Math.hypot(x, y, z)
  return [x / l, y / l, z / l]
}

/** Studio environment seen in reflections: bright softbox above, darker below. */
function env(rx: number, ry: number, rz: number) {
  const sky = Math.min(1, Math.max(0, (ry + 0.25) / 1.1))
  const soft = Math.pow(Math.max(0, rx * L[0] + ry * L[1] + rz * L[2]), 24) * 2.2
  const strip = Math.pow(Math.max(0, rx * L2[0] + ry * L2[1] + rz * L2[2]), 30) * 0.6
  return 0.08 + 0.75 * sky * sky + soft + strip
}

/** Colour a geometry with a bead colour + finish. Returns RGBA (size × size). */
export function shadeBead(g: BeadGeometry, hex: string, finish: Finish): Uint8ClampedArray {
  const { size, ss, buf } = g
  const N = size * ss
  const [r8, g8, b8] = hexToRgb(hex)
  const base = [toLin(r8), toLin(g8), toLin(b8)]
  const out = new Uint8ClampedArray(size * size * 4)
  const acc = new Float32Array(4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      acc.fill(0)
      for (let sj = 0; sj < ss; sj++) {
        for (let si = 0; si < ss; si++) {
          const o = ((y * ss + sj) * N + (x * ss + si)) * 8
          if (buf[o] === 0) continue
          const nx = buf[o + 1]
          const ny = buf[o + 2]
          const nz = buf[o + 3]
          const ao = buf[o + 4]
          const thick = buf[o + 5]
          const core = buf[o + 6]
          const ndl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2])
          const ndl2 = Math.max(0, nx * L2[0] + ny * L2[1] + nz * L2[2])
          const ndv = Math.max(0, nz)
          // reflection of the view ray
          const rx = 2 * ndv * nx
          const ry = 2 * ndv * ny
          const rz = 2 * ndv * nz - 1
          const e = env(rx, ry, rz)
          const fres = 0.04 + 0.96 * Math.pow(1 - ndv, 5)
          const rl = Math.max(0, rx * L[0] + ry * L[1] + rz * L[2])
          const rl2 = Math.max(0, rx * L2[0] + ry * L2[1] + rz * L2[2])
          let spec = Math.pow(rl, 160) * 2.4 + Math.pow(rl, 30) * 0.18 + Math.pow(rl2, 80) * 0.4
          let c0 = 0
          let c1 = 0
          let c2 = 0
          const aoS = 0.35 + 0.65 * ao
          for (let k = 0; k < 3; k++) {
            const b = base[k]
            let c: number
            if (finish === "metallic") {
              c = b * (0.12 + 1.25 * e) * aoS + spec * (0.5 + b)
            } else if (finish === "matte") {
              c = b * (0.24 * aoS + 0.78 * ndl * aoS + 0.12 * ndl2) + 0.03 * e
              spec = 0
            } else if (finish === "transparent" || finish === "silverlined") {
              const trans = Math.pow(Math.max(b, 0.002), 0.6 + thick * 0.9)
              const through = 0.25 + 0.75 * (1 - ndl) // light travels through to the shadow side
              let body = b * 0.18 * aoS + trans * 0.95 * through * aoS
              if (finish === "silverlined") {
                const lining = core * (0.55 + 0.7 * ndl + 0.35 * (1 - ndv))
                body += lining * (b * 0.9 + 0.12) * 1.15
              }
              c = body * (1 - fres) + e * fres * 1.1 + spec * 1.15
            } else {
              // opaque & luster
              const diff = b * (0.2 * aoS + 0.9 * ndl * Math.sqrt(ao) + 0.16 * ndl2)
              c = diff * (1 - fres) + e * fres * 0.95 + spec
              if (finish === "luster") c += 0.1 * Math.pow(1 - ndv, 1.5) * (k === 1 ? 0.92 : 1) + 0.05 * e
            }
            if (k === 0) c0 = c
            else if (k === 1) c1 = c
            else c2 = c
          }
          // gentle highlight roll-off
          const tm = (v: number) => v / (1 + 0.18 * v)
          acc[0] += tm(c0)
          acc[1] += tm(c1)
          acc[2] += tm(c2)
          acc[3] += 1
        }
      }
      const cov = acc[3] / (ss * ss)
      const p = (y * size + x) * 4
      if (acc[3] > 0) {
        out[p] = toSrgb(acc[0] / acc[3])
        out[p + 1] = toSrgb(acc[1] / acc[3])
        out[p + 2] = toSrgb(acc[2] / acc[3])
      }
      out[p + 3] = Math.round(cov * 255)
    }
  }
  return out
}

/** Tilt angles used for tumbling beads (0 = side view, 90 = hole facing you). */
export const TILTS = Array.from({ length: 16 }, (_, i) => (i * 180) / 16)
