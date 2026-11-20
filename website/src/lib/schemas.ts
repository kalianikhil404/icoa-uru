import { z } from "zod"

/* Form rules shared by the browser (instant feedback) and the server (safety). */

export const contactSchema = z.object({
  type: z.enum(["contact", "custom", "newsletter"]).default("contact"),
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.email("Enter a valid email address"),
  topic: z.string().max(60).optional(),
  orderNumber: z.string().max(30).optional(),
  deadline: z.string().max(30).optional(),
  message: z.string().trim().min(1, "Write a short message").max(4000),
  /** Spam trap: real people never fill this hidden field */
  company: z.string().max(0).optional(),
})
export type ContactInput = z.infer<typeof contactSchema>

const designSchema = z.object({
  rows: z.number().int().min(3).max(40),
  cols: z.number().int().min(10).max(120),
  cells: z.string().regex(/^[0-9a-f]+$/).max(4800),
})

export const orderItemSchema = z.object({
  productId: z.string().max(40),
  quantity: z.number().int().min(1).max(20),
  size: z.string().max(20).optional(),
  personalization: z.string().max(10).optional(),
  giftWrap: z.boolean().optional(),
  design: designSchema.optional(),
})

export const checkoutSchema = z.object({
  email: z.email("Enter a valid email address"),
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName: z.string().trim().min(1, "Required").max(60),
  phone: z.string().max(30).optional(),
  address1: z.string().trim().min(1, "Required").max(120),
  address2: z.string().max(120).optional(),
  city: z.string().trim().min(1, "Required").max(80),
  province: z.string().trim().min(1, "Required").max(40),
  postalCode: z.string().trim().min(3, "Enter a postal code").max(12),
  country: z.string().trim().min(1).max(60),
  shippingId: z.string().min(1),
  paymentMethod: z.enum(["etransfer", "card"]),
  giftNote: z.string().max(300).optional(),
  note: z.string().max(1000).optional(),
  company: z.string().max(0).optional(),
})
export type CheckoutInput = z.infer<typeof checkoutSchema>

export const orderRequestSchema = checkoutSchema.extend({
  items: z.array(orderItemSchema).min(1).max(30),
  discountCode: z.string().max(30).nullable().optional(),
  /** anonymous id of this browser, to connect the order to what they looked at */
  visitorId: z.string().max(64).optional(),
  /** ticked "email me new patterns and offers" */
  marketingConsent: z.boolean().optional(),
})
export type OrderRequest = z.infer<typeof orderRequestSchema>
