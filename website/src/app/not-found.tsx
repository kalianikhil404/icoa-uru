import Link from "next/link"
import { BeadShower } from "@/components/effects/bead-shower"
import { ShimmerLink } from "@/components/shared/shimmer-link"
import { SiteChrome } from "@/components/layout/site-chrome"

export default function NotFound() {
  return (
    <SiteChrome>
    <section className="relative mx-2 overflow-hidden rounded-[28px] bg-gradient-to-b from-sand to-porcelain sm:mx-3 sm:rounded-[36px]">
      <BeadShower density={1.2} />
      <div className="container-page relative flex min-h-[78svh] flex-col items-center justify-center pt-28 pb-16 text-center">
        <p className="font-display text-[8rem] leading-none font-light text-cocoa/15 md:text-[12rem]">404</p>
        <h1 className="-mt-6 font-display text-4xl font-light text-cocoa md:text-5xl">This bead rolled away</h1>
        <p className="mt-4 max-w-md text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ShimmerLink href="/shop">Shop bracelets</ShimmerLink>
          <Link href="/" className="inline-flex h-12 items-center rounded-full border bg-white/70 px-6 text-cocoa hover:bg-white">
            Go home
          </Link>
        </div>
      </div>
    </section>
    </SiteChrome>
  )
}
