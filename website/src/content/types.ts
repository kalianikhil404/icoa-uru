/* Shapes of the content files. The website editor (/admin) edits the
   .json files next to this one; you rarely need to touch this file. */

export type Finish = "opaque" | "transparent" | "silverlined" | "metallic" | "matte" | "luster"

export type BeadColor =
  | "red"
  | "pink"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "white"
  | "black"
  | "gold"

export type Product = {
  id: string
  slug: string
  name: string
  price: number
  compareAtPrice?: number
  short: string
  description: string[]
  details: string[]
  images: string[]
  video?: string
  collections: string[]
  colors: BeadColor[]
  badge?: "New" | "Bestseller" | "Limited" | "Last one" | ""
  stock: number
  featured?: boolean
  personalizable?: boolean
  /** Made to order: the customer picks the width (Mini to Large). Ready-made bracelets have a fixed width. */
  customSize?: boolean
  /** Width of a ready-made bracelet, in rows of beads */
  rows?: number
  /** Length in beads */
  length?: number
  added: string
  sample?: boolean
}

export type Collection = { slug: string; name: string; description: string; image: string; tint: string }
export type Faq = { q: string; a: string; category: string }
export type Testimonial = { quote: string; name: string; product?: string; sample?: boolean }

export type SizeOption = { id: string; label: string; rows: number; priceAdd: number }
export type ShippingMethod = { id: string; label: string; description: string; price: number; freeOverThreshold?: boolean }
export type DiscountCode = { code: string; percent: number; label: string }

export type HomeSectionId =
  | "values"
  | "featured"
  | "collections"
  | "madeByHand"
  | "process"
  | "designTeaser"
  | "reviews"
  | "newsletter"

export type HomeContent = {
  sections: { id: HomeSectionId; visible: boolean }[]
  hero: {
    badgeText: string
    badgeLink: string
    headline: string
    intro: string
    primaryButton: string
    secondaryButton: string
    trust: string[]
    loomLength: number
    loomSize: string
    /** background colour of the banner, see src/lib/hero-backgrounds.ts */
    background?: string
  }
  values: string[]
  featured: { title: string; intro: string; count: number }
  collections: { title: string; intro: string }
  madeByHand: { title: string; text: string; video: string; productSlug: string; features: { title: string; text: string }[] }
  process: { title: string; intro: string; steps: { title: string; text: string }[] }
  designTeaser: { title: string; text: string; button: string }
  reviews: { title: string }
  newsletter: { title: string; text: string }
}

export type AboutContent = {
  title: string
  intro: string
  heading: string
  paragraphs: string[]
  signature: string
  mainImage: string
  smallImage: string
  values: { title: string; text: string }[]
  ctaTitle: string
}

export type PageIntro = { title: string; intro: string }
export type PagesContent = {
  shop: PageIntro
  collections: PageIntro
  custom: PageIntro
  contact: PageIntro
  faq: PageIntro
  sizeGuide: PageIntro
  policies: PageIntro & { sections: { id: string; title: string; text: string }[] }
}

export type Theme = Record<
  "porcelain" | "sand" | "cocoa" | "espresso" | "lagoon" | "lagoonDeep" | "clay" | "marigold",
  string
>
