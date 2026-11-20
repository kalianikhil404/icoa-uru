import "server-only"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

/* ------------------------------------------------------------------
   Where the shop keeps its records (orders, customers, subscribers,
   visitors, email settings).

   • On your computer: plain files in the "data" and "orders" folders.
   • Online (Vercel): files can't be saved there, so it uses a free
     Upstash Redis database. In Vercel: Storage → Upstash (Redis) →
     connect it to the project. That adds KV_REST_API_URL and
     KV_REST_API_TOKEN automatically. Put the same two lines in
     .env.local to see your online orders on this computer too.
------------------------------------------------------------------- */

type Doc = Record<string, unknown>

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const useRedis = !!(REDIS_URL && REDIS_TOKEN)

const ROOT = process.cwd()
/** Read-only hosting with no database: keep things in /tmp so nothing crashes (they won't last). */
const ephemeral = !useRedis && !!process.env.VERCEL
const BASE = ephemeral ? path.join(os.tmpdir(), "icoa-data") : ROOT
const dirFor = (collection: string) => (collection === "orders" ? path.join(BASE, "orders") : path.join(BASE, "data", collection))

export const storageInfo = () => ({
  kind: useRedis ? ("database" as const) : ephemeral ? ("temporary" as const) : ("files" as const),
  where: useRedis ? "Upstash Redis database" : ephemeral ? "temporary storage (not kept)" : "the data and orders folders on this computer",
})

/* ---------------- Upstash Redis over its REST API (no extra package) ---------------- */

async function redis<T = unknown>(...command: (string | number)[]): Promise<T> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command.map(String)),
    cache: "no-store",
  })
  const data = (await res.json().catch(() => ({}))) as { result?: T; error?: string }
  if (!res.ok || data.error) throw new Error(`Database error: ${data.error ?? res.status}`)
  return data.result as T
}

const safeId = (id: string) => {
  if (!/^[\w.@+-]{1,160}$/.test(id)) throw new Error("Bad id")
  return id
}
const fileId = (id: string) => encodeURIComponent(safeId(id)).replace(/%/g, "_")

/* ---------------- collections: one record per id ---------------- */

export function collection<T extends Doc>(name: string) {
  const key = `iu:c:${name}`
  return {
    async get(id: string): Promise<T | null> {
      if (useRedis) {
        const raw = await redis<string | null>("HGET", key, safeId(id))
        return raw ? (JSON.parse(raw) as T) : null
      }
      try {
        return JSON.parse(await fs.readFile(path.join(dirFor(name), `${fileId(id)}.json`), "utf8")) as T
      } catch {
        return null
      }
    },
    async put(id: string, doc: T) {
      if (useRedis) {
        await redis("HSET", key, safeId(id), JSON.stringify(doc))
        return
      }
      const dir = dirFor(name)
      await fs.mkdir(dir, { recursive: true })
      const file = path.join(dir, `${fileId(id)}.json`)
      const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
      await fs.writeFile(tmp, JSON.stringify(doc, null, 2))
      await fs.rename(tmp, file)
    },
    async remove(id: string) {
      if (useRedis) {
        await redis("HDEL", key, safeId(id))
        return
      }
      await fs.rm(path.join(dirFor(name), `${fileId(id)}.json`), { force: true })
    },
    async all(): Promise<T[]> {
      if (useRedis) {
        const vals = await redis<string[]>("HVALS", key)
        return (vals ?? []).map((v) => JSON.parse(v) as T)
      }
      const dir = dirFor(name)
      const files = await fs.readdir(dir).catch(() => [] as string[])
      const out: T[] = []
      for (const f of files) {
        if (!f.endsWith(".json")) continue
        try {
          out.push(JSON.parse(await fs.readFile(path.join(dir, f), "utf8")) as T)
        } catch {
          /* skip a damaged file */
        }
      }
      return out
    },
    /** Read, change and save one record. */
    async update(id: string, change: (current: T | null) => T | null) {
      const next = change(await this.get(id))
      if (next) await this.put(id, next)
      return next
    },
  }
}

/* ---------------- settings: small named values ---------------- */

export async function getSetting<T>(name: string, fallback: T): Promise<T> {
  const v = await collection<{ value: T }>("settings").get(name)
  return v ? v.value : fallback
}
export async function setSetting<T>(name: string, value: T) {
  await collection<{ value: T }>("settings").put(name, { value } as { value: T })
}

/* ---------------- event log (visitor activity) ---------------- */

const MAX_EVENTS = 40000

export const events = {
  async add(e: Doc) {
    if (useRedis) {
      await redis("LPUSH", "iu:events", JSON.stringify(e))
      await redis("LTRIM", "iu:events", 0, MAX_EVENTS - 1)
      return
    }
    const day = new Date().toISOString().slice(0, 10)
    const dir = path.join(BASE, "data", "events")
    await fs.mkdir(dir, { recursive: true })
    await fs.appendFile(path.join(dir, `${day}.jsonl`), JSON.stringify(e) + "\n")
  },
  /** Events from the last `days` days, newest first. */
  async recent(days = 30, limit = MAX_EVENTS): Promise<Doc[]> {
    const since = Date.now() - days * 86400000
    if (useRedis) {
      const raw = await redis<string[]>("LRANGE", "iu:events", 0, limit - 1)
      return (raw ?? []).map((r) => JSON.parse(r) as Doc).filter((e) => Number(e.t) >= since)
    }
    const dir = path.join(BASE, "data", "events")
    const files = (await fs.readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith(".jsonl")).sort().reverse()
    const out: Doc[] = []
    for (const f of files) {
      if (new Date(f.slice(0, 10)).getTime() < since - 86400000) break
      const lines = (await fs.readFile(path.join(dir, f), "utf8")).split("\n").filter(Boolean).reverse()
      for (const l of lines) {
        try {
          const e = JSON.parse(l) as Doc
          if (Number(e.t) >= since) out.push(e)
        } catch {
          /* skip */
        }
        if (out.length >= limit) return out
      }
    }
    return out
  },
}
