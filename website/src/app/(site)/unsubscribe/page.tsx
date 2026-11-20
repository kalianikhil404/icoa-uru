import type { Metadata } from "next"
import { Suspense } from "react"
import { Unsubscribe } from "@/components/orders/unsubscribe"

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } }

export default function UnsubscribePage() {
  return (
    <div className="container-page max-w-lg pt-40 pb-10">
      <Suspense>
        <Unsubscribe />
      </Suspense>
    </div>
  )
}
