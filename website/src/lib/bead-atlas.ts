import type { Finish } from "@/lib/seed-bead"

/* ---------- pre-rendered atlas: 12 colours × 16 tumble angles ---------- */
export const ATLAS = {
  src: "/images/beads/seed-bead-atlas.webp",
  cell: 56,
  tilts: 16,
  /** Row order in the atlas image */
  colors: [
    { hex: "#2bb3a7", finish: "opaque" },
    { hex: "#c8202e", finish: "opaque" },
    { hex: "#1d3fa0", finish: "silverlined" },
    { hex: "#f3f0e8", finish: "luster" },
    { hex: "#c9a14a", finish: "metallic" },
    { hex: "#e88aa6", finish: "silverlined" },
    { hex: "#151515", finish: "opaque" },
    { hex: "#9fd6c9", finish: "matte" },
    { hex: "#7fd3e0", finish: "transparent" },
    { hex: "#c65a42", finish: "opaque" },
    { hex: "#f2c230", finish: "opaque" },
    { hex: "#2e7c79", finish: "opaque" },
  ] as { hex: string; finish: Finish }[],
}

