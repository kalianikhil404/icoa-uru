import { beads, sizes, widthCm } from "@/content/site"
import { formatPrice } from "@/lib/format"

/** Bracelet widths: Mini 5 rows → Large 25 rows (edit them in the website editor). */
export function SizeTable() {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <table className="w-full text-sm">
        <thead className="bg-sand/60 text-left text-cocoa">
          <tr>
            <th className="px-4 py-3 font-medium">Size</th>
            <th className="px-4 py-3 font-medium">Beads wide</th>
            <th className="px-4 py-3 font-medium">Approx. width</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="px-4 py-3 font-medium text-cocoa">{s.label}</td>
              <td className="px-4 py-3 text-muted-foreground tabular-nums">{s.rows} rows</td>
              <td className="px-4 py-3 text-muted-foreground tabular-nums">{widthCm(s.rows)}</td>
              <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                {s.priceAdd === 0 ? "Base price" : `${s.priceAdd > 0 ? "+" : "−"}${formatPrice(Math.abs(s.priceAdd))}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t bg-white/50 px-4 py-2.5 text-xs text-muted-foreground">
        Woven with {beads.name} ({beads.beadWidthMm} mm × {beads.beadHeightMm} mm). Widths are approximate.
      </p>
    </div>
  )
}
