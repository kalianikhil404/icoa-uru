import Image from "next/image"
import { SpinningText } from "@/components/magicui/spinning-text"
import { cn } from "@/lib/utils"

/** Round badge with spinning lettering, like the circle on the logo. */
export function SpinningBadge({ className, text = "handcrafted beadwork • icoa-uru • " }: { className?: string; text?: string }) {
  return (
    <div className={cn("glass relative grid size-32 place-items-center rounded-full", className)}>
      <SpinningText duration={22} radius={6.4} className="font-display text-[0.72rem] tracking-[0.18em] text-cocoa uppercase">
        {text}
      </SpinningText>
      <span className="absolute size-14 overflow-hidden rounded-full ring-1 ring-black/5">
        <Image src="/images/brand/logo-mark.png" alt="" fill sizes="56px" className="object-cover" />
      </span>
    </div>
  )
}
