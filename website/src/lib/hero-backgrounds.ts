/* Background colours for the home page banner (the one with the falling beads and the loom).
   Pick one in the website editor: Home page → Background colour. */

export type HeroBackground = {
  id: string
  name: string
  group: "logo" | "light" | "dark"
  /** light backgrounds get dark text, a light loom and light glass */
  light: boolean
  /** the colour (or gradient) behind everything */
  base: string
  /** soft glows: top right, bottom left, middle */
  glows: [string, string, string]
}

export const HERO_BACKGROUNDS: HeroBackground[] = [
  // colours taken from the logo
  { id: "logo-paper", name: "Logo paper", group: "logo", light: true, base: "#f8f2ea", glows: ["rgb(63 138 134 / .16)", "rgb(201 105 76 / .14)", "rgb(214 163 74 / .14)"] },
  { id: "linen-wood", name: "Linen wood", group: "logo", light: true, base: "#ece1d1", glows: ["rgb(214 163 74 / .26)", "rgb(63 138 134 / .16)", "rgb(167 143 117 / .2)"] },
  { id: "sea-glass", name: "Sea glass", group: "logo", light: true, base: "#dcebe7", glows: ["rgb(63 138 134 / .3)", "rgb(201 105 76 / .12)", "rgb(255 255 255 / .35)"] },
  { id: "terracotta-blush", name: "Terracotta blush", group: "logo", light: true, base: "#f5e0d6", glows: ["rgb(201 105 76 / .24)", "rgb(214 163 74 / .2)", "rgb(255 255 255 / .3)"] },
  { id: "honey", name: "Honey", group: "logo", light: true, base: "#f7ebd2", glows: ["rgb(214 163 74 / .32)", "rgb(63 138 134 / .14)", "rgb(255 255 255 / .3)"] },
  { id: "logo-blend", name: "Logo blend", group: "logo", light: true, base: "linear-gradient(125deg, #d9ebe7 0%, #f8f2ea 46%, #f5dfd4 100%)", glows: ["rgb(63 138 134 / .14)", "rgb(201 105 76 / .14)", "rgb(214 163 74 / .12)"] },
  // other light colours
  { id: "cream", name: "Cream", group: "light", light: true, base: "#f4ece1", glows: ["rgb(46 124 121 / .22)", "rgb(198 90 66 / .2)", "rgb(215 161 59 / .18)"] },
  { id: "blush", name: "Blush", group: "light", light: true, base: "#f3e2dc", glows: ["rgb(198 90 66 / .2)", "rgb(169 143 214 / .26)", "rgb(215 161 59 / .14)"] },
  { id: "sage", name: "Sage", group: "light", light: true, base: "#e4e9dc", glows: ["rgb(110 150 90 / .26)", "rgb(214 163 74 / .18)", "rgb(255 255 255 / .3)"] },
  { id: "powder-blue", name: "Powder blue", group: "light", light: true, base: "#e2eaf3", glows: ["rgb(64 96 200 / .18)", "rgb(63 138 134 / .18)", "rgb(255 255 255 / .35)"] },
  { id: "lavender-mist", name: "Lavender mist", group: "light", light: true, base: "#ece6f3", glows: ["rgb(169 143 214 / .32)", "rgb(220 140 150 / .18)", "rgb(255 255 255 / .3)"] },
  { id: "stone", name: "Stone", group: "light", light: true, base: "#ebe7e1", glows: ["rgb(63 138 134 / .12)", "rgb(201 105 76 / .1)", "rgb(255 255 255 / .3)"] },
  // dark colours
  { id: "espresso", name: "Espresso", group: "dark", light: false, base: "#1f130e", glows: ["rgb(46 124 121 / .3)", "rgb(198 90 66 / .25)", "rgb(215 161 59 / .1)"] },
  { id: "deep-lagoon", name: "Deep lagoon", group: "dark", light: false, base: "#0b2523", glows: ["rgb(46 124 121 / .5)", "rgb(215 161 59 / .2)", "rgb(251 243 232 / .06)"] },
  { id: "midnight-blue", name: "Midnight blue", group: "dark", light: false, base: "#0b1230", glows: ["rgb(64 96 200 / .42)", "rgb(198 90 66 / .24)", "rgb(215 161 59 / .1)"] },
  { id: "aubergine", name: "Aubergine", group: "dark", light: false, base: "#1e0c1b", glows: ["rgb(150 56 118 / .42)", "rgb(215 161 59 / .18)", "rgb(46 124 121 / .14)"] },
  { id: "forest", name: "Forest", group: "dark", light: false, base: "#0c1c14", glows: ["rgb(47 143 67 / .34)", "rgb(215 161 59 / .22)", "rgb(251 243 232 / .05)"] },
  { id: "charcoal", name: "Charcoal", group: "dark", light: false, base: "#121214", glows: ["rgb(46 124 121 / .24)", "rgb(198 90 66 / .16)", "rgb(255 255 255 / .05)"] },
  { id: "ocean", name: "Ocean", group: "dark", light: false, base: "linear-gradient(135deg, #0a1d3c 0%, #0b3442 55%, #0d4846 100%)", glows: ["rgb(46 170 170 / .34)", "rgb(64 96 200 / .3)", "rgb(251 243 232 / .05)"] },
]

export const DEFAULT_HERO_BACKGROUND = "honey"

export const heroBackground = (id?: string): HeroBackground =>
  HERO_BACKGROUNDS.find((b) => b.id === id) ?? HERO_BACKGROUNDS.find((b) => b.id === DEFAULT_HERO_BACKGROUND)!

export const HERO_BACKGROUND_GROUPS: { id: HeroBackground["group"]; label: string }[] = [
  { id: "logo", label: "From the logo" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
]
