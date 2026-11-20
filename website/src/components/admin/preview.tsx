"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { ArrowLeft, ExternalLink, Laptop, RotateCw, Smartphone } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const DESKTOP_W = 1280
const PHONE = { w: 390, h: 844 }

/** The live website, shown next to the editor. It updates by itself a moment after each change is saved. */
export function Preview({ path, reloadSignal, saved = true }: { path: string; reloadSignal: number; saved?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 })
  const [shown, setShown] = useState(path)
  const [draft, setDraft] = useState<string | null>(null)
  const [initial] = useState(path)
  const scrollAfterLoad = useRef<number | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setBoxSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ready = boxSize.w > 0
  // follow the section being edited (once the change is saved, so new pages exist).
  // replace() keeps the preview out of the browser's Back button history.
  useEffect(() => {
    const w = frame.current?.contentWindow
    if (!w || !saved) return
    try {
      const now = w.location.pathname + w.location.hash
      if (now !== path) w.location.replace(path)
    } catch {
      if (frame.current) frame.current.src = path
    }
  }, [path, ready, saved])

  // full reload when asked (e.g. after going back to an older version)
  useEffect(() => {
    if (!reloadSignal) return
    reload()
  }, [reloadSignal])

  // keep the address bar in sync with clicks inside the preview
  useEffect(() => {
    const t = setInterval(() => {
      try {
        const l = frame.current?.contentWindow?.location
        if (l) setShown(l.pathname + l.search + l.hash)
      } catch {
        /* not loaded yet */
      }
    }, 400)
    return () => clearInterval(t)
  }, [])

  function reload() {
    const w = frame.current?.contentWindow
    if (!w) return
    scrollAfterLoad.current = w.scrollY
    w.location.reload()
  }
  function onLoad() {
    const y = scrollAfterLoad.current
    if (y == null) return
    scrollAfterLoad.current = null
    const w = frame.current?.contentWindow
    setTimeout(() => w?.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }), 350)
  }
  function go(p: string) {
    const target = p.startsWith("/") ? p : `/${p}`
    frame.current?.contentWindow?.location.replace(target)
  }

  const pad = 24
  const scale =
    device === "desktop"
      ? Math.min(1, Math.max(0.2, (boxSize.w - pad) / DESKTOP_W))
      : Math.min(1, Math.max(0.2, (boxSize.h - pad * 2) / PHONE.h), (boxSize.w - pad) / PHONE.w)
  const frameW = device === "desktop" ? DESKTOP_W : PHONE.w
  const frameH = device === "desktop" ? Math.max(400, (boxSize.h - pad) / scale) : PHONE.h

  const btn = "grid size-8 place-items-center rounded-lg text-cocoa/70 transition-colors hover:bg-white hover:text-cocoa"

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#e9e2d8]">
      <div className="flex items-center gap-1 border-b border-cocoa/10 px-3 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Back" className={btn} onClick={() => frame.current?.contentWindow?.history.back()}>
              <ArrowLeft className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Reload preview" className={btn} onClick={reload}>
              <RotateCw className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Reload preview</TooltipContent>
        </Tooltip>
        <form
          className="mx-1 flex min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            if (draft != null) go(draft)
            setDraft(null)
          }}
        >
          <input
            aria-label="Page address"
            value={draft ?? shown}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => setDraft(null)}
            spellCheck={false}
            className="h-8 w-full min-w-0 rounded-lg bg-white/70 px-3 font-mono text-xs text-cocoa outline-none focus:bg-white focus:ring-2 focus:ring-lagoon/30"
          />
        </form>
        <div className="flex rounded-lg bg-white/60 p-0.5" role="radiogroup" aria-label="Preview size">
          {(
            [
              ["desktop", Laptop, "Computer"],
              ["mobile", Smartphone, "Phone"],
            ] as const
          ).map(([id, Icon, label]) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={device === id}
                  aria-label={label}
                  onClick={() => setDevice(id)}
                  className={cn("relative grid h-7 w-8 place-items-center rounded-md", device === id ? "text-white" : "text-cocoa/70")}
                >
                  {device === id && <motion.span layoutId="device-pill" className="absolute inset-0 rounded-md bg-cocoa" transition={{ duration: 0.25 }} />}
                  <Icon className="relative size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <a href={shown} target="_blank" rel="noreferrer" aria-label="Open in a new tab" className={btn}>
              <ExternalLink className="size-4" />
            </a>
          </TooltipTrigger>
          <TooltipContent>Open in a new tab</TooltipContent>
        </Tooltip>
      </div>

      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden">
        {ready && (
          <div
            className={cn(
              "absolute top-3 left-1/2 origin-top overflow-hidden bg-white transition-[width,height,border-radius] duration-300",
              device === "mobile" ? "rounded-[36px] shadow-[0_0_0_10px_#2a1b14,0_30px_60px_-20px_rgba(0,0,0,0.5)]" : "rounded-xl shadow-[0_20px_50px_-24px_rgba(60,35,20,0.45)]"
            )}
            style={{ width: frameW, height: frameH, transform: `translateX(-50%) scale(${scale})`, marginTop: device === "mobile" ? 12 : 0 }}
          >
            <iframe ref={frame} src={initial} title="Website preview" onLoad={onLoad} className="size-full border-0" />
          </div>
        )}
      </div>
    </div>
  )
}
