import { Marquee } from "@/components/magicui/marquee"
import { site } from "@/content/site"

export function AnnouncementBar() {
  return (
    <div className="relative z-40 h-9 overflow-hidden bg-cocoa text-[0.78rem] text-white/85">
      <Marquee pauseOnHover repeat={3} className="h-9 items-center p-0 [--duration:46s] [--gap:3rem]">
        {site.announcements.map((text) => (
          <span key={text} className="flex items-center gap-3 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-marigold" aria-hidden />
            {text}
          </span>
        ))}
      </Marquee>
    </div>
  )
}
