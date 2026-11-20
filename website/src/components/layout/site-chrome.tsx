import { Providers } from "@/components/layout/providers"
import { AnnouncementBar } from "@/components/layout/announcement-bar"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ScrollProgress } from "@/components/magicui/scroll-progress"
import { Tracker } from "@/components/analytics/tracker"

/** Everything around a shop page: announcement bar, menu, footer, bag drawer, search. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ScrollProgress className="z-[60] h-[2px] bg-gradient-to-r from-lagoon via-marigold to-clay" />
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <Tracker />
    </Providers>
  )
}
