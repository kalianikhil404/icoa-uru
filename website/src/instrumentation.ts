/* Runs once when the website starts. On your computer it checks every few
   minutes whether the automatic newsletter is due, by calling /api/cron.
   (Online, Vercel calls /api/cron once a day; see vercel.json.) */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.VERCEL || process.env.NEXT_PHASE === "phase-production-build") return
  const g = globalThis as unknown as { __icoaScheduler?: boolean }
  if (g.__icoaScheduler) return
  g.__icoaScheduler = true
  const port = process.env.PORT || "3000"
  const headers: Record<string, string> = process.env.CRON_SECRET ? { authorization: `Bearer ${process.env.CRON_SECRET}` } : {}
  const tick = () =>
    fetch(`http://127.0.0.1:${port}/api/cron`, { headers, cache: "no-store" })
      .then((r) => r.json())
      .then((r: { ran?: boolean; sent?: number; total?: number }) => {
        if (r?.ran) console.log(`[newsletter] sent to ${r.sent} of ${r.total} subscribers`)
      })
      .catch(() => {})
  setTimeout(tick, 45_000)
  setInterval(tick, 5 * 60_000)
}
