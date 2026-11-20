"use client"

import Link from "next/link"
import { Ruler } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SizeTable } from "@/components/shop/size-table"
import { beads, lengthCm } from "@/content/site"

export function SizeGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1.5 text-sm text-cocoa/70 underline-offset-4 hover:text-cocoa hover:underline">
          <Ruler className="size-3.5" /> Sizes
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-[28px] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">Bracelet sizes</DialogTitle>
          <DialogDescription>
            Sizes describe how many beads wide the band is. Every bracelet is {beads.standardLength} beads long (
            {lengthCm(beads.standardLength)}) with a {beads.extenderCm} cm extender chain.
          </DialogDescription>
        </DialogHeader>
        <SizeTable />
        <Link href="/size-guide" className="text-sm text-lagoon underline-offset-4 hover:underline">
          Read the full guide
        </Link>
      </DialogContent>
    </Dialog>
  )
}
