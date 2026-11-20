import { formatPrice } from "@/lib/format"
import type { Totals } from "@/lib/pricing"

export function TotalsList({ totals, shippingKnown = true }: { totals: Totals; shippingKnown?: boolean }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between text-cocoa/80">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatPrice(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-lagoon">
          <dt>Discount</dt>
          <dd className="tabular-nums">−{formatPrice(totals.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between text-cocoa/80">
        <dt>Shipping</dt>
        <dd className="tabular-nums">
          {!shippingKnown ? "Calculated at checkout" : totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}
        </dd>
      </div>
      {totals.tax > 0 && (
        <div className="flex justify-between text-cocoa/80">
          <dt>Tax</dt>
          <dd className="tabular-nums">{formatPrice(totals.tax)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t pt-4 text-cocoa">
        <dt className="font-medium">Total</dt>
        <dd className="font-display text-3xl tabular-nums">{formatPrice(totals.total)}</dd>
      </div>
    </dl>
  )
}
