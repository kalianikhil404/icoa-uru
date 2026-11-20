import {
  BookOpen,
  Gem,
  HelpCircle,
  House,
  Images,
  type LucideIcon,
  MessageSquareQuote,
  Palette,
  Ruler,
  ScrollText,
  Store,
  SwatchBook,
} from "lucide-react"
import type { Field, Opt } from "./fields"
import { HeroBackgroundPicker } from "./hero-background-picker"
import { slugify, type Content, type ContentName, type Json, type Path } from "./store"

/* ------------------------------------------------------------------
   What the editor can change, section by section. To add a field,
   copy a line and point "path" at the value in the .json file.
------------------------------------------------------------------- */

type Common = { id: string; label: string; icon: LucideIcon; intro: string; file: ContentName }

export type FormSection = Common & { kind: "form"; base: Path; fields: Field[]; preview: string }
export type ListSection = Common & {
  kind: "list"
  base: Path
  noun: string
  fields: Field[]
  title: (item: Json) => string
  subtitle?: (item: Json, c: Content) => string
  image?: (item: Json) => string | undefined
  create: (c: Content) => Json
  duplicate?: (item: Json, c: Content) => Json
  preview: (item: Json | undefined) => string
}
export type Section = FormSection | ListSection

const COLORS: Opt[] = ["red", "pink", "orange", "yellow", "green", "teal", "blue", "purple", "white", "black", "gold"].map((c) => ({
  value: c,
  label: c[0].toUpperCase() + c.slice(1),
}))
const BADGES: Opt[] = ["New", "Bestseller", "Limited", "Last one"].map((b) => ({ value: b, label: b }))
const FINISHES: Opt[] = [
  { value: "opaque", label: "Opaque" },
  { value: "transparent", label: "Transparent" },
  { value: "silverlined", label: "Silver-lined" },
  { value: "metallic", label: "Metallic" },
  { value: "matte", label: "Matte" },
  { value: "luster", label: "Luster" },
]
const sizeOptions = (c: Content): Opt[] => (c.settings?.sizes ?? []).map((s: Json) => ({ value: s.id, label: `${s.label} (${s.rows} rows)` }))
const collectionOptions = (c: Content): Opt[] => (c.collections ?? []).map((x: Json) => ({ value: x.slug, label: x.name }))
const productOptions = (c: Content): Opt[] => (c.products ?? []).map((x: Json) => ({ value: x.slug, label: x.name }))
const money = (n: number) => `$${Number(n ?? 0).toFixed(Number.isInteger(Number(n)) ? 0 : 2)}`
const today = () => new Date().toISOString().slice(0, 10)

const titleText = (path: Path, label = "Title"): Field => ({ type: "text", path, label })
const introText = (path: Path, label = "Intro"): Field => ({ type: "text", path, label, long: true, rows: 3 })

export const SECTIONS: Section[] = [
  /* -------------------------------- Home -------------------------------- */
  {
    id: "home",
    kind: "form",
    label: "Home page",
    icon: House,
    intro: "The first page people see. Change the words, the order of the sections, or hide a section.",
    file: "home",
    base: [],
    preview: "/",
    fields: [
      { type: "heading", label: "Top of the page" },
      {
        type: "custom",
        render: (ctx) => (
          <HeroBackgroundPicker
            value={(ctx.value as { hero?: { background?: string } })?.hero?.background}
            onChange={(id) => ctx.update(["hero", "background"], id)}
          />
        ),
      },
      { type: "text", path: ["hero", "headline"], label: "Big headline", maxLength: 70 },
      { type: "text", path: ["hero", "intro"], label: "Text under the headline", long: true, rows: 3, maxLength: 220 },
      {
        type: "row",
        fields: [
          { type: "text", path: ["hero", "primaryButton"], label: "Main button" },
          { type: "text", path: ["hero", "secondaryButton"], label: "Second button" },
        ],
      },
      {
        type: "row",
        fields: [
          { type: "text", path: ["hero", "badgeText"], label: "Small badge above the headline", hint: "Leave empty to hide it" },
          { type: "text", path: ["hero", "badgeLink"], label: "Badge goes to", hint: "e.g. /collections/fruit-stand" },
        ],
      },
      { type: "strings", path: ["hero", "trust"], label: "Little promises under the buttons", addLabel: "Add a promise" },
      {
        type: "row",
        fields: [
          { type: "number", path: ["hero", "loomLength"], label: "Loom length", suffix: "beads", min: 20, max: 120 },
          { type: "select", path: ["hero", "loomSize"], label: "Loom starts at size", options: (c) => (c.settings?.sizes ?? []).map((s: Json) => ({ value: s.id, label: `${s.label} (${s.rows} rows)` })) },
        ],
      },
      { type: "heading", label: "Sections", hint: "Use the arrows to change the order. The eye shows or hides a section." },
      {
        type: "sections",
        path: ["sections"],
        label: "Order on the page",
        names: {
          values: "Promise strip",
          featured: "Featured bracelets",
          collections: "Collections",
          madeByHand: "Made by hand (video)",
          process: "How it's made",
          designTeaser: "Design your own",
          reviews: "Reviews",
          newsletter: "Newsletter sign-up",
        },
      },
      { type: "strings", path: ["values"], label: "Promise strip", hint: "Short lines that scroll across the page", addLabel: "Add a line" },
      { type: "heading", label: "Featured bracelets" },
      titleText(["featured", "title"]),
      introText(["featured", "intro"]),
      { type: "number", path: ["featured", "count"], label: "How many to show", min: 2, max: 12, hint: "Bracelets marked \"Featured\" in Products come first" },
      { type: "heading", label: "Collections" },
      titleText(["collections", "title"]),
      introText(["collections", "intro"]),
      { type: "heading", label: "Made by hand" },
      titleText(["madeByHand", "title"]),
      introText(["madeByHand", "text"], "Text"),
      { type: "image", path: ["madeByHand", "video"], label: "Video", folder: "videos", video: true },
      { type: "select", path: ["madeByHand", "productSlug"], label: "Bracelet linked below the video", options: productOptions },
      {
        type: "repeater",
        path: ["madeByHand", "features"],
        label: "Points next to the video",
        itemTitle: (x) => x.title,
        newItem: () => ({ title: "New point", text: "Lorem ipsum dolor sit amet." }),
        addLabel: "Add a point",
        fields: [titleText(["title"]), introText(["text"], "Text")],
      },
      { type: "heading", label: "How it's made" },
      titleText(["process", "title"]),
      introText(["process", "intro"]),
      {
        type: "repeater",
        path: ["process", "steps"],
        label: "Steps",
        itemTitle: (x, i) => `${i + 1}. ${x.title}`,
        newItem: () => ({ title: "New step", text: "Lorem ipsum dolor sit amet." }),
        addLabel: "Add a step",
        fields: [titleText(["title"]), introText(["text"], "Text")],
      },
      { type: "heading", label: "Design your own" },
      titleText(["designTeaser", "title"]),
      introText(["designTeaser", "text"], "Text"),
      { type: "text", path: ["designTeaser", "button"], label: "Button" },
      { type: "heading", label: "Reviews and newsletter" },
      titleText(["reviews", "title"], "Reviews title"),
      titleText(["newsletter", "title"], "Newsletter title"),
      introText(["newsletter", "text"], "Newsletter text"),
    ],
  },

  /* ------------------------------ Products ------------------------------ */
  {
    id: "products",
    kind: "list",
    label: "Products",
    icon: Gem,
    noun: "bracelet",
    intro: "Add, change or remove bracelets. The first photo is the one shown in the shop.",
    file: "products",
    base: [],
    title: (p) => p.name,
    subtitle: (p) => `${money(p.price)}, ${p.stock > 0 ? `${p.stock} in stock` : "Sold out"}${p.featured ? ", Featured" : ""}`,
    image: (p) => p.images?.[0],
    preview: (p) => (p ? `/shop/${p.slug}` : "/shop"),
    create: (c) => {
      const taken = (c.products ?? []).map((p: Json) => p.slug)
      let slug = "new-bracelet"
      for (let i = 2; taken.includes(slug); i++) slug = `new-bracelet-${i}`
      return {
        id: `p-${Date.now().toString(36)}`,
        slug,
        name: "New bracelet",
        price: 45,
        short: "Lorem ipsum dolor sit amet.",
        description: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
        details: ["Handwoven on a bead loom with Miyuki glass seed beads", "Silver-tone end bars with lobster clasp"],
        images: [],
        collections: [],
        colors: [],
        badge: "New",
        stock: 1,
        featured: false,
        customSize: false,
        rows: 10,
        length: c.settings?.beads?.standardLength ?? 63,
        added: today(),
      }
    },
    duplicate: (p, c) => {
      const taken = (c.products ?? []).map((x: Json) => x.slug)
      let slug = `${p.slug}-copy`
      for (let i = 2; taken.includes(slug); i++) slug = `${p.slug}-copy-${i}`
      return { ...structuredClone(p), id: `p-${Date.now().toString(36)}`, slug, name: `${p.name} (copy)`, added: today() }
    },
    fields: [
      { type: "text", path: ["name"], label: "Name" },
      { type: "images", path: ["images"], label: "Photos", folder: (p) => `products/${p.slug}` },
      {
        type: "row",
        fields: [
          { type: "number", path: ["price"], label: "Price", prefix: "$", step: 1, min: 0, hint: "For the smallest size it comes in, before size extras" },
          { type: "number", path: ["compareAtPrice"], label: "Was (sale)", prefix: "$", optional: true, min: 0, hint: "Leave empty if it's not on sale" },
        ],
      },
      {
        type: "row",
        fields: [
          { type: "number", path: ["stock"], label: "In stock", min: 0, hint: "0 shows it as sold out" },
          { type: "select", path: ["badge"], label: "Badge", options: BADGES, optional: true },
        ],
      },
      { type: "toggle", path: ["featured"], label: "Featured on the home page" },
      { type: "toggle", path: ["personalizable"], label: "Can have a name woven in", hint: "Shows a name box on the product page" },
      { type: "text", path: ["short"], label: "One-line description", hint: "Shown on the product cards", maxLength: 110 },
      { type: "strings", path: ["description"], label: "Description", long: true, addLabel: "Add a paragraph" },
      { type: "strings", path: ["details"], label: "Details list", addLabel: "Add a detail" },
      { type: "heading", label: "Size" },
      {
        type: "toggle",
        path: ["customSize"],
        label: "Made to order: the customer picks the width",
        hint: "Off for ready-made bracelets, which come in one size. On for name and custom bracelets (Mini to Large).",
      },
      {
        type: "row",
        fields: [
          { type: "number", path: ["rows"], label: "Width (ready-made)", suffix: "rows", min: 3, max: 40, optional: true, hint: "Ignored when made to order" },
          { type: "number", path: ["length"], label: "Length", suffix: "beads", min: 20, max: 120 },
        ],
      },
      { type: "chips", path: ["collections"], label: "Collections", options: collectionOptions },
      { type: "chips", path: ["colors"], label: "Main colours", hint: "Used by the colour filter in the shop", options: COLORS },
      { type: "image", path: ["video"], label: "Video (optional)", folder: (p) => `products/${p.slug}`, video: true },
      { type: "heading", label: "Advanced" },
      {
        type: "row",
        fields: [
          { type: "text", path: ["slug"], label: "Web address", hint: "The end of the link: /shop/…" },
          { type: "text", path: ["added"], label: "Date added", placeholder: "YYYY-MM-DD", hint: "Newest first in the shop" },
        ],
      },
    ],
  },

  /* ----------------------------- Collections ----------------------------- */
  {
    id: "collections",
    kind: "list",
    label: "Collections",
    icon: Images,
    noun: "collection",
    intro: "Groups of bracelets, like Fruit Stand. Add bracelets to a collection from Products.",
    file: "collections",
    base: [],
    title: (c) => c.name,
    subtitle: (x, c) => `${(c.products ?? []).filter((p: Json) => p.collections?.includes(x.slug)).length} bracelets`,
    image: (c) => c.image,
    preview: (c) => (c ? `/collections/${c.slug}` : "/collections"),
    create: (c) => {
      const taken = (c.collections ?? []).map((x: Json) => x.slug)
      let slug = "new-collection"
      for (let i = 2; taken.includes(slug); i++) slug = `new-collection-${i}`
      return { slug, name: "New collection", description: "Lorem ipsum dolor sit amet.", image: "", tint: "#efe5d8" }
    },
    fields: [
      { type: "text", path: ["name"], label: "Name" },
      { type: "text", path: ["description"], label: "Description", long: true, rows: 3 },
      { type: "image", path: ["image"], label: "Cover photo", folder: (c) => `collections/${c.slug}` },
      { type: "color", path: ["tint"], label: "Card colour", hint: "Soft colour behind the photo" },
      { type: "text", path: ["slug"], label: "Web address", hint: "The end of the link: /collections/… (bracelets keep their collection if you change this only after updating them)" },
    ],
  },

  /* -------------------------------- About -------------------------------- */
  {
    id: "about",
    kind: "form",
    label: "About page",
    icon: BookOpen,
    intro: "Your story.",
    file: "about",
    base: [],
    preview: "/about",
    fields: [
      titleText(["title"], "Page title"),
      introText(["intro"], "Text under the title"),
      { type: "text", path: ["heading"], label: "Story heading" },
      { type: "strings", path: ["paragraphs"], label: "Story", long: true, addLabel: "Add a paragraph" },
      { type: "text", path: ["signature"], label: "Signature", hint: "Written in italics under the story" },
      { type: "row", fields: [
        { type: "image", path: ["mainImage"], label: "Big photo", folder: "about" },
        { type: "image", path: ["smallImage"], label: "Small photo", folder: "about" },
      ] },
      {
        type: "repeater",
        path: ["values"],
        label: "Three cards",
        itemTitle: (x) => x.title,
        newItem: () => ({ title: "New card", text: "Lorem ipsum dolor sit amet." }),
        addLabel: "Add a card",
        fields: [titleText(["title"]), introText(["text"], "Text")],
      },
      { type: "text", path: ["ctaTitle"], label: "Closing line", long: true, rows: 2 },
    ],
  },

  /* --------------------------------- FAQ --------------------------------- */
  {
    id: "faq",
    kind: "form",
    label: "Questions (FAQ)",
    icon: HelpCircle,
    intro: "Questions and answers. Each question belongs to one of the topics.",
    file: "faqs",
    base: [],
    preview: "/faq",
    fields: [
      { type: "tags", path: ["categories"], label: "Topics", hint: "Shown as tabs on the questions page" },
      {
        type: "repeater",
        path: ["items"],
        label: "Questions",
        itemTitle: (x) => x.q,
        newItem: (c) => ({ category: c.faqs?.categories?.[0] ?? "Orders", q: "New question?", a: "Lorem ipsum dolor sit amet." }),
        addLabel: "Add a question",
        fields: [
          { type: "text", path: ["q"], label: "Question" },
          { type: "text", path: ["a"], label: "Answer", long: true, rows: 4 },
          { type: "select", path: ["category"], label: "Topic", options: (c) => (c.faqs?.categories ?? []).map((t: string) => ({ value: t, label: t })) },
        ],
      },
    ],
  },

  /* ------------------------------- Reviews ------------------------------- */
  {
    id: "reviews",
    kind: "form",
    label: "Reviews",
    icon: MessageSquareQuote,
    intro: "What customers say. Shown on the home page.",
    file: "testimonials",
    base: [],
    preview: "/#reviews",
    fields: [
      {
        type: "repeater",
        path: [],
        label: "Reviews",
        itemTitle: (x) => `${x.name}: ${x.quote}`,
        newItem: () => ({ quote: "Lorem ipsum dolor sit amet.", name: "Customer name", product: "" }),
        addLabel: "Add a review",
        fields: [
          { type: "text", path: ["quote"], label: "What they said", long: true, rows: 3 },
          {
            type: "row",
            fields: [
              { type: "text", path: ["name"], label: "Name" },
              { type: "select", path: ["product"], label: "Bracelet", optional: true, options: (c) => (c.products ?? []).map((p: Json) => ({ value: p.name, label: p.name })) },
            ],
          },
          { type: "toggle", path: ["sample"], label: "Sample review", hint: "Turn off once it's a real review" },
        ],
      },
    ],
  },

  /* ---------------------------- Shop settings ---------------------------- */
  {
    id: "shop",
    kind: "form",
    label: "Shop & checkout",
    icon: Store,
    intro: "Your details, the bar at the very top, prices for extras, shipping, discount codes and payment.",
    file: "settings",
    base: [],
    preview: "/cart",
    fields: [
      { type: "heading", label: "Your shop" },
      { type: "row", fields: [
        { type: "text", path: ["site", "name"], label: "Shop name" },
        { type: "text", path: ["site", "designer"], label: "Designer" },
      ] },
      { type: "row", fields: [
        { type: "text", path: ["site", "email"], label: "Email" },
        { type: "text", path: ["site", "location"], label: "Location" },
      ] },
      { type: "text", path: ["site", "tagline"], label: "Tagline" },
      { type: "text", path: ["site", "description"], label: "Short description", hint: "Shown by Google and when the link is shared", long: true, rows: 2 },
      { type: "text", path: ["site", "responseTime"], label: "Reply time", hint: "Shown on the contact page" },
      { type: "row", fields: [
        { type: "text", path: ["site", "socials", "instagram"], label: "Instagram link" },
        { type: "text", path: ["site", "socials", "tiktok"], label: "TikTok link" },
      ] },
      { type: "text", path: ["site", "socials", "pinterest"], label: "Pinterest link" },
      { type: "strings", path: ["site", "announcements"], label: "Announcement bar", hint: "The scrolling bar at the very top of every page", addLabel: "Add a message" },
      { type: "heading", label: "Prices and extras" },
      { type: "row", fields: [
        { type: "number", path: ["shop", "freeShippingThreshold"], label: "Free shipping over", prefix: "$", min: 0 },
        { type: "number", path: ["shop", "taxRate"], label: "Tax", suffix: "%", step: 0.1, min: 0, hint: "0 = no tax added" },
      ] },
      { type: "row", fields: [
        { type: "number", path: ["shop", "giftWrapPrice"], label: "Gift wrap", prefix: "$", min: 0 },
        { type: "number", path: ["shop", "personalizationPrice"], label: "Woven name", prefix: "$", min: 0 },
      ] },
      { type: "row", fields: [
        { type: "number", path: ["shop", "customBasePrice"], label: "Custom design price", prefix: "$", min: 0, hint: "For the smallest size, before size extras" },
        { type: "number", path: ["shop", "lowStockAt"], label: "\"Only a few left\" at", min: 0, suffix: "or less" },
      ] },
      { type: "heading", label: "Shipping" },
      {
        type: "repeater",
        path: ["shippingMethods"],
        label: "Shipping options",
        itemTitle: (x) => `${x.label}, ${x.price ? money(x.price) : "Free"}`,
        newItem: () => ({ id: `ship-${Date.now().toString(36)}`, label: "New option", description: "", price: 10, freeOverThreshold: false }),
        addLabel: "Add a shipping option",
        fields: [
          { type: "text", path: ["label"], label: "Name" },
          { type: "text", path: ["description"], label: "Description" },
          { type: "number", path: ["price"], label: "Price", prefix: "$", min: 0 },
          { type: "toggle", path: ["freeOverThreshold"], label: "Free over the free-shipping amount" },
        ],
      },
      { type: "heading", label: "Discount codes" },
      {
        type: "repeater",
        path: ["discountCodes"],
        label: "Codes",
        hint: "Customers type these at checkout",
        itemTitle: (x) => `${x.code}, ${x.percent}% off`,
        newItem: () => ({ code: "NEWCODE", percent: 10, label: "10% off" }),
        addLabel: "Add a code",
        fields: [
          { type: "row", fields: [
            { type: "text", path: ["code"], label: "Code", hint: "Capitals, no spaces" },
            { type: "number", path: ["percent"], label: "Discount", suffix: "%", min: 1, max: 100 },
          ] },
          { type: "text", path: ["label"], label: "What the customer sees" },
        ],
      },
      { type: "heading", label: "Payment" },
      { type: "text", path: ["payments", "etransferLabel"], label: "e-Transfer name" },
      { type: "text", path: ["payments", "etransferInstructions"], label: "e-Transfer instructions", long: true, rows: 3, hint: "Shown after ordering and in the order email" },
      { type: "text", path: ["payments", "cardLabel"], label: "Card payment name" },
    ],
  },

  /* ---------------------------- Sizes & beads ---------------------------- */
  {
    id: "sizes",
    kind: "form",
    label: "Sizes & beads",
    icon: Ruler,
    intro: "Bracelet widths (in rows of beads) and how much each adds to the price.",
    file: "settings",
    base: [],
    preview: "/size-guide",
    fields: [
      {
        type: "repeater",
        path: ["sizes"],
        label: "Sizes",
        hint: "Price extra is added to the bracelet price. Use a minus for less, e.g. -6",
        itemTitle: (x) => `${x.label}, ${x.rows} rows, ${x.priceAdd >= 0 ? "+" : "−"}${money(Math.abs(x.priceAdd))}`,
        newItem: (c) => ({ id: `size-${(c.settings?.sizes?.length ?? 0) + 1}`, label: "New size", rows: 30, priceAdd: 30 }),
        addLabel: "Add a size",
        fields: [
          { type: "row", fields: [
            { type: "text", path: ["label"], label: "Name" },
            { type: "number", path: ["rows"], label: "Width", suffix: "rows", min: 3, max: 40 },
          ] },
          { type: "row", fields: [
            { type: "number", path: ["priceAdd"], label: "Price extra", prefix: "$" },
            { type: "text", path: ["id"], label: "Code", hint: "Don't change once orders exist" },
          ] },
        ],
      },
      { type: "select", path: ["defaultSize"], label: "Size picked at first", options: sizeOptions },
      { type: "heading", label: "Beads" },
      { type: "text", path: ["beads", "name"], label: "Bead type" },
      { type: "row", fields: [
        { type: "number", path: ["beads", "standardLength"], label: "Standard length", suffix: "beads", min: 20, max: 120 },
        { type: "number", path: ["beads", "extenderCm"], label: "Extender chain", suffix: "cm", step: 0.5, min: 0 },
      ] },
      { type: "row", fields: [
        { type: "number", path: ["beads", "beadWidthMm"], label: "One bead, along the band", suffix: "mm", step: 0.1, min: 0.5 },
        { type: "number", path: ["beads", "beadHeightMm"], label: "One row, across the band", suffix: "mm", step: 0.1, min: 0.5 },
      ] },
    ],
  },

  /* ----------------------------- Bead colours ---------------------------- */
  {
    id: "beads",
    kind: "form",
    label: "Bead colours",
    icon: SwatchBook,
    intro: "The colours customers can use in Design your own.",
    file: "beadColors",
    base: [],
    preview: "/custom",
    fields: [
      {
        type: "repeater",
        path: ["palette"],
        label: "Colours",
        itemTitle: (x) => `${x.name}, ${x.hex}`,
        newItem: () => ({ id: `c-${Date.now().toString(36)}`, name: "New colour", hex: "#7fb8c9", finish: "opaque" }),
        addLabel: "Add a colour",
        fields: [
          { type: "row", fields: [
            { type: "text", path: ["name"], label: "Name" },
            { type: "select", path: ["finish"], label: "Finish", options: FINISHES },
          ] },
          { type: "color", path: ["hex"], label: "Colour" },
        ],
      },
    ],
  },

  /* ---------------------------- Brand colours ---------------------------- */
  {
    id: "theme",
    kind: "form",
    label: "Brand colours",
    icon: Palette,
    intro: "The colours used across the whole website.",
    file: "theme",
    base: [],
    preview: "/",
    fields: [
      { type: "row", fields: [
        { type: "color", path: ["porcelain"], label: "Page background" },
        { type: "color", path: ["sand"], label: "Soft panels" },
      ] },
      { type: "row", fields: [
        { type: "color", path: ["cocoa"], label: "Text and dark buttons" },
        { type: "color", path: ["espresso"], label: "Darkest brown" },
      ] },
      { type: "row", fields: [
        { type: "color", path: ["lagoon"], label: "Main accent (buttons)" },
        { type: "color", path: ["lagoonDeep"], label: "Accent on hover" },
      ] },
      { type: "row", fields: [
        { type: "color", path: ["clay"], label: "Sale and warnings" },
        { type: "color", path: ["marigold"], label: "Highlights" },
      ] },
    ],
  },

  /* ----------------------------- Page texts ----------------------------- */
  {
    id: "pages",
    kind: "form",
    label: "Page titles & policies",
    icon: ScrollText,
    intro: "The title and intro at the top of each page, and your shipping, returns and privacy policies.",
    file: "pages",
    base: [],
    preview: "/policies",
    fields: [
      ...(
        [
          ["shop", "Shop"],
          ["collections", "Collections"],
          ["custom", "Design your own"],
          ["contact", "Contact"],
          ["faq", "Questions"],
          ["sizeGuide", "Sizes"],
        ] as const
      ).flatMap(([k, name]): Field[] => [
        { type: "heading", label: `${name} page` },
        titleText([k, "title"]),
        introText([k, "intro"]),
      ]),
      { type: "heading", label: "Policies page" },
      titleText(["policies", "title"]),
      introText(["policies", "intro"]),
      {
        type: "repeater",
        path: ["policies", "sections"],
        label: "Policies",
        hint: "Leave an empty line between paragraphs",
        itemTitle: (x) => x.title,
        newItem: () => ({ id: `policy-${Date.now().toString(36)}`, title: "New policy", text: "Lorem ipsum dolor sit amet." }),
        addLabel: "Add a policy",
        fields: [titleText(["title"]), { type: "text", path: ["text"], label: "Text", long: true, rows: 8 }],
      },
    ],
  },
]

export const sectionById = (id: string) => SECTIONS.find((s) => s.id === id) ?? SECTIONS[0]
export { slugify }
