"use client"

import { Fragment } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

/** Headline that blurs in word by word on page load. */
export function WordReveal({
  text,
  as: Tag = "h1",
  className,
  delay = 0,
  stagger = 0.07,
}: {
  text: string
  as?: "h1" | "h2" | "p"
  className?: string
  delay?: number
  stagger?: number
}) {
  const words = text.split(" ")
  const MotionTag = motion[Tag]
  return (
    <MotionTag
      className={cn(className)}
      aria-label={text}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {words.map((w, i) => (
        <Fragment key={i}>
          <motion.span
            aria-hidden
            className="inline-block will-change-transform"
            variants={{
              hidden: { opacity: 0, y: "0.35em", filter: "blur(10px)" },
              show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            {w}
          </motion.span>{" "}
        </Fragment>
      ))}
    </MotionTag>
  )
}
