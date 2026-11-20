import { Marquee } from "@/components/magicui/marquee"
import { home } from "@/content/pages"

const ITEMS = home.values

export function ValueStrip() {
  return (
    <div className="relative mt-6 overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <Marquee repeat={3} className="[--duration:38s] [--gap:2.5rem]">
        {ITEMS.map((t, i) => (
          <span key={t} className="flex items-center gap-10 font-display text-2xl font-light whitespace-nowrap text-cocoa/70 md:text-3xl">
            {t}
            <span
              aria-hidden
              className="size-3 rounded-full"
              style={{
                background: `radial-gradient(circle at 32% 30%, #fff9 0 20%, transparent 42%), ${["#c65a42", "#2e7c79", "#d7a13b"][i % 3]}`,
              }}
            />
          </span>
        ))}
      </Marquee>
    </div>
  )
}
