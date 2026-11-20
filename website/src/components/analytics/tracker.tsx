"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { getConsent, setConsent, track } from "@/lib/track"

const subscribe = (cb: () => void) => {
  window.addEventListener("iu-consent", cb)
  return () => window.removeEventListener("iu-consent", cb)
}

/** Counts page views (anonymously) and shows the privacy notice until the visitor chooses. */
export function Tracker() {
  const pathname = usePathname()
  const first = useRef(true)
  const consent = useSyncExternalStore(subscribe, getConsent, () => "yes" as const)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      track("pageview", { path: pathname, ref: first.current && document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : undefined, title: document.title })
      first.current = false
    }, 400)
    return () => clearTimeout(t)
  }, [pathname])

  // show the notice a moment after the page settles, not on top of the first impression
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2500)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {ready && consent === null && (
        <motion.div
          role="region"
          aria-label="Privacy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-3 z-[60] rounded-[22px] border border-cocoa/10 bg-white/97 p-4 text-sm text-cocoa shadow-lift backdrop-blur-xl sm:right-auto sm:bottom-5 sm:left-5 sm:max-w-sm sm:p-5"
        >
          <p className="leading-relaxed">
            We count which pages and bracelets are looked at, to make the shop better. No ads, and it&apos;s never sold.{" "}
            <Link href="/policies#privacy" className="text-lagoon underline underline-offset-2">
              Privacy
            </Link>
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setConsent("yes")} className="h-9 rounded-full bg-cocoa px-4 text-white hover:bg-espresso">
              OK
            </button>
            <button type="button" onClick={() => setConsent("no")} className="h-9 rounded-full px-4 hover:bg-sand">
              No thanks
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
