/* Reads the page text files — edit them in the website editor (/admin). */
import homeData from "./home.json"
import aboutData from "./about.json"
import pagesData from "./pages.json"
import themeData from "./theme.json"
import type { AboutContent, HomeContent, PagesContent, Theme } from "./types"

export const home = homeData as HomeContent
const aboutRaw = aboutData as AboutContent
export const about: AboutContent = {
  ...aboutRaw,
  mainImage: aboutRaw.mainImage || "/images/brand/logo-full.jpg",
  paragraphs: aboutRaw.paragraphs ?? [],
  values: aboutRaw.values ?? [],
}
export const pages = pagesData as PagesContent
export const theme = themeData as Theme
