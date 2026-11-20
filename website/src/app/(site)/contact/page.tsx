import type { Metadata } from "next"
import Link from "next/link"
import { Clock, Mail, MapPin } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { ContactForm } from "@/components/contact/contact-form"
import { SocialIcons } from "@/components/shared/social-icons"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { site } from "@/content/site"
import { faqs } from "@/content/faqs"
import { pages } from "@/content/pages"

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions, custom orders or sizing help. Lorem ipsum dolor sit amet.",
}

export default function ContactPage() {
  const info = [
    { Icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
    { Icon: Clock, label: "Replies", value: site.responseTime },
    { Icon: MapPin, label: "Studio", value: site.location },
  ]
  return (
    <>
      <PageHeader title={pages.contact.title} intro={pages.contact.intro} crumbs={[{ label: "Contact" }]} />
      <section className="container-page mt-12">
        <div className="grid gap-8 lg:grid-cols-12">
          <Stagger className="space-y-4 lg:col-span-4">
            {info.map(({ Icon, label, value, href }) => (
              <StaggerItem key={label}>
                <div className="flex items-center gap-4 rounded-[24px] border bg-white/60 p-5 backdrop-blur">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sand text-lagoon">
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {href ? (
                      <a href={href} className="truncate text-cocoa underline-offset-4 hover:underline">
                        {value}
                      </a>
                    ) : (
                      <p className="text-cocoa">{value}</p>
                    )}
                  </div>
                </div>
              </StaggerItem>
            ))}
            <StaggerItem>
              <div className="rounded-[24px] border bg-white/60 p-5 backdrop-blur">
                <p className="mb-3 text-xs text-muted-foreground">Follow along</p>
                <SocialIcons className="text-cocoa" />
              </div>
            </StaggerItem>
          </Stagger>
          <Reveal className="lg:col-span-8" delay={0.1}>
            <div className="rounded-[28px] border bg-white/60 p-6 shadow-soft backdrop-blur md:p-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-page mt-24 max-w-3xl">
        <Reveal>
          <h2 className="text-3xl font-normal text-cocoa md:text-4xl">Quick answers</h2>
          <Accordion type="single" collapsible className="mt-6">
            {faqs.slice(0, 4).map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-base text-cocoa">{f.q}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Link href="/faq" className="mt-6 inline-block text-sm text-lagoon underline-offset-4 hover:underline">
            See all questions
          </Link>
        </Reveal>
      </section>
    </>
  )
}
