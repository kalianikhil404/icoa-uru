import type { Metadata } from "next"
import { Suspense } from "react"
import { OrderConfirmation } from "@/components/checkout/order-confirmation"

export const metadata: Metadata = { title: "Thank you", robots: { index: false } }

export default function SuccessPage() {
  return (
    <div className="container-page max-w-3xl pt-36 md:pt-40">
      <Suspense>
        <OrderConfirmation />
      </Suspense>
    </div>
  )
}
