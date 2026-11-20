"use client"

import { motion } from "motion/react"

/** Soft fade between pages. (Opacity only, so sticky/fixed elements keep working.) */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, ease: "easeOut" }}>
      {children}
    </motion.div>
  )
}
