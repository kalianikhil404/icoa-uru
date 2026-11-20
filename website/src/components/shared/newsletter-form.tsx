"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { visitorId } from "@/lib/track"

export function NewsletterForm({ className, dark = false }: { className?: string; dark?: boolean }) {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState("loading")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: dark ? "Footer sign-up" : "Newsletter sign-up", visitorId: visitorId() }),
      })
      setState(res.ok ? "done" : "error")
    } catch {
      setState("error")
    }
  }

  return (
    <form onSubmit={submit} className={cn("relative", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {state === "done" ? (
          <motion.p
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex h-12 items-center gap-2 text-sm", dark ? "text-white" : "text-cocoa")}
          >
            <Check className="size-4 text-marigold" /> You&apos;re on the list.
          </motion.p>
        ) : (
          <motion.div key="form" exit={{ opacity: 0, y: -6 }} className="relative">
            <label htmlFor={dark ? "nl-email-dark" : "nl-email"} className="sr-only">
              Email address
            </label>
            <input
              id={dark ? "nl-email-dark" : "nl-email"}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className={cn(
                "h-12 w-full rounded-full pr-14 pl-5 text-sm outline-none transition-shadow focus-visible:ring-2",
                dark
                  ? "border border-white/15 bg-white/[0.07] text-white placeholder:text-white/40 focus-visible:ring-white/30"
                  : "border bg-white text-cocoa placeholder:text-muted-foreground focus-visible:ring-ring/40"
              )}
            />
            <button
              type="submit"
              disabled={state === "loading"}
              aria-label="Join the newsletter"
              className="absolute top-1 right-1 grid size-10 place-items-center rounded-full bg-lagoon text-white transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            </button>
            <p className={cn("mt-2 px-1 text-[0.72rem] leading-snug", dark ? "text-white/40" : "text-muted-foreground")}>
              You&apos;ll get emails about new patterns and offers. Unsubscribe any time.
            </p>
            {state === "error" && (
              <p className={cn("mt-2 text-xs", dark ? "text-clay" : "text-destructive")}>
                That didn&apos;t go through. Check the email address and try again.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
