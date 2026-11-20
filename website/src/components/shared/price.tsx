import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

export function Price({
  amount,
  compareAt,
  className,
}: {
  amount: number
  compareAt?: number
  className?: string
}) {
  const onSale = compareAt && compareAt > amount
  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular-nums", className)}>
      <span className={cn(onSale && "text-clay")}>{formatPrice(amount)}</span>
      {onSale && (
        <span className="text-[0.85em] text-muted-foreground line-through decoration-1">{formatPrice(compareAt)}</span>
      )}
    </span>
  )
}
