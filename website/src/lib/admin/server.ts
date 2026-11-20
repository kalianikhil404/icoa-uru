import "server-only"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { NextResponse } from "next/server"

/* Everything the website editor (/admin) needs on the computer side:
   reading and saving the content files, saved versions, and who may edit. */

export const CONTENT_FILES = {
  products: "products.json",
  collections: "collections.json",
  faqs: "faqs.json",
  testimonials: "testimonials.json",
  settings: "settings.json",
  home: "home.json",
  about: "about.json",
  pages: "pages.json",
  theme: "theme.json",
  beadColors: "bead-colors.json",
} as const
export type ContentName = keyof typeof CONTENT_FILES
export const isContentName = (n: unknown): n is ContentName => typeof n === "string" && n in CONTENT_FILES

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, "src", "content")
const HISTORY_DIR = path.join(ROOT, ".history")
const MAX_VERSIONS = 60

/* ---------------- access ---------------- */

export const editorEnabled = () => process.env.NODE_ENV !== "production" || process.env.ENABLE_EDITOR === "true"

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "::ffff:127.0.0.1"])
const hostName = (host: string) => host.replace(/:\d+$/, "").toLowerCase()

export type Access = "ok" | "password" | "local-only" | "off"

/** The computer running the website can always get in. Other devices on the WiFi, and the
    live website, need the ADMIN_PASSWORD (from .env.local, or Vercel's environment variables).
    The website editor (content) only works where the files can be saved: on your computer. */
export function accessFor(headers: Headers, opts: { editor?: boolean } = {}): Access {
  if (opts.editor && !editorEnabled()) return "off"
  const host = hostName(headers.get("host") ?? "")
  const client = (headers.get("x-forwarded-for") ?? "").split(",")[0].trim()
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    if (LOOPBACK.has(host) && (!client || LOOPBACK.has(client))) return "ok"
  }
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return "local-only"
  const cookie = headers.get("cookie") ?? ""
  const sent = headers.get("x-admin-password") ?? decodeURIComponent(/(?:^|;\s*)iu_admin=([^;]+)/.exec(cookie)?.[1] ?? "")
  return sent === pw ? "ok" : "password"
}

/** Use at the top of every control-center API route: returns a response if the request is not allowed. */
export function denied(request: Request, opts: { editor?: boolean } = {}) {
  const a = accessFor(request.headers, opts)
  if (a === "ok") return null
  return NextResponse.json(
    {
      error:
        a === "off"
          ? "The website editor only works on your computer. Edit there, then publish again."
          : a === "password"
            ? "Enter the admin password first."
            : "This only works on the computer that runs the website, unless an ADMIN_PASSWORD is set.",
    },
    { status: a === "off" ? 404 : 403 }
  )
}

/* ---------------- content ---------------- */

const fileFor = (name: ContentName) => path.join(CONTENT_DIR, CONTENT_FILES[name])

export async function readContent(name: ContentName) {
  return JSON.parse(await fs.readFile(fileFor(name), "utf8"))
}

export async function readAllContent() {
  const entries = await Promise.all(
    (Object.keys(CONTENT_FILES) as ContentName[]).map(async (n) => [n, await readContent(n)] as const)
  )
  return Object.fromEntries(entries) as Record<ContentName, unknown>
}

/** Writes safely: to a temporary file first, then swaps it in, so a half-written file never exists. */
export async function writeContent(name: ContentName, data: unknown) {
  const file = fileFor(name)
  const text = JSON.stringify(data, null, 2) + "\n"
  const current = await fs.readFile(file, "utf8").catch(() => "")
  if (current === text) return false
  const tmp = `${file}.${process.pid}.tmp`
  await fs.writeFile(tmp, text, "utf8")
  await fs.rename(tmp, file)
  return true
}

/* ---------------- saved versions (.history folder) ---------------- */

export type Version = { id: string; label: string; createdAt: string; auto: boolean }

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)

export async function listVersions(): Promise<Version[]> {
  const dirs = await fs.readdir(HISTORY_DIR).catch(() => [] as string[])
  const out: Version[] = []
  for (const d of dirs) {
    try {
      const meta = JSON.parse(await fs.readFile(path.join(HISTORY_DIR, d, "version.json"), "utf8"))
      out.push({ id: d, label: meta.label, createdAt: meta.createdAt, auto: !!meta.auto })
    } catch {
      /* not a version folder */
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function saveVersion(label: string, auto = false): Promise<Version> {
  const createdAt = new Date().toISOString()
  const id = `${createdAt.replace(/[:.]/g, "-")}${label ? `_${slugify(label)}` : ""}`
  const dir = path.join(HISTORY_DIR, id)
  await fs.mkdir(dir, { recursive: true })
  for (const n of Object.keys(CONTENT_FILES) as ContentName[]) {
    await fs.copyFile(fileFor(n), path.join(dir, CONTENT_FILES[n]))
  }
  const v = { id, label: label || "Saved version", createdAt, auto }
  await fs.writeFile(path.join(dir, "version.json"), JSON.stringify(v, null, 2))
  await pruneVersions()
  return v
}

/** Keeps the newest versions; automatic ones are removed first. */
async function pruneVersions() {
  const all = await listVersions()
  if (all.length <= MAX_VERSIONS) return
  const removable = [...all.filter((v) => v.auto), ...all.filter((v) => !v.auto)].reverse()
  for (const v of removable.slice(0, all.length - MAX_VERSIONS)) {
    await fs.rm(path.join(HISTORY_DIR, v.id), { recursive: true, force: true }).catch(() => {})
  }
}

export async function restoreVersion(id: string) {
  if (!/^[\w.-]+$/.test(id)) throw new Error("Unknown version")
  const dir = path.join(HISTORY_DIR, id)
  await fs.access(path.join(dir, "version.json"))
  await saveVersion("Before restoring an older version", true)
  for (const n of Object.keys(CONTENT_FILES) as ContentName[]) {
    const src = path.join(dir, CONTENT_FILES[n])
    const data = JSON.parse(await fs.readFile(src, "utf8").catch(() => "null"))
    if (data !== null) await writeContent(n, data)
  }
}

let sessionCheckpoint: Promise<unknown> | null = null
/** One automatic checkpoint each time the website is started, before any edits. */
export function checkpointOnce() {
  sessionCheckpoint ??= saveVersion("When the editor was opened", true).catch(() => null)
  return sessionCheckpoint
}

/* ---------------- uploads ---------------- */

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
}

export async function saveUpload(file: File, folder: string) {
  const type = file.type || ""
  if (/heic|heif/i.test(type) || /\.hei[cf]$/i.test(file.name)) {
    throw new Error("iPhone HEIC photos can't be shown on websites. Save it as JPG first (or set Camera → Formats → Most Compatible).")
  }
  const ext = IMAGE_TYPES[type]
  if (!ext) throw new Error("Choose a JPG, PNG or WEBP photo, or an MP4 video.")
  if (file.size > 80 * 1024 * 1024) throw new Error("That file is over 80 MB. Choose a smaller one.")

  const safeFolder = folder
    .split("/")
    .map(slugify)
    .filter(Boolean)
    .join("/") || "uploads"
  const dir = path.join(ROOT, "public", "images", safeFolder)
  await fs.mkdir(dir, { recursive: true })
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "photo"
  const stamp = Date.now().toString(36)
  let buf: Buffer = Buffer.from(await file.arrayBuffer())
  let outExt = ext

  // Photos are resized to a sensible size and saved as WEBP when possible.
  if (type.startsWith("image/") && type !== "image/gif") {
    try {
      const sharp = (await import("sharp")).default
      buf = await sharp(buf).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toBuffer()
      outExt = "webp"
    } catch {
      /* sharp not available: keep the original file */
    }
  }
  const name = `${base}-${stamp}.${outExt}`
  await fs.writeFile(path.join(dir, name), buf)
  return `/images/${safeFolder}/${name}`
}

/* ---------------- this computer on the WiFi ---------------- */

export function wifiAddresses() {
  const out: { name: string; address: string }[] = []
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === "IPv4" && !net.internal && !net.address.startsWith("169.254.")) out.push({ name, address: net.address })
    }
  }
  // Real WiFi / Ethernet adapters first, virtual ones (VirtualBox, WSL, Docker) last
  const virtual = /virtual|vbox|vmware|wsl|docker|vethernet|hyper-v|loopback|bridge|tailscale|zerotier/i
  return out.sort((a, b) => Number(virtual.test(a.name)) - Number(virtual.test(b.name)))
}

export function serverPort(headers: Headers) {
  const m = /:(\d+)$/.exec(headers.get("host") ?? "")
  return m ? Number(m[1]) : Number(process.env.PORT || 3000)
}
