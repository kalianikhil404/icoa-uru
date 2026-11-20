"use client"

import Image from "next/image"
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  BarChart3,
  Check,
  Copy,
  Database,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Mail,
  MailCheck,
  PackageOpen,
  PenLine,
  Users,
  Wifi,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Orders } from "./orders"
import { Customers, Subscribers } from "./people"
import { Visitors } from "./visitors"
import { Emails } from "./emails"
import { DailyBars, ErrorNote, go, Loading, money, Panel, Stat, StatusPill, date, useApi, useRoute } from "./ui"

type Overview = {
  toDo: number
  newOrders: number
  revenue30: number
  orders30: number
  subscribers: number
  visitors30: number
  live: number
  daily: { date: string; visitors: number; views: number; orders: number }[]
  latest: { orderNumber: string; name: string; total: number; status: string; createdAt: string }[]
  emailReady: boolean
  storage: { kind: "files" | "database" | "temporary"; where: string }
}

export type Wifi = { url: string | null; qr: string | null; others: string[] } | null

const NAV = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "orders", label: "Orders", Icon: PackageOpen },
  { id: "customers", label: "Customers", Icon: Users },
  { id: "subscribers", label: "Subscribers", Icon: MailCheck },
  { id: "visitors", label: "Visitors", Icon: BarChart3 },
  { id: "emails", label: "Emails", Icon: Mail },
] as const

/** The shop's back office: orders, people, visitors and emails. */
export function ControlCenter({ wifi, online, shopName }: { wifi: Wifi; online: boolean; shopName: string }) {
  const { section, sub } = useRoute()
  const overview = useApi<Overview>("/api/admin/overview")
  const [emailReady, setEmailReady] = useState<boolean | null>(null)
  const ready = emailReady ?? overview.data?.emailReady ?? false
  const active = NAV.find((n) => n.id === section) ?? NAV[0]
  const toDo = overview.data?.toDo ?? 0

  return (
    <div className="min-h-dvh bg-porcelain text-cocoa md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-30 border-b border-cocoa/10 bg-white/90 backdrop-blur md:h-dvh md:border-r md:border-b-0">
        <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:pt-6 md:pb-5">
          <Image src="/images/brand/logo-mark.png" alt="" width={52} height={52} className="rounded-full" priority />
          <div className="leading-tight">
            <p className="font-display text-xl">{shopName}</p>
            <p className="text-xs text-muted-foreground">Control center</p>
          </div>
        </div>
        <nav aria-label="Sections" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:px-3">
          {NAV.map((n) => {
            const on = n.id === active.id
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => go(n.id)}
                aria-current={on ? "page" : undefined}
                className={cn("relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors", on ? "text-white" : "text-cocoa/80 hover:bg-sand/70")}
              >
                {on && <motion.span layoutId="control-nav" className="absolute inset-0 rounded-xl bg-cocoa" transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} />}
                <n.Icon className="relative size-4" />
                <span className="relative">{n.label}</span>
                {n.id === "orders" && toDo > 0 && (
                  <span className={cn("relative ml-auto rounded-full px-1.5 text-xs tabular-nums", on ? "bg-white/20" : "bg-marigold/25 text-[#7a5410]")}>{toDo}</span>
                )}
                {n.id === "emails" && overview.data && !ready && <span className="relative ml-auto size-2 rounded-full bg-marigold" aria-label="Needs setting up" />}
              </button>
            )
          })}
        </nav>
        <div className="hidden border-t border-cocoa/10 px-3 pt-3 md:block">
          {!online && (
            <a href="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-cocoa/80 hover:bg-sand/70">
              <PenLine className="size-4" /> Website editor
            </a>
          )}
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-cocoa/80 hover:bg-sand/70">
            <ExternalLink className="size-4" /> View website
          </a>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">
          {!(section === "orders" && sub) && !(section === "visitors" && sub) && (
            <h1 className="mb-6 font-display text-[2.2rem] leading-none text-cocoa">{active.label}</h1>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={section + "/" + sub}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {active.id === "overview" && <OverviewPage data={overview.data} error={overview.error} reload={overview.reload} wifi={wifi} online={online} />}
              {active.id === "orders" && <Orders sub={sub} emailReady={ready} />}
              {active.id === "customers" && <Customers />}
              {active.id === "subscribers" && <Subscribers />}
              {active.id === "visitors" && <Visitors sub={sub} />}
              {active.id === "emails" && <Emails onReady={setEmailReady} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function OverviewPage({ data, error, reload, wifi, online }: { data: Overview | null; error: string; reload: () => void; wifi: Wifi; online: boolean }) {
  if (error) return <ErrorNote message={error} onRetry={reload} />
  if (!data) return <Loading rows={6} />
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button type="button" onClick={() => go("orders")} className="text-left">
          <Stat label="Orders to do" value={data.toDo} tone={data.toDo ? "clay" : undefined} hint={data.newOrders ? `${data.newOrders} new, waiting for payment or a look` : "Not paid, weaving or shipped yet"} />
        </button>
        <Stat label="Sales, last 30 days" value={money(data.revenue30)} hint={`${data.orders30} order${data.orders30 === 1 ? "" : "s"}`} />
        <button type="button" onClick={() => go("visitors")} className="text-left">
          <Stat label="Visitors, last 30 days" value={data.visitors30.toLocaleString()} hint={`${data.live} on the site right now`} />
        </button>
        <button type="button" onClick={() => go("subscribers")} className="text-left">
          <Stat label="Subscribers" value={data.subscribers} hint="Signed up for emails" />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Visitors each day" intro="Last 30 days. A dot marks a day with an order.">
          <DailyBars data={data.daily} valueKey="visitors" secondKey="orders" />
        </Panel>
        <Panel title="Latest orders" action={<button type="button" onClick={() => go("orders")} className="text-sm text-lagoon hover:underline">All orders</button>}>
          {!data.latest.length ? (
            <p className="text-sm text-muted-foreground">No orders yet. They show up here the moment someone checks out.</p>
          ) : (
            <ul className="-mx-2 divide-y divide-cocoa/10">
              {data.latest.map((o) => (
                <li key={o.orderNumber}>
                  <button type="button" onClick={() => go(`orders/${o.orderNumber}`)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-porcelain">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-cocoa">{o.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {o.orderNumber}, {date(o.createdAt)}
                      </span>
                    </span>
                    <span className="text-sm tabular-nums">{money(o.total)}</span>
                    <StatusPill status={o.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {(!data.emailReady || data.storage.kind !== "files") && (
        <div className="grid gap-3 md:grid-cols-2">
          {!data.emailReady && (
            <button type="button" onClick={() => go("emails")} className="flex items-start gap-3 rounded-[22px] border border-marigold/40 bg-marigold/10 p-5 text-left">
              <Mail className="mt-0.5 size-5 shrink-0 text-[#8a5b09]" />
              <span>
                <span className="block font-medium text-cocoa">Connect your email</span>
                <span className="block text-sm text-muted-foreground">So customers get order confirmations and updates, and you get new-order alerts. About 5 minutes with Gmail.</span>
              </span>
            </button>
          )}
          {data.storage.kind === "temporary" && (
            <div className="flex items-start gap-3 rounded-[22px] border border-clay/30 bg-clay/5 p-5">
              <Database className="mt-0.5 size-5 shrink-0 text-clay" />
              <span>
                <span className="block font-medium text-cocoa">Orders aren&apos;t being kept online</span>
                <span className="block text-sm text-muted-foreground">
                  In Vercel, open your project → Storage → add Upstash (Redis, free) and connect it. Then publish again. The README explains it.
                </span>
              </span>
            </div>
          )}
          {data.storage.kind === "database" && (
            <div className="flex items-start gap-3 rounded-[22px] border border-cocoa/10 bg-white p-5">
              <Database className="mt-0.5 size-5 shrink-0 text-lagoon" />
              <span className="text-sm text-muted-foreground">Orders, subscribers and visits are kept in your online database.</span>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {!online && wifi && <WifiCard wifi={wifi} />}
        <Panel title="Put it on the internet" intro="So anyone can visit, not just your WiFi.">
          <ol className="space-y-2.5 text-sm leading-relaxed">
            <li>
              <span className="font-medium">1.</span> Make your changes in the{" "}
              <a href="/admin" className="text-lagoon hover:underline">
                website editor
              </a>
              .
            </li>
            <li>
              <span className="font-medium">2.</span> Double-click <span className="font-medium">Publish Website.bat</span> in the website folder. The first time it asks you to sign in to Vercel (free).
            </li>
            <li>
              <span className="font-medium">3.</span> To see orders from the live website, open <span className="font-medium">/control</span> on it and enter your ADMIN_PASSWORD.
            </li>
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">The README in the folder explains each step, including your own domain name and keeping orders online.</p>
        </Panel>
      </div>
    </div>
  )
}

function WifiCard({ wifi }: { wifi: NonNullable<Wifi> }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-espresso p-6 text-porcelain sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-lagoon/30 blur-3xl" />
      <p className="relative flex items-center gap-2 text-sm text-porcelain/70">
        <Wifi className="size-4" /> Open it on phones and other computers on your WiFi
      </p>
      {wifi.url ? (
        <div className="relative mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[clamp(1.3rem,3vw,2.1rem)] leading-tight break-all">{wifi.url.replace("http://", "")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(wifi.url!)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-porcelain px-4 text-sm font-medium text-espresso"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy address"}
              </button>
              <a href={wifi.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-porcelain/10 px-4 text-sm hover:bg-porcelain/20">
                Open <Globe className="size-4" />
              </a>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-porcelain/65">
              Type it into a browser on any device on the same WiFi, or scan the code with a phone camera. If it won&apos;t open, allow Node.js on private networks in Windows Firewall.
            </p>
            {wifi.others.length > 0 && <p className="mt-2 text-xs text-porcelain/45">Other addresses of this computer: {wifi.others.join(", ")}</p>}
          </div>
          {wifi.qr && <div className="w-36 shrink-0 rounded-2xl bg-porcelain p-3 [&>svg]:h-auto [&>svg]:w-full" role="img" aria-label={`QR code for ${wifi.url}`} dangerouslySetInnerHTML={{ __html: wifi.qr }} />}
        </div>
      ) : (
        <p className="relative mt-4 text-porcelain/80">This computer isn&apos;t on a WiFi network right now. Connect to WiFi and reload this page.</p>
      )}
    </div>
  )
}
