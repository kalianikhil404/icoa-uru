/* Reads faqs.json — edit questions in the website editor (/admin). */
import data from "./faqs.json"
import type { Faq } from "./types"

export type { Faq }

export const faqCategories: string[] = data.categories
export const faqs = data.items as Faq[]
