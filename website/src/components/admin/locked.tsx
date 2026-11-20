"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Loader2, Lock } from "lucide-react"
import type { Access } from "@/lib/admin/server"

/** Shown when the editor is opened from another device, or on the live website. */
export function Locked({ reason, area = "editor" }: { reason: Exclude<Access, "ok">; area?: "editor" | "control" }) {
  const [pw, setPw] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const name = area === "control" ? "Control center" : "Website editor"
  const text =
    reason === "off"
      ? "The website editor only works on your computer (Start Website.bat). Edit there, then publish again. Orders and emails are in the control center at /control."
      : reason === "local-only"
        ? `For safety, the ${name.toLowerCase()} only opens on the computer that runs the website. To open it from other devices or on the live website, set an ADMIN_PASSWORD: in .env.local on your computer, or in Vercel → Settings → Environment Variables online.`
        : `Enter the admin password to open the ${name.toLowerCase()}.`

  return (
    <main className="grid min-h-dvh place-items-center bg-porcelain p-6 text-cocoa">
      <div className="w-full max-w-sm rounded-[28px] border border-cocoa/10 bg-white p-7 shadow-soft">
        <div className="flex items-center gap-3">
          <Image src="/images/brand/logo-mark.png" alt="" width={56} height={56} className="rounded-full" />
          <h1 className="font-display text-2xl">{name}</h1>
        </div>
        <p className="mt-4 flex gap-2 text-sm leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" />
          {text}
        </p>
        {reason === "password" && (
          <form
            className="mt-5"
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              setError("")
              const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) })
              setBusy(false)
              if (res.ok) location.reload()
              else setError("That password isn't right.")
            }}
          >
            <label htmlFor="pw" className="text-sm font-medium">
              Password
            </label>
            <input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-cocoa/15 px-3 outline-none focus:border-lagoon focus:ring-4 focus:ring-lagoon/15"
            />
            {error && <p className="mt-2 text-sm text-clay">{error}</p>}
            <button type="submit" disabled={busy || !pw} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cocoa text-white disabled:opacity-50">
              {busy && <Loader2 className="size-4 animate-spin" />} Open
            </button>
          </form>
        )}
        <Link href="/" className="mt-5 inline-block text-sm text-lagoon underline underline-offset-4">
          Go to the website
        </Link>
      </div>
    </main>
  )
}
