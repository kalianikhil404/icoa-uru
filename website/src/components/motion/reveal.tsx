"use client"

import { motion, type HTMLMotionProps } from "motion/react"

const ease = [0.22, 1, 0.36, 1] as const

/** Fades content up softly the first time it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  ...rest
}: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, ease, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/** Staggers its direct <StaggerItem> children into view. */
export function Stagger({
  children,
  className,
  gap = 0.08,
}: {
  children: React.ReactNode
  className?: string
  gap?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
      }}
    >
      {children}
    </motion.div>
  )
}
