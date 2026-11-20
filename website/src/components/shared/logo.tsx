import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { site } from "@/content/site"

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label={`${site.name} home`}
      className={cn("group inline-flex items-center gap-3 rounded-full", className)}
    >
      <span className="relative size-[46px] shrink-0 rounded-full shadow-[0_3px_10px_-3px_rgba(74,46,34,0.45)] transition-transform duration-500 group-hover:rotate-[10deg] sm:size-[58px]">
        <Image src="/images/brand/logo-mark.png" alt="" fill sizes="(min-width: 640px) 58px, 46px" className="object-contain" priority />
      </span>
      <span
        className={cn(
          "font-display text-[1.45rem] leading-none font-medium tracking-[-0.01em] sm:text-[1.8rem]",
          light ? "text-white" : "text-cocoa"
        )}
      >
        {site.name}
      </span>
    </Link>
  )
}
