import type { Metadata } from "next"
import { CheckoutForm } from "@/components/checkout/checkout-form"

export const metadata: Metadata = { title: "Checkout", robots: { index: false } }

export default function CheckoutPage() {
  return (
    <div className="container-page pt-36 md:pt-40">
      <h1 className="mb-10 font-display text-5xl font-light text-cocoa md:text-6xl">Checkout</h1>
      <CheckoutForm />
    </div>
  )
}
