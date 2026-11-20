"use client"

import { useState } from "react"
import { BookmarkPlus, History, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useEditor } from "./store"

type Version = { id: string; label: string; createdAt: string; auto: boolean }

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })

/** Saves a named copy of the whole website's content that you can go back to later. */
export function SaveVersionButton() {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    await useEditor.getState().saveNow()
    const res = await fetch("/api/admin/versions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label }) })
    setBusy(false)
    if (!res.ok) return toast.error("Couldn't save the version.")
    toast.success(label ? `Saved "${label}"` : "Version saved", { description: "Find it under Versions." })
    setLabel("")
    setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-cocoa px-3 text-sm text-white hover:bg-espresso">
          <BookmarkPlus className="size-4" /> <span className="hidden sm:inline">Save version</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <p className="font-medium text-cocoa">Save a version</p>
          <p className="mt-0.5 text-sm text-muted-foreground">A copy of everything as it is now. Your changes already save by themselves; this is a bookmark you can go back to.</p>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            placeholder="Name it, e.g. Before the holiday sale"
            className="mt-3 h-10 w-full rounded-xl border border-cocoa/15 px-3 text-sm outline-none focus:border-lagoon focus:ring-4 focus:ring-lagoon/15"
          />
          <button type="submit" disabled={busy} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-lagoon text-sm font-medium text-white hover:bg-lagoon-deep disabled:opacity-60">
            {busy && <Loader2 className="size-4 animate-spin" />} Save version
          </button>
        </form>
      </PopoverContent>
    </Popover>
  )
}

/** Lists saved versions; going back to one first saves the current state, so it can be undone. */
export function VersionsSheet({ onRestored }: { onRestored: () => Promise<void> | void }) {
  const [versions, setVersions] = useState<Version[] | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const refresh = async () => {
    const res = await fetch("/api/admin/versions", { cache: "no-store" })
    setVersions(res.ok ? await res.json() : [])
  }
  const restore = async (v: Version) => {
    setBusy(v.id)
    await useEditor.getState().saveNow()
    const res = await fetch("/api/admin/versions", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: v.id }) })
    setBusy(null)
    setConfirm(null)
    if (!res.ok) return toast.error("Couldn't go back to that version.")
    await onRestored()
    await refresh()
    toast.success(`Back to "${v.label}"`, { description: "What you had a moment ago was saved as a version too." })
  }

  return (
    <Sheet onOpenChange={(o) => o && void refresh()}>
      <SheetTrigger asChild>
        <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm hover:bg-sand">
          <History className="size-4" /> <span className="hidden sm:inline">Versions</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto bg-porcelain sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl font-normal text-cocoa">Versions</SheetTitle>
          <SheetDescription>
            Copies of the whole website. A version is saved automatically each time the editor opens, and whenever you press Save version.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {!versions ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-sand/70" />
              ))}
            </div>
          ) : !versions.length ? (
            <p className="rounded-2xl border border-dashed border-cocoa/20 p-6 text-center text-sm text-muted-foreground">No versions yet. Press Save version to make one.</p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li key={v.id} className={cn("rounded-2xl border bg-white p-3 transition-colors", confirm === v.id ? "border-lagoon" : "border-cocoa/10")}>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm", v.auto ? "text-cocoa/70" : "font-medium text-cocoa")}>{v.label}</p>
                      <p className="text-xs text-muted-foreground">{when(v.createdAt)}</p>
                    </div>
                    {confirm !== v.id && (
                      <button type="button" onClick={() => setConfirm(v.id)} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-cocoa/15 px-3 text-sm hover:bg-sand">
                        <RotateCcw className="size-3.5" /> Go back
                      </button>
                    )}
                  </div>
                  {confirm === v.id && (
                    <div className="mt-3 rounded-xl bg-sand/60 p-3 text-sm">
                      <p className="text-cocoa">The whole website goes back to how it was then. What you have now is saved as a version first.</p>
                      <div className="mt-2.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void restore(v)}
                          disabled={!!busy}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-cocoa px-3 text-white disabled:opacity-60"
                        >
                          {busy === v.id && <Loader2 className="size-3.5 animate-spin" />} Go back to this version
                        </button>
                        <button type="button" onClick={() => setConfirm(null)} className="h-8 rounded-full px-3 hover:bg-white">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
