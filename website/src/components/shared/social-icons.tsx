import { Music2, Pin } from "lucide-react"
import { site } from "@/content/site"
import { cn } from "@/lib/utils"

function InstagramGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

const items = [
  { label: "Instagram", href: site.socials.instagram, Icon: InstagramGlyph },
  { label: "TikTok", href: site.socials.tiktok, Icon: Music2 },
  { label: "Pinterest", href: site.socials.pinterest, Icon: Pin },
]

export function SocialIcons({ className, itemClassName }: { className?: string; itemClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {items.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className={cn(
            "grid size-10 place-items-center rounded-full border border-current/15 transition-all duration-300 hover:-translate-y-0.5 hover:border-current/40",
            itemClassName
          )}
        >
          <Icon className="size-[18px]" />
        </a>
      ))}
    </div>
  )
}
