"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "motion/react"
import { AlertCircle, CreditCard, Landmark, Loader2, Lock, Store, Truck, Zap } from "lucide-react"
import { checkoutSchema, type CheckoutInput } from "@/lib/schemas"
import { payments, shippingMethods, sizeLabel } from "@/content/site"
import { useCart } from "@/lib/stores"
import { calcTotals } from "@/lib/pricing"
import { formatPrice } from "@/lib/format"
import { useMounted } from "@/hooks/use-mounted"
import { DiscountField } from "@/components/cart/discount-field"
import { TotalsList } from "@/components/cart/totals-list"
import { DesignPreview } from "@/components/custom/design-preview"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { rememberOrder, track, visitorId } from "@/lib/track"

const PROVINCES = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"]
const SHIP_ICONS: Record<string, typeof Truck> = { standard: Truck, express: Zap, pickup: Store }

export function CheckoutForm() {
  const mounted = useMounted()
  const router = useRouter()
  const items = useCart((s) => s.items)
  const discountCode = useCart((s) => s.discountCode)
  const clear = useCart((s) => s.clear)
  const [serverError, setServerError] = useState("")
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    track("checkout_start")
  }, [])

  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      address1: "",
      address2: "",
      city: "",
      province: "ON",
      postalCode: "",
      country: "Canada",
      shippingId: shippingMethods[0].id,
      paymentMethod: "etransfer" as const,
      giftNote: "",
      note: "",
      company: "",
    },
  })
  const { register, control, handleSubmit, formState } = form
  const err = formState.errors
  const shippingId = useWatch({ control, name: "shippingId" })
  const paymentMethod = useWatch({ control, name: "paymentMethod" })
  const totals = calcTotals(mounted ? items : [], { shippingId, discountCode })

  if (mounted && items.length === 0) {
    return (
      <div className="rounded-[32px] border bg-white/60 p-12 text-center">
        <p className="font-display text-3xl text-cocoa">Your bag is empty</p>
        <p className="mt-2 text-muted-foreground">Add a bracelet before checking out.</p>
        <Link href="/shop" className="mt-6 inline-flex h-12 items-center rounded-full bg-lagoon px-6 text-white">
          Shop bracelets
        </Link>
      </div>
    )
  }

  async function onSubmit(values: CheckoutInput) {
    setServerError("")
    const payload = {
      ...values,
      discountCode,
      visitorId: visitorId(),
      marketingConsent: marketing,
      items: items.map(({ productId, quantity, size, personalization, giftWrap, design }) => ({
        productId,
        quantity,
        size,
        personalization,
        giftWrap,
        design,
      })),
    }
    const endpoint = values.paymentMethod === "card" ? "/api/checkout" : "/api/orders"
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (!res?.ok || !data) {
      setServerError(data?.error ?? "We couldn't place your order. Check your connection and try again.")
      return
    }
    if (data.url) {
      window.location.assign(data.url) // Stripe checkout
      return
    }
    try {
      sessionStorage.setItem(
        "icoa-last-order",
        JSON.stringify({ ...data, email: values.email, firstName: values.firstName, paymentMethod: values.paymentMethod })
      )
    } catch {
      // storage can be unavailable (private mode); the confirmation page still works
    }
    rememberOrder(data.orderNumber, data.key)
    clear()
    router.push(`/checkout/success?order=${data.orderNumber}&k=${encodeURIComponent(data.key ?? "")}`)
  }

  const field = "h-12 rounded-2xl bg-white/80 px-4"

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-7">
        <Section n={1} title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" className={field} aria-invalid={!!err.email} {...register("email")} />
              <FieldError message={err.email?.message} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="phone">Phone (optional, for delivery questions)</Label>
              <Input id="phone" type="tel" autoComplete="tel" className={field} {...register("phone")} />
            </div>
            <Label className="flex cursor-pointer items-start gap-3 font-normal leading-snug text-cocoa sm:col-span-2">
              <Checkbox checked={marketing} onCheckedChange={(v) => setMarketing(v === true)} className="mt-0.5" />
              <span>
                Email me new patterns and offers <span className="text-muted-foreground">(optional, unsubscribe any time)</span>
              </span>
            </Label>
          </div>
        </Section>

        <Section n={2} title="Shipping address">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" autoComplete="given-name" className={field} aria-invalid={!!err.firstName} {...register("firstName")} />
              <FieldError message={err.firstName?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" autoComplete="family-name" className={field} aria-invalid={!!err.lastName} {...register("lastName")} />
              <FieldError message={err.lastName?.message} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address1">Address</Label>
              <Input id="address1" autoComplete="address-line1" className={field} aria-invalid={!!err.address1} {...register("address1")} />
              <FieldError message={err.address1?.message} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address2">Apartment, suite (optional)</Label>
              <Input id="address2" autoComplete="address-line2" className={field} {...register("address2")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" autoComplete="address-level2" className={field} aria-invalid={!!err.city} {...register("city")} />
              <FieldError message={err.city?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Province</Label>
                <Controller
                  control={control}
                  name="province"
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger className="h-12 w-full rounded-2xl bg-white/80 px-4" aria-label="Province">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {PROVINCES.map((p) => (
                          <SelectItem key={p} value={p} className="rounded-xl">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal code</Label>
                <Input id="postalCode" autoComplete="postal-code" className={cn(field, "uppercase")} aria-invalid={!!err.postalCode} {...register("postalCode")} />
                <FieldError message={err.postalCode?.message} />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" autoComplete="country-name" className={field} {...register("country")} />
            </div>
          </div>
        </Section>

        <Section n={3} title="Delivery">
          <Controller
            control={control}
            name="shippingId"
            render={({ field: f }) => (
              <div role="radiogroup" aria-label="Delivery method" className="grid gap-3">
                {shippingMethods.map((m) => {
                  const Icon = SHIP_ICONS[m.id] ?? Truck
                  const free = m.freeOverThreshold && totals.subtotal > 0 && totals.freeShippingRemaining === 0
                  return (
                    <OptionCard key={m.id} selected={f.value === m.id} onSelect={() => f.onChange(m.id)}>
                      <Icon className="size-5 text-lagoon" />
                      <div className="flex-1">
                        <p className="font-medium text-cocoa">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      </div>
                      <span className="text-sm text-cocoa tabular-nums">{m.price === 0 || free ? "Free" : formatPrice(m.price)}</span>
                    </OptionCard>
                  )
                })}
              </div>
            )}
          />
        </Section>

        <Section n={4} title="Payment">
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field: f }) => (
              <div role="radiogroup" aria-label="Payment method" className="grid gap-3">
                <OptionCard selected={f.value === "etransfer"} onSelect={() => f.onChange("etransfer")}>
                  <Landmark className="size-5 text-lagoon" />
                  <div className="flex-1">
                    <p className="font-medium text-cocoa">{payments.etransfer.label}</p>
                    <p className="text-xs text-muted-foreground">Place your order now; payment instructions are shown next and emailed to you.</p>
                  </div>
                </OptionCard>
                <OptionCard
                  selected={f.value === "card"}
                  disabled={!payments.card.enabled}
                  onSelect={() => payments.card.enabled && f.onChange("card")}
                >
                  <CreditCard className="size-5 text-lagoon" />
                  <div className="flex-1">
                    <p className="font-medium text-cocoa">{payments.card.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {payments.card.enabled ? "Secure payment on the next page" : "Coming soon"}
                    </p>
                  </div>
                </OptionCard>
              </div>
            )}
          />
          <AnimatePresence>
            {paymentMethod === "etransfer" && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-sm leading-relaxed text-muted-foreground"
              >
                <span className="mt-4 block rounded-2xl bg-sand/60 p-4">{payments.etransfer.instructions}</span>
              </motion.p>
            )}
          </AnimatePresence>
        </Section>

        <Section n={5} title="Extras">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="giftNote">Gift note (optional)</Label>
              <Textarea id="giftNote" rows={2} className="rounded-2xl bg-white/80 p-4" placeholder="We'll handwrite it on a card" {...register("giftNote")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Order notes (optional)</Label>
              <Textarea id="note" rows={2} className="rounded-2xl bg-white/80 p-4" {...register("note")} />
            </div>
          </div>
        </Section>
        <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register("company")} />
      </div>

      <aside className="lg:col-span-5">
        <div className="glass space-y-6 rounded-[28px] p-6 lg:sticky lg:top-28 md:p-8">
          <h2 className="font-display text-2xl font-normal text-cocoa">Order summary</h2>
          <ul className="max-h-[300px] space-y-4 overflow-y-auto pr-1">
            {(mounted ? items : []).map((item) => (
              <li key={item.key} className="flex items-center gap-4">
                <span className="relative h-16 w-14 shrink-0 overflow-visible">
                  <span className="relative block size-full overflow-hidden rounded-xl bg-sand">
                    {item.design ? (
                      <span className="grid size-full place-items-center p-1">
                        <DesignPreview design={item.design} vertical className="h-full" />
                      </span>
                    ) : (
                      <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                    )}
                  </span>
                  <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-cocoa text-[0.65rem] text-white tabular-nums">
                    {item.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-cocoa">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {[item.size && sizeLabel(item.size), item.personalization, item.giftWrap && "Gift wrapped"].filter(Boolean).join(", ")}
                  </span>
                </span>
                <span className="text-sm text-cocoa tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <DiscountField />
          <TotalsList totals={totals} />
          {serverError && (
            <p className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" /> {serverError}
            </p>
          )}
          <button
            type="submit"
            disabled={formState.isSubmitting || !mounted}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-lagoon py-3.5 text-[0.95rem] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-lagoon-deep disabled:opacity-60"
          >
            {formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
            {paymentMethod === "card" ? "Continue to payment" : "Place order"}, {formatPrice(totals.total)}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            By placing your order you agree to our{" "}
            <Link href="/policies#terms" className="underline underline-offset-2">
              terms
            </Link>
            .
          </p>
        </div>
      </aside>
    </form>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: n * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[28px] border bg-white/60 p-6 backdrop-blur md:p-8"
    >
      <h2 className="mb-6 flex items-center gap-3 font-display text-2xl font-normal text-cocoa">
        <span className="grid size-8 place-items-center rounded-full bg-cocoa font-sans text-sm text-white tabular-nums">{n}</span>
        {title}
      </h2>
      {children}
    </motion.section>
  )
}

function OptionCard({
  selected,
  disabled,
  onSelect,
  children,
}: {
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-center gap-4 rounded-2xl border bg-white/70 p-4 text-left transition-all",
        selected ? "border-lagoon ring-2 ring-lagoon/20" : "hover:border-cocoa/30",
        disabled && "cursor-not-allowed opacity-50 hover:border-border"
      )}
    >
      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", selected ? "border-lagoon" : "border-cocoa/25")}>
        <AnimatePresence>
          {selected && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="size-2.5 rounded-full bg-lagoon" />}
        </AnimatePresence>
      </span>
      {children}
    </button>
  )
}
