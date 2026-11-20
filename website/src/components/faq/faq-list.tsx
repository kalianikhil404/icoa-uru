"use client"

import { useState } from "react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import { Search } from "lucide-react"
import { faqCategories, faqs } from "@/content/faqs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

export function FaqList() {
  const [cat, setCat] = useState<string>("All")
  const [q, setQ] = useState("")
  const term = q.trim().toLowerCase()
  const list = faqs.filter(
    (f) => (cat === "All" || f.category === cat) && (!term || `${f.q} ${f.a}`.toLowerCase().includes(term))
  )
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <LayoutGroup id="faq-tabs">
          <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-sand/70 p-1">
            {["All", ...faqCategories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={cn("relative rounded-full px-4 py-2 text-sm whitespace-nowrap", cat === c ? "text-white" : "text-cocoa/80 hover:text-cocoa")}
              >
                {cat === c && <motion.span layoutId="faq-pill" className="absolute inset-0 rounded-full bg-cocoa" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <span className="relative">{c}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <label className="flex h-11 items-center gap-2 rounded-full border bg-white/70 px-4 md:w-72">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
      </div>

      <div className="mt-8 rounded-[28px] border bg-white/60 px-6 backdrop-blur md:px-8">
        <AnimatePresence mode="wait">
          <motion.div key={cat + term} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {list.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">No questions match “{q}”. Try another word, or ask us directly.</p>
            ) : (
              <Accordion type="single" collapsible>
                {list.map((f) => (
                  <AccordionItem key={f.q} value={f.q} className="last:border-b-0">
                    <AccordionTrigger className="py-5 text-base text-cocoa">{f.q}</AccordionTrigger>
                    <AccordionContent className="leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
