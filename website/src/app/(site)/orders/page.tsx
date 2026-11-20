import type { Metadata } from "next"
import { PageHeader } from "@/components/shared/page-header"
import { MyOrders } from "@/components/orders/my-orders"

export const metadata: Metadata = { title: "My orders", robots: { index: false } }

export default function OrdersPage() {
  return (
    <>
      <PageHeader title="My orders" intro="See where your bracelets are, from the loom to your door." crumbs={[{ label: "My orders" }]} />
      <div className="container-page mt-12">
        <MyOrders />
      </div>
    </>
  )
}
