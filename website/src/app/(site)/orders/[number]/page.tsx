import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { OrderPage } from "@/components/orders/order-page"

export const metadata: Metadata = { title: "Your order", robots: { index: false } }

export default async function OneOrderPage({ params }: PageProps<"/orders/[number]">) {
  const { number } = await params
  const orderNumber = decodeURIComponent(number).toUpperCase()
  return (
    <>
      <PageHeader title={`Order ${orderNumber}`} crumbs={[{ label: "My orders", href: "/orders" }, { label: orderNumber }]} />
      <div className="container-page mt-12 max-w-5xl">
        <Suspense>
          <OrderPage orderNumber={orderNumber} />
        </Suspense>
      </div>
    </>
  )
}
