"use client"

import Image from "next/image"
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { Lens } from "@/components/magicui/lens"
import { cn } from "@/lib/utils"

type Media = { type: "image" | "video"; src: string }

export function ProductGallery({ images, video, name }: { images: string[]; video?: string; name: string }) {
  const media: Media[] = [
    ...images.slice(0, 1).map((src) => ({ type: "image" as const, src })),
    ...(video ? [{ type: "video" as const, src: video }] : []),
    ...images.slice(1).map((src) => ({ type: "image" as const, src })),
  ]
  const [[index, dir], setState] = useState<[number, number]>([0, 0])
  const go = (next: number) => setState([(next + media.length) % media.length, next > index ? 1 : -1])
  const current = media[index]

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {/* Thumbnails */}
      <div className="no-scrollbar flex gap-3 overflow-x-auto lg:w-20 lg:flex-col">
        {media.map((m, i) => (
          <button
            key={m.src}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show ${m.type} ${i + 1}`}
            className={cn(
              "relative aspect-[4/5] w-18 shrink-0 overflow-hidden rounded-2xl bg-sand transition-opacity lg:w-full",
              i === index ? "opacity-100" : "opacity-60 hover:opacity-100"
            )}
          >
            {m.type === "image" ? (
              <Image src={m.src} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <>
                <video src={m.src} muted playsInline preload="metadata" className="size-full object-cover" />
                <span className="absolute inset-0 grid place-items-center bg-black/20">
                  <Play className="size-4 fill-white text-white" />
                </span>
              </>
            )}
            {i === index && (
              <motion.span layoutId="thumb-ring" className="absolute inset-0 rounded-2xl ring-2 ring-cocoa ring-inset" />
            )}
          </button>
        ))}
      </div>

      {/* Main view */}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-[28px] bg-sand shadow-soft">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={current.src}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            drag={media.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(index + 1)
              else if (info.offset.x > 60) go(index - 1)
            }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            {current.type === "image" ? (
              <div className="hidden size-full md:block">
                <Lens zoomFactor={2} lensSize={200} ariaLabel={`Zoom into ${name}`}>
                  <div className="relative aspect-[4/5] w-full">
                    <Image
                      src={current.src}
                      alt={name}
                      fill
                      priority={index === 0}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                      draggable={false}
                    />
                  </div>
                </Lens>
              </div>
            ) : (
              <video
                src={current.src}
                autoPlay
                muted
                loop
                playsInline
                className="size-full object-cover"
                aria-label={`${name} on the wrist`}
              />
            )}
            {current.type === "image" && (
              <Image
                src={current.src}
                alt={name}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover md:hidden"
                draggable={false}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {media.length > 1 && (
          <>
            <div className="pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
              {[
                { Icon: ChevronLeft, d: -1, label: "Previous" },
                { Icon: ChevronRight, d: 1, label: "Next" },
              ].map(({ Icon, d, label }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  onClick={() => go(index + d)}
                  className="glass pointer-events-auto grid size-10 place-items-center rounded-full text-cocoa transition-transform hover:scale-105"
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {media.map((m, i) => (
                <span
                  key={m.src}
                  className={cn("h-1.5 rounded-full bg-white/90 transition-all duration-300", i === index ? "w-5" : "w-1.5 opacity-60")}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
