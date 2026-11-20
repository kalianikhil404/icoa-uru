import type { Metadata } from "next"
import { PageHeader } from "@/components/shared/page-header"
import { pages } from "@/content/pages"

export const metadata: Metadata = {
  title: "Shipping, returns & policies",
  description: "Shipping, returns, privacy and terms.",
}

export default function PoliciesPage() {
  const { title, intro, sections } = pages.policies
  return (
    <>
      <PageHeader title={title} intro={intro} crumbs={[{ label: "Policies" }]} />
      <div className="container-page mt-12 grid gap-10 lg:grid-cols-12">
        <nav aria-label="Policies" className="lg:col-span-3">
          <ul className="space-y-1 lg:sticky lg:top-32">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-full px-4 py-2 text-sm text-cocoa/80 transition-colors hover:bg-sand hover:text-cocoa">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-6 lg:col-span-9">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-32 rounded-[28px] border bg-white/60 p-7 backdrop-blur md:p-9">
              <h2 className="text-3xl font-normal text-cocoa">{s.title}</h2>
              <div className="mt-4 space-y-3 leading-relaxed text-muted-foreground">
                {s.text.split(/\n\s*\n/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}
