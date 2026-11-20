import type { Metadata, Viewport } from "next"
import "./globals.css"
import { site } from "@/content/site"
import { theme } from "@/content/pages"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Handwoven bead bracelets`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} | Handwoven bead bracelets`,
    description: site.description,
  },
}

export const viewport: Viewport = {
  themeColor: theme.porcelain,
}

/** Brand colours from theme.json (editable in the website editor) */
const themeCss = `:root{--porcelain:${theme.porcelain};--sand:${theme.sand};--cocoa:${theme.cocoa};--espresso:${theme.espresso};--lagoon:${theme.lagoon};--lagoon-deep:${theme.lagoonDeep};--clay:${theme.clay};--marigold:${theme.marigold}}`

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
