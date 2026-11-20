import { cn } from "@/lib/utils"
import { Reveal } from "@/components/motion/reveal"

/** Standard heading block used at the top of each section. */
export function SectionHeading({
  title,
  intro,
  action,
  align = "left",
  className,
}: {
  title: React.ReactNode
  intro?: React.ReactNode
  action?: React.ReactNode
  align?: "left" | "center"
  className?: string
}) {
  return (
    <Reveal
      className={cn(
        "mb-10 flex flex-col gap-5 md:mb-14",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        <h2 className="text-[2.1rem] leading-[1.05] font-normal text-cocoa md:text-5xl">{title}</h2>
        {intro && <p className="mt-4 max-w-xl text-[1.02rem] leading-relaxed text-muted-foreground">{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  )
}
