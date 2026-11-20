import Image from "next/image"
import Link from "next/link"
import { footerNav, site } from "@/content/site"
import { SocialIcons } from "@/components/shared/social-icons"
import { BeadRow } from "@/components/shared/bead-row"
import { NewsletterForm } from "@/components/shared/newsletter-form"

export function SiteFooter() {
  return (
    <footer className="relative mx-2 mb-2 mt-24 overflow-hidden rounded-[28px] bg-espresso text-white/80 sm:mx-3 sm:mb-3 sm:rounded-[36px]">
      <div className="grain pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-lagoon/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-52 -left-40 size-[480px] rounded-full bg-clay/20 blur-[120px]" />

      <div className="container-page relative pt-16 pb-10 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4">
              <Image
                src="/images/brand/logo-badge.png"
                alt={`${site.name} logo`}
                width={72}
                height={72}
                className="rounded-full"
              />
              <div>
                <p className="font-display text-2xl text-white">{site.name}</p>
                <p className="text-sm text-white/55">{site.tagline}</p>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/60">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Get first look at new patterns.
            </p>
            <NewsletterForm className="mt-5 max-w-sm" dark />
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:pl-10">
            {footerNav.map((group) => (
              <div key={group.title}>
                <p className="mb-4 text-sm font-medium text-white">{group.title}</p>
                <ul className="space-y-2.5">
                  {group.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-white/60 transition-colors duration-300 hover:text-white"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <BeadRow count={13} size={13} />
          <SocialIcons className="text-white/80" />
        </div>

        <p
          aria-hidden
          className="pointer-events-none mt-10 font-display text-[22vw] leading-[0.8] tracking-[-0.04em] text-white/[0.06] select-none md:text-[17vw]"
        >
          {site.name}
        </p>
        <div className="mt-4 flex flex-col justify-between gap-2 text-xs text-white/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name}. Handwoven by {site.designer}.
          </p>
          <p>{site.location}</p>
        </div>
      </div>
    </footer>
  )
}
