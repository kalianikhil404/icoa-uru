"use client"

import Link from "next/link"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Loader2 } from "lucide-react"

export function Unsubscribe() {
  const token = useSearchParams().get("t") ?? ""
  const [state, setState] = useState<"ask" | "busy" | "done" | "error">("ask")
  const [email, setEmail] = useState("")
  return (
    <div className="rounded-[28px] border bg-white/70 p-8 text-center shadow-soft">
      {state === "done" ? (
        <>
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-lagoon text-white">
            <Check className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-3xl text-cocoa">You&apos;re unsubscribed</h1>
          <p className="mt-2 text-muted-foreground">{email ? `${email} won't get our newsletter any more.` : "You won't get our newsletter any more."} Order emails still arrive as usual.</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl text-cocoa">Stop newsletter emails?</h1>
          <p className="mt-2 text-muted-foreground">You can sign up again any time.</p>
          {state === "error" && <p className="mt-4 text-sm text-clay">That link has expired or was already used.</p>}
          <button
            type="button"
            disabled={!token || state === "busy"}
            onClick={async () => {
              setState("busy")
              const res = await fetch(`/api/unsubscribe?t=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => null)
              const d = await res?.json().catch(() => null)
              if (res?.ok) {
                setEmail(d?.email ?? "")
                setState("done")
              } else setState("error")
            }}
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-cocoa px-6 text-white disabled:opacity-50"
          >
            {state === "busy" && <Loader2 className="size-4 animate-spin" />} Unsubscribe
          </button>
        </>
      )}
      <Link href="/" className="mt-6 block text-sm text-lagoon underline-offset-4 hover:underline">
        Back to the shop
      </Link>
    </div>
  )
}
