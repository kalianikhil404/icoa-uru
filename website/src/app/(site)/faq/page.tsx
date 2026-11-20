import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { FaqList } from "@/components/faq/faq-list"
import { pages } from "@/content/pages"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Orders, shipping, sizing and care. Lorem ipsum dolor sit amet.",
}

export default function FaqPage() {
  return (
    <>
      <PageHeader
        title={pages.faq.title}
        intro={pages.faq.intro}
        crumbs={[{ label: "FAQ" }]}
      />
      <section className="container-page mt-12 max-w-4xl">
        <FaqList />
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Still wondering?{" "}
          <Link href="/contact" className="text-lagoon underline-offset-4 hover:underline">
            Send a message
          </Link>
        </p>
      </section>
    </>
  )
}
