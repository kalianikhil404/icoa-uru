/* Reads testimonials.json — edit reviews in the website editor (/admin). */
import data from "./testimonials.json"
import type { Testimonial } from "./types"

export type { Testimonial }

export const testimonials = data as Testimonial[]
