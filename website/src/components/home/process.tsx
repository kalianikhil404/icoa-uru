"use client"

import { useRef } from "react"
import { motion, useScroll, useSpring, useTransform } from "motion/react"
import { home } from "@/content/pages"

const COLORS = ["#d7a13b", "#2e7c79", "#c65a42", "#23399b"]
const STEPS = home.process.steps.map((s, i) => ({ ...s, color: COLORS[i % COLORS.length] }))

/** "How it's made": a thread draws itself down the page as you scroll. */
export function Process() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const height = useTransform(progress, [0, 1], ["0%", "100%"])

  return (
    <section className="container-page mt-28 md:mt-40">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <h2 className="text-[2.1rem] leading-[1.05] font-normal text-cocoa md:text-5xl">{home.process.title}</h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
              {home.process.intro}
            </p>
          </div>
        </div>

        <div ref={ref} className="relative lg:col-span-7">
          {/* the thread */}
          <div aria-hidden className="absolute top-2 bottom-2 left-[19px] w-px bg-cocoa/10">
            <motion.div style={{ height }} className="w-full bg-gradient-to-b from-marigold via-clay to-lagoon" />
          </div>
          <ol className="space-y-6">
            {STEPS.map((s, i) => (
              <Step key={s.title} index={i} total={STEPS.length} progress={progress} {...s} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Step({
  title,
  text,
  color,
  index,
  total,
  progress,
}: {
  title: string
  text: string
  color: string
  index: number
  total: number
  progress: ReturnType<typeof useSpring>
}) {
  const at = index / (total - 0.6)
  const scale = useTransform(progress, [at - 0.05, at + 0.05], [0.4, 1])
  const opacity = useTransform(progress, [at - 0.08, at + 0.04], [0.45, 1])
  return (
    <motion.li style={{ opacity }} className="relative flex gap-6">
      <div className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border bg-porcelain">
        <motion.span
          style={{
            scale,
            background: `radial-gradient(circle at 32% 30%, #fffa 0 18%, transparent 42%), ${color}`,
          }}
          className="size-5 rounded-full shadow-sm"
        />
      </div>
      <div className="flex-1 rounded-3xl border bg-white/60 p-6 backdrop-blur-sm transition-shadow duration-500 hover:shadow-soft md:p-7">
        <p className="text-sm text-muted-foreground tabular-nums">Step {index + 1}</p>
        <h3 className="mt-1 font-display text-2xl text-cocoa">{title}</h3>
        <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </motion.li>
  )
}
