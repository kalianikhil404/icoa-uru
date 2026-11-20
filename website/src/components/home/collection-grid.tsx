import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { collections } from "@/content/collections"
import { getCollectionProducts } from "@/lib/catalog"
import { Stagger, StaggerItem } from "@/components/motion/reveal"
import { cn } from "@/lib/utils"

// Bento layout: one large tile and four smaller ones
const SPANS = [
  "lg:col-span-7 lg:row-span-2",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-6",
  "lg:col-span-6",
]

export function CollectionGrid() {
  return (
    <Stagger className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:auto-rows-[300px] sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:auto-rows-[250px] lg:grid-cols-12 lg:gap-5">
      {collections.map((c, i) => {
        const count = getCollectionProducts(c.slug).length
        const big = i === 0
        return (
          <StaggerItem key={c.slug} className={cn("h-[340px] w-[78%] shrink-0 snap-start sm:h-auto sm:w-auto", SPANS[i % SPANS.length], big && "sm:col-span-2 sm:row-span-2 lg:col-span-7")}>
            <Link
              href={`/collections/${c.slug}`}
              className="group relative block size-full overflow-hidden rounded-[28px] shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
              style={{ background: c.tint }}
            >
              <Image
                src={c.image}
                alt=""
                fill
                sizes={big ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 42vw, 100vw"}
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/45 via-cocoa/0 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                <div className="glass rounded-2xl px-4 py-3">
                  <p className={cn("font-display leading-none text-cocoa", big ? "text-2xl sm:text-3xl" : "text-xl")}>{c.name}</p>
                  <p className="mt-1.5 text-xs text-cocoa/70">
                    {count} {count === 1 ? "bracelet" : "bracelets"}
                  </p>
                </div>
                <span className="glass grid size-11 shrink-0 place-items-center rounded-full text-cocoa transition-transform duration-500 group-hover:rotate-45">
                  <ArrowUpRight className="size-5" />
                </span>
              </div>
            </Link>
          </StaggerItem>
        )
      })}
    </Stagger>
  )
}
