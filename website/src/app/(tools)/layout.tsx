import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Layout for the owner's tools (editor, control center): no shop menu or footer. */
export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={250}>
      {children}
      <Toaster position="bottom-center" />
    </TooltipProvider>
  )
}
