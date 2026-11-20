/** A pattern drawn on the "Design your own" page.
 *  cells = one hex digit per bead (index into beadPalette), row by row. */
export type CustomDesign = {
  rows: number
  cols: number
  cells: string
}

export type CartItem = {
  /** Unique line id (product + options) */
  key: string
  /** Product id, or "custom" for a design from the builder */
  productId: string
  slug: string
  name: string
  image: string
  unitPrice: number
  quantity: number
  size?: string
  personalization?: string
  giftWrap?: boolean
  design?: CustomDesign
}
