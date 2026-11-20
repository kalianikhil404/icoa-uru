import Link from "next/link"
import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

/** The Magic UI shimmer button, as a link. */
export function ShimmerLink({
  href,
  children,
  className,
  background = "var(--lagoon)",
  shimmerColor = "#fff6e4",
}: {
  href: string
  children: React.ReactNode
  className?: string
  background?: string
  shimmerColor?: string
}) {
  return (
    <Link
      href={href}
      style={
        {
          "--spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--radius": "999px",
          "--speed": "3.2s",
          "--cut": "0.06em",
          "--bg": background,
        } as CSSProperties
      }
      className={cn(
        "group relative z-0 inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full border border-white/15 px-7 text-[0.95rem] font-medium whitespace-nowrap text-white [background:var(--bg)]",
        "transform-gpu transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-px",
        className
      )}
    >
      <span className="absolute inset-0 -z-30 overflow-visible blur-[2px] [container-type:size]">
        <span className="animate-shimmer-slide absolute inset-0 aspect-square h-[100cqh] rounded-none [mask:none]">
          <span className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
        </span>
      </span>
      <span className="relative">{children}</span>
      <span className="absolute inset-0 rounded-full shadow-[inset_0_-8px_10px_#ffffff1f] transition-shadow duration-300 group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]" />
      <span className="absolute inset-(--cut) -z-20 rounded-full [background:var(--bg)]" />
    </Link>
  )
}
