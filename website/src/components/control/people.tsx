"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, Loader2, MailCheck, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { api, date, Empty, ErrorNote, ExportButton, field, go, Loading, money, Search, Stat, useApi } from "./ui"

/* ======================= Customers ======================= */

type Customer = {
  email: string
  name: string
  phone: string
  address: string[]
  orders: number
  spent: number
  firstOrder: string
  lastOrder: string
  lastStatus: string
  subscribed: boolean
  orderNumbers: string[]
}

export function Customers() {
  const { data, error, reload } = useApi<Customer[]>("/api/admin/customers")
  const [q, setQ] = useState("")
  const [open, setOpen] = useState<string | null>(null)
  const list = useMemo(() => (data ?? []).filter((c) => !q || `${c.name} ${c.email} ${c.phone} ${c.address.join(" ")}`.toLowerCase().includes(q.toLowerCase())), [data, q])
  const total = (data ?? []).reduce((s, c) => s + c.spent, 0)
  const repeat = (data ?? []).filter((c) => c.orders > 1).length

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Customers" value={data?.length ?? "…"} />
        <Stat label="Came back for more" value={repeat} hint="Ordered more than once" />
        <Stat label="Spent in total" value={money(total)} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Search value={q} onChange={setQ} placeholder="Search name, email, city" />
        <ExportButton type="customers" />
      </div>
      {error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : !list.length ? (
        <Empty icon={<Users className="size-5" />} title="No customers yet">
          Everyone who orders appears here, with their orders and how much they&apos;ve spent.
        </Empty>
      ) : (
        <ul className="overflow-hidden rounded-[22px] border border-cocoa/10 bg-white">
          {list.map((c) => {
            const isOpen = open === c.email
            return (
              <li key={c.email} className="border-b border-cocoa/10 last:border-0">
                <button type="button" onClick={() => setOpen(isOpen ? null : c.email)} aria-expanded={isOpen} className="flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-porcelain sm:px-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand font-display text-cocoa">{(c.name || c.email)[0]?.toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-cocoa">{c.name || c.email}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {c.email}
                      {c.subscribed && ", gets emails"}
                    </span>
                  </span>
                  <span className="hidden text-right text-sm text-muted-foreground sm:block">
                    {c.orders} order{c.orders === 1 ? "" : "s"}
                    <span className="block text-xs">last {date(c.lastOrder)}</span>
                  </span>
                  <span className="font-display text-lg text-cocoa tabular-nums">{money(c.spent)}</span>
                  <ChevronDown className={cn("size-4 text-cocoa/40 transition-transform", isOpen && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="grid gap-4 bg-porcelain/60 px-5 py-4 text-sm sm:grid-cols-3 sm:pl-[4.25rem]">
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="mt-1 text-cocoa">
                            {c.address.map((a, i) => (
                              <span key={i} className="block">
                                {a}
                              </span>
                            ))}
                          </p>
                          {c.phone && <p className="mt-1 text-cocoa">{c.phone}</p>}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Customer since</p>
                          <p className="mt-1 text-cocoa">{date(c.firstOrder)}</p>
                          <a href={`mailto:${c.email}`} className="mt-2 inline-block text-lagoon hover:underline">
                            Email {c.name.split(" ")[0] || "them"}
                          </a>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Orders</p>
                          <ul className="mt-1 space-y-1">
                            {c.orderNumbers.map((n) => (
                              <li key={n}>
                                <button type="button" onClick={() => go(`orders/${n}`)} className="text-lagoon tabular-nums hover:underline">
                                  {n}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ======================= Subscribers ======================= */

type Subscriber = {
  id: string
  email: string
  name: string
  status: "subscribed" | "unsubscribed"
  source: string
  consent: string
  subscribedAt: string
  unsubscribedAt?: string
  emailsSent: number
  lastEmailedAt?: string
  visitorId?: string
}

export function Subscribers() {
  const { data, error, reload, setData } = useApi<Subscriber[]>("/api/admin/subscribers")
  const [q, setQ] = useState("")
  const [show, setShow] = useState<"subscribed" | "unsubscribed" | "all">("subscribed")
  const [adding, setAdding] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const list = useMemo(
    () => (data ?? []).filter((s) => (show === "all" || s.status === show) && (!q || `${s.email} ${s.name} ${s.source}`.toLowerCase().includes(q.toLowerCase()))),
    [data, q, show]
  )
  const active = (data ?? []).filter((s) => s.status === "subscribed").length
  const [now] = useState(() => Date.now())
  const week = (data ?? []).filter((s) => s.status === "subscribed" && now - new Date(s.subscribedAt).getTime() < 7 * 86400000).length

  const add = async () => {
    setBusy(true)
    const { ok, data: d } = await api("/api/admin/subscribers", "POST", { email, name, agreed })
    setBusy(false)
    if (!ok) return toast.error(d.error ?? "Couldn't add them.")
    toast.success(`Added ${email}`)
    setEmail("")
    setName("")
    setAgreed(false)
    setAdding(false)
    reload()
  }
  const setStatus = async (s: Subscriber, status: Subscriber["status"]) => {
    setData((d) => d?.map((x) => (x.id === s.id ? { ...x, status } : x)) ?? d)
    await api("/api/admin/subscribers", "PATCH", { id: s.id, status })
  }
  const remove = async (s: Subscriber) => {
    if (!confirm(`Delete ${s.email} completely? (To just stop emails, use Unsubscribe instead.)`)) return
    setData((d) => d?.filter((x) => x.id !== s.id) ?? d)
    await api("/api/admin/subscribers", "DELETE", { id: s.id })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Getting your emails" value={data ? active : "…"} tone="lagoon" />
        <Stat label="Joined this week" value={week} />
        <Stat label="Unsubscribed" value={(data ?? []).length - active} hint="Never emailed again" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Search value={q} onChange={setQ} placeholder="Search emails" />
          <select value={show} onChange={(e) => setShow(e.target.value as typeof show)} className="h-10 rounded-xl border border-cocoa/15 bg-white px-3 text-sm" aria-label="Show">
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="all">Everyone</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAdding((a) => !a)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-cocoa px-3 text-sm text-white hover:bg-espresso">
            <Plus className="size-4" /> Add someone
          </button>
          <ExportButton type="subscribers" />
        </div>
      </div>
      <AnimatePresence initial={false}>
        {adding && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault()
              void add()
            }}
          >
            <div className="grid gap-3 rounded-[22px] border border-cocoa/10 bg-white p-5 sm:grid-cols-2">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={field} aria-label="Email" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" className={field} aria-label="Name" />
              <label className="flex items-start gap-2 text-sm text-cocoa sm:col-span-2">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-4 accent-lagoon" />
                They told me they want emails from {`Icoa-Uru`} (for example at a market). Canada&apos;s anti-spam law needs their yes.
              </label>
              <div className="sm:col-span-2">
                <button type="submit" disabled={busy || !agreed} className="inline-flex h-10 items-center gap-2 rounded-xl bg-lagoon px-4 text-sm text-white disabled:opacity-40">
                  {busy && <Loader2 className="size-4 animate-spin" />} Add and send the welcome email
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      {error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : !list.length ? (
        <Empty icon={<MailCheck className="size-5" />} title="No one here yet">
          People join from the sign-up box on the home page and footer, or by ticking &ldquo;Email me new patterns&rdquo; at checkout.
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-[22px] border border-cocoa/10 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-cocoa/10">
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Joined</th>
                <th className="px-3 py-3 font-medium">From</th>
                <th className="px-3 py-3 font-medium">Emails sent</th>
                <th className="px-3 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-cocoa/10 last:border-0">
                  <td className="px-5 py-3">
                    <span className={cn("block", s.status === "unsubscribed" ? "text-cocoa/40 line-through" : "text-cocoa")}>{s.email}</span>
                    {s.name && <span className="block text-xs text-muted-foreground">{s.name}</span>}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{date(s.subscribedAt)}</td>
                  <td className="px-3 py-3 text-muted-foreground">{s.source}</td>
                  <td className="px-3 py-3 text-muted-foreground tabular-nums">
                    {s.emailsSent}
                    {s.lastEmailedAt && <span className="block text-xs">last {date(s.lastEmailedAt)}</span>}
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    {s.visitorId && (
                      <button type="button" onClick={() => go(`visitors/${s.visitorId}`)} className="mr-2 text-xs text-lagoon hover:underline">
                        Browsing
                      </button>
                    )}
                    {s.status === "subscribed" ? (
                      <button type="button" onClick={() => void setStatus(s, "unsubscribed")} className="rounded-lg px-2 py-1 text-xs text-cocoa hover:bg-sand">
                        Unsubscribe
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unsubscribed {s.unsubscribedAt ? date(s.unsubscribedAt) : ""}</span>
                    )}
                    <button type="button" onClick={() => void remove(s)} aria-label={`Delete ${s.email}`} className="ml-1 rounded-lg p-1.5 text-cocoa/50 hover:bg-clay/10 hover:text-clay">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Each sign-up is saved with the date and the words they agreed to, which is your proof of consent. Unsubscribes take effect straight away.
      </p>
    </div>
  )
}

