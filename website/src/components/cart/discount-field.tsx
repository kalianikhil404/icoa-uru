"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Tag, X } from "lucide-react"
import { useCart } from "@/lib/stores"
import { findDiscount } from "@/lib/pricing"

export function DiscountField() {
  const code = useCart((s) => s.discountCode)
  const setDiscount = useCart((s) => s.setDiscount)
  const [value, setValue] = useState("")
  const [error, setError] = useState("")
  const applied = findDiscount(code)

  // Not a <form>: this field also sits inside the checkout form
  const apply = () => {
    const found = findDiscount(value)
    if (!found) {
      setError(`“${value.trim()}” isn't a valid code. Check the spelling and try again.`)
      return
    }
    setError("")
    setDiscount(found.code)
    setValue("")
  }

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {applied ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between rounded-2xl bg-lagoon/10 px-4 py-3 text-sm text-lagoon-deep"
          >
            <span className="flex items-center gap-2">
              <Tag className="size-4" /> <strong>{applied.code}</strong> {applied.label}
            </span>
            <button type="button" onClick={() => setDiscount(null)} aria-label="Remove discount code" className="rounded-full p-1 hover:bg-lagoon/15">
              <X className="size-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div key="field" role="group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
            <label htmlFor="discount" className="sr-only">
              Discount code
            </label>
            <input
              id="discount"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (value.trim()) apply()
                }
              }}
              placeholder="Discount code"
              className="h-11 min-w-0 flex-1 rounded-full border bg-white px-4 text-sm uppercase outline-none placeholder:normal-case focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <button type="button" onClick={apply} disabled={!value.trim()} className="h-11 rounded-full bg-cocoa px-5 text-sm text-white disabled:opacity-40">
              Apply
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
