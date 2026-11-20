/* Reads bead-colors.json — the colours customers paint with on "Design your own". */
import data from "./bead-colors.json"
import type { Finish } from "./types"

export type PaletteBead = { id: string; name: string; hex: string; finish: Finish }

export const beadPalette = data.palette as PaletteBead[]
export const filterSwatches: Record<string, string> = data.filterSwatches
