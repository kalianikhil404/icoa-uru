"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, Check, ChevronDown, ExternalLink, Loader2, Mail, Megaphone, Send, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { api, date, ErrorNote, field, Loading, Panel, useApi } from "./ui"

type Settings = {
  provider: "off" | "gmail" | "smtp" | "resend"
  fromName: string
  fromEmail: string
  user: string
  pass: string
  host: string
  port: number
  secure: boolean
  resendKey: string
  replyTo: string
  notifyEmail: string
  siteUrl: string
  mailingAddress: string
  timezone: string
  hasPass: boolean
  hasResendKey: boolean
}
type Template = { enabled: boolean; subject: string; heading: string; message: string; button?: string }
type Newsletter = Template & { products: "newest" | "featured" | "none"; productCount: number; offer: string; frequency: "off" | "daily" | "weekly" | "monthly"; weekday: number; hour: number }
type Templates = Record<"orderReceived" | "orderAlert" | "paid" | "weaving" | "shipped" | "delivered" | "cancelled" | "welcome", Template> & { newsletter: Newsletter }
type State = { settings: Settings; templates: Templates; ready: boolean; log: { at: string; sent: number; failed: number; subject: string }[]; subscribers: number; dueNow: boolean }

const AUTOMATIC: { id: keyof Omit<Templates, "newsletter">; title: string; when: string; to: string }[] = [
  { id: "orderReceived", title: "Order received", when: "Right after someone orders", to: "Customer" },
  { id: "orderAlert", title: "New order alert", when: "Right after someone orders", to: "You" },
  { id: "paid", title: "Payment received", when: "When you mark an order Paid", to: "Customer" },
  { id: "weaving", title: "On the loom", when: "When you mark an order Weaving", to: "Customer" },
  { id: "shipped", title: "Shipped", when: "When you mark an order Shipped", to: "Customer" },
  { id: "delivered", title: "Delivered", when: "When you mark an order Delivered", to: "Customer" },
  { id: "cancelled", title: "Cancelled", when: "When you mark an order Cancelled", to: "Customer" },
  { id: "welcome", title: "Welcome", when: "When someone signs up for emails", to: "Subscriber" },
]
const WORDS = ["{first_name}", "{order_number}", "{total}", "{tracking_number}", "{carrier}", "{message}", "{shop_name}"]
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const ZONES = ["America/Toronto", "America/Halifax", "America/St_Johns", "America/Winnipeg", "America/Regina", "America/Edmonton", "America/Vancouver"]

export function Emails({ onReady }: { onReady?: (ready: boolean) => void }) {
  const { data, error, reload, setData } = useApi<State>("/api/admin/email")
  useEffect(() => {
    if (data) onReady?.(data.ready)
  }, [data, onReady])
  if (error) return <ErrorNote message={error} onRetry={reload} />
  if (!data) return <Loading rows={6} />
  return (
    <div className="space-y-5">
      <Setup state={data} onSaved={setData} />
      <Newsletter state={data} onSaved={setData} />
      <Automatic state={data} onSaved={setData} />
    </div>
  )
}

/* ---------------- connecting an email account ---------------- */

function Setup({ state, onSaved }: { state: State; onSaved: (s: State) => void }) {
  const [s, setS] = useState(state.settings)
  const [busy, setBusy] = useState<"" | "save" | "check" | "test">("")
  const [testTo, setTestTo] = useState(state.settings.notifyEmail || state.settings.user)
  const [open, setOpen] = useState(!state.ready)
  const set = (patch: Partial<Settings>) => setS((x) => ({ ...x, ...patch }))
  const dirty = JSON.stringify(s) !== JSON.stringify(state.settings)

  const save = async () => {
    setBusy("save")
    const { ok, data } = await api<State>("/api/admin/email", "PUT", { settings: s })
    setBusy("")
    if (!ok) return toast.error(data.error ?? "Couldn't save.")
    onSaved(data)
    setS(data.settings)
    toast.success("Email settings saved")
  }
  const check = async () => {
    if (dirty) await save()
    setBusy("check")
    const { data } = await api<{ ok: boolean; error?: string }>("/api/admin/email", "POST", { action: "check" })
    setBusy("")
    if (data.ok) toast.success("Connected. Your email account accepted the details.")
    else toast.error("Not connected yet", { description: data.error })
  }
  const test = async () => {
    if (dirty) await save()
    setBusy("test")
    const { data } = await api<{ ok: boolean; preview?: boolean; error?: string }>("/api/admin/email", "POST", { action: "test", template: "orderReceived", to: testTo })
    setBusy("")
    if (data.ok && !data.preview) toast.success(`Test email sent to ${testTo}`, { description: "Check the inbox (and the spam folder, the first time)." })
    else if (data.preview) toast.message("Email isn't connected yet, so it was only shown in the black window.")
    else toast.error("The test didn't send", { description: data.error })
  }

  const providers = [
    { id: "gmail", title: "Gmail", text: "Easiest. Up to about 500 emails a day." },
    { id: "smtp", title: "Other email", text: "Outlook, Zoho, your domain's email… (SMTP)" },
    { id: "resend", title: "Resend", text: "For lots of email. Needs your own domain." },
    { id: "off", title: "Not now", text: "Emails are only shown in the black window." },
  ] as const

  return (
    <section className="overflow-hidden rounded-[24px] border border-cocoa/10 bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-4 p-5 text-left sm:p-6">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", state.ready ? "bg-lagoon/10 text-lagoon" : "bg-marigold/15 text-[#8a5b09]")}>
          {state.ready ? <ShieldCheck className="size-5" /> : <AlertTriangle className="size-5" />}
        </span>
        <span className="flex-1">
          <span className="block font-display text-xl text-cocoa">{state.ready ? "Email is connected" : "Connect your email"}</span>
          <span className="block text-sm text-muted-foreground">
            {state.ready
              ? `Sending as ${state.settings.fromName} <${state.settings.fromEmail || state.settings.user || "Resend"}>`
              : "Until you do, customers don't get order emails. It takes about 5 minutes."}
          </span>
        </span>
        <ChevronDown className={cn("size-5 text-cocoa/40 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="space-y-6 border-t border-cocoa/10 p-5 sm:p-6">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="How to send email">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={s.provider === p.id}
                    onClick={() => set({ provider: p.id })}
                    className={cn("rounded-2xl border p-4 text-left transition-colors", s.provider === p.id ? "border-lagoon bg-lagoon/5 ring-2 ring-lagoon/20" : "border-cocoa/10 hover:bg-porcelain")}
                  >
                    <span className="block font-medium text-cocoa">{p.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{p.text}</span>
                  </button>
                ))}
              </div>

              {s.provider === "gmail" && (
                <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
                  <ol className="space-y-2 rounded-2xl bg-porcelain p-4 text-sm leading-relaxed text-cocoa">
                    <li>
                      <strong>1.</strong> Sign in to the Gmail account the shop will send from.
                    </li>
                    <li>
                      <strong>2.</strong> Turn on <strong>2-Step Verification</strong> (Google Account → Security), if it isn&apos;t on.
                    </li>
                    <li>
                      <strong>3.</strong> Open{" "}
                      <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-lagoon underline">
                        App passwords <ExternalLink className="size-3" />
                      </a>
                      , name it &ldquo;Icoa-Uru website&rdquo; and press Create.
                    </li>
                    <li>
                      <strong>4.</strong> Copy the 16-letter password into the box here. It&apos;s not your normal Gmail password.
                    </li>
                  </ol>
                  <div className="grid gap-3">
                    <Labeled label="Gmail address">
                      <input value={s.user} onChange={(e) => set({ user: e.target.value.trim(), fromEmail: e.target.value.trim() })} className={field} placeholder="icoauru@gmail.com" type="email" />
                    </Labeled>
                    <Labeled label="App password" hint={s.hasPass ? "Saved. Leave empty to keep it." : undefined}>
                      <input value={s.pass} onChange={(e) => set({ pass: e.target.value })} className={cn(field, "font-mono")} placeholder={s.hasPass ? "••••••••••••••••" : "abcd efgh ijkl mnop"} type="password" autoComplete="new-password" />
                    </Labeled>
                  </div>
                </div>
              )}

              {s.provider === "smtp" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Labeled label="Server (SMTP host)" hint="From your email provider's help pages">
                    <input value={s.host} onChange={(e) => set({ host: e.target.value.trim() })} className={field} placeholder="smtp.example.com" />
                  </Labeled>
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <Labeled label="Port">
                      <input value={s.port} onChange={(e) => set({ port: Number(e.target.value) || 587, secure: Number(e.target.value) === 465 })} className={field} inputMode="numeric" />
                    </Labeled>
                    <label className="mt-6 flex items-center gap-2 text-sm text-cocoa">
                      <input type="checkbox" checked={s.secure} onChange={(e) => set({ secure: e.target.checked })} className="size-4 accent-lagoon" /> SSL
                    </label>
                  </div>
                  <Labeled label="Username">
                    <input value={s.user} onChange={(e) => set({ user: e.target.value.trim() })} className={field} />
                  </Labeled>
                  <Labeled label="Password" hint={s.hasPass ? "Saved. Leave empty to keep it." : undefined}>
                    <input value={s.pass} onChange={(e) => set({ pass: e.target.value })} className={field} type="password" autoComplete="new-password" placeholder={s.hasPass ? "••••••••" : ""} />
                  </Labeled>
                  <Labeled label="Send from (email address)">
                    <input value={s.fromEmail} onChange={(e) => set({ fromEmail: e.target.value.trim() })} className={field} type="email" />
                  </Labeled>
                </div>
              )}

              {s.provider === "resend" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Labeled label="Resend API key" hint={s.hasResendKey ? "Saved. Leave empty to keep it." : "resend.com → API Keys"}>
                    <input value={s.resendKey} onChange={(e) => set({ resendKey: e.target.value.trim() })} className={cn(field, "font-mono")} type="password" placeholder={s.hasResendKey ? "re_••••••••" : "re_…"} />
                  </Labeled>
                  <Labeled label="Send from (on your verified domain)">
                    <input value={s.fromEmail} onChange={(e) => set({ fromEmail: e.target.value.trim() })} className={field} placeholder="hello@icoa-uru.com" type="email" />
                  </Labeled>
                </div>
              )}

              {s.provider !== "off" && (
                <div className="grid gap-3 border-t border-cocoa/10 pt-5 sm:grid-cols-2">
                  <Labeled label="Name customers see">
                    <input value={s.fromName} onChange={(e) => set({ fromName: e.target.value })} className={field} />
                  </Labeled>
                  <Labeled label="Send new-order alerts to" hint="Your own inbox">
                    <input value={s.notifyEmail} onChange={(e) => set({ notifyEmail: e.target.value.trim() })} className={field} type="email" placeholder={s.user || "you@example.com"} />
                  </Labeled>
                  <Labeled label="Replies go to (optional)">
                    <input value={s.replyTo} onChange={(e) => set({ replyTo: e.target.value.trim() })} className={field} type="email" />
                  </Labeled>
                  <Labeled label="Your website address" hint="For links and pictures in emails, e.g. https://icoa-uru.vercel.app">
                    <input value={s.siteUrl} onChange={(e) => set({ siteUrl: e.target.value.trim() })} className={field} placeholder="https://" />
                  </Labeled>
                  <Labeled label="Business mailing address" hint="Required in newsletters by Canada's anti-spam law (CASL)">
                    <input value={s.mailingAddress} onChange={(e) => set({ mailingAddress: e.target.value })} className={field} placeholder="123 Street, Toronto ON M5V 1A1" />
                  </Labeled>
                  <Labeled label="Time zone" hint="For the newsletter schedule">
                    <select value={s.timezone} onChange={(e) => set({ timezone: e.target.value })} className={cn(field, "h-10")}>
                      {ZONES.map((z) => (
                        <option key={z} value={z}>
                          {z.replace("America/", "").replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </Labeled>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-cocoa/10 pt-5">
                <button type="button" onClick={() => void save()} disabled={!!busy || !dirty} className="inline-flex h-10 items-center gap-2 rounded-xl bg-cocoa px-4 text-sm text-white disabled:opacity-40">
                  {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save
                </button>
                {(s.provider === "gmail" || s.provider === "smtp") && (
                  <button type="button" onClick={() => void check()} disabled={!!busy} className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm text-cocoa ring-1 ring-cocoa/15 hover:bg-sand">
                    {busy === "check" ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Check connection
                  </button>
                )}
                <span className="ml-auto flex flex-wrap items-center gap-2">
                  <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="Send a test to…" className={cn(field, "h-10 w-56")} aria-label="Test email address" />
                  <button type="button" onClick={() => void test()} disabled={!!busy || !testTo} className="inline-flex h-10 items-center gap-2 rounded-xl bg-lagoon px-4 text-sm text-white disabled:opacity-40">
                    {busy === "test" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send test
                  </button>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ---------------- newsletter ---------------- */

function Newsletter({ state, onSaved }: { state: State; onSaved: (s: State) => void }) {
  const [n, setN] = useState(state.templates.newsletter)
  const [busy, setBusy] = useState<"" | "save" | "test" | "send">("")
  const [confirmSend, setConfirmSend] = useState(false)
  const set = (patch: Partial<Newsletter>) => setN((x) => ({ ...x, ...patch }))
  const dirty = JSON.stringify(n) !== JSON.stringify(state.templates.newsletter)
  const testTo = state.settings.notifyEmail || state.settings.user || state.settings.fromEmail

  const save = async () => {
    setBusy("save")
    const { ok, data } = await api<State>("/api/admin/email", "PUT", { templates: { newsletter: n } })
    setBusy("")
    if (!ok) return toast.error("Couldn't save.")
    onSaved(data)
    toast.success(n.frequency === "off" ? "Newsletter saved" : "Saved. It sends by itself on schedule.")
  }
  const test = async () => {
    if (dirty) await save()
    setBusy("test")
    const { data } = await api<{ ok: boolean; preview?: boolean; error?: string }>("/api/admin/email", "POST", { action: "test", template: "newsletter", to: testTo })
    setBusy("")
    if (data.ok && !data.preview) toast.success(`Test sent to ${testTo}`)
    else if (data.preview) toast.message("Connect your email first; it was only shown in the black window.")
    else toast.error("Didn't send", { description: data.error })
  }
  const sendNow = async () => {
    if (dirty) await save()
    setBusy("send")
    const { data } = await api<{ sent: number; failed: number; lastError: string; total: number }>("/api/admin/email", "POST", { action: "newsletter" })
    setBusy("")
    setConfirmSend(false)
    if (data.failed) toast.error(`Sent ${data.sent} of ${data.total}`, { description: data.lastError })
    else toast.success(`Newsletter sent to ${data.sent} subscriber${data.sent === 1 ? "" : "s"}`)
    const fresh = await api<State>("/api/admin/email", "GET")
    if (fresh.ok) onSaved(fresh.data)
  }

  return (
    <Panel
      title="Newsletter"
      intro={`Goes to the ${state.subscribers} ${state.subscribers === 1 ? "person" : "people"} who signed up. Each email has an Unsubscribe link and your mailing address.`}
      action={
        <span className="flex items-center gap-2 text-sm text-cocoa">
          <Megaphone className="size-4 text-lagoon" /> {n.frequency === "off" ? "Not automatic" : `Every ${n.frequency === "daily" ? "day" : n.frequency === "weekly" ? WEEKDAYS[n.weekday] : "month"} at ${n.hour}:00`}
        </span>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <Labeled label="Send automatically">
            <div className="flex flex-wrap gap-2">
              <select value={n.frequency} onChange={(e) => set({ frequency: e.target.value as Newsletter["frequency"] })} className={cn(field, "h-10 w-auto")} aria-label="How often">
                <option value="off">Off (only when I press Send)</option>
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month (on the 1st)</option>
              </select>
              {n.frequency === "weekly" && (
                <select value={n.weekday} onChange={(e) => set({ weekday: Number(e.target.value) })} className={cn(field, "h-10 w-auto")} aria-label="Day">
                  {WEEKDAYS.map((d, i) => (
                    <option key={d} value={i}>
                      on {d}
                    </option>
                  ))}
                </select>
              )}
              {n.frequency !== "off" && (
                <select value={n.hour} onChange={(e) => set({ hour: Number(e.target.value) })} className={cn(field, "h-10 w-auto")} aria-label="Time">
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      at {h === 0 ? "12 am" : h < 12 ? `${h} am` : h === 12 ? "12 pm" : `${h - 12} pm`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </Labeled>
          {n.frequency === "daily" && (
            <p className="rounded-xl bg-marigold/10 px-3 py-2 text-xs leading-relaxed text-[#7a5410]">
              Daily emails are a lot for most people and lead to more unsubscribes. Weekly or monthly usually works better for a small shop.
            </p>
          )}
          <Labeled label="Subject">
            <input value={n.subject} onChange={(e) => set({ subject: e.target.value })} className={field} />
          </Labeled>
          <Labeled label="Heading">
            <input value={n.heading} onChange={(e) => set({ heading: e.target.value })} className={field} />
          </Labeled>
          <Labeled label="Message">
            <textarea value={n.message} onChange={(e) => set({ message: e.target.value })} rows={4} className={cn(field, "resize-y leading-relaxed")} />
          </Labeled>
          <Labeled label="Offer (optional)" hint="e.g. 10% off this week with code WELCOME10">
            <input value={n.offer} onChange={(e) => set({ offer: e.target.value })} className={field} />
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Bracelets to show">
              <select value={n.products} onChange={(e) => set({ products: e.target.value as Newsletter["products"] })} className={cn(field, "h-10")}>
                <option value="newest">Newest</option>
                <option value="featured">Featured first</option>
                <option value="none">None</option>
              </select>
            </Labeled>
            <Labeled label="How many">
              <input type="number" min={1} max={8} value={n.productCount} onChange={(e) => set({ productCount: Number(e.target.value) || 4 })} className={field} disabled={n.products === "none"} />
            </Labeled>
          </div>
          <Labeled label="Button">
            <input value={n.button ?? ""} onChange={(e) => set({ button: e.target.value })} className={field} />
          </Labeled>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-porcelain p-4">
            <p className="text-xs text-muted-foreground">Preview</p>
            <p className="mt-2 text-sm font-medium text-cocoa">{n.subject.replace("{shop_name}", state.settings.fromName || "Icoa-Uru")}</p>
            <div className="mt-3 rounded-xl bg-white p-4">
              <p className="font-display text-xl text-cocoa">{n.heading}</p>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{n.message.replace("{first_name}", "Sam").replace("{shop_name}", state.settings.fromName || "Icoa-Uru")}</p>
              {n.offer && <p className="mt-3 rounded-lg bg-sand/60 px-3 py-2 text-sm text-cocoa">{n.offer}</p>}
              {n.products !== "none" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {Array.from({ length: Math.min(4, n.productCount) }, (_, i) => (
                    <div key={i} className="aspect-[4/3] rounded-lg bg-sand/70" />
                  ))}
                </div>
              )}
              <span className="mt-3 inline-block rounded-full bg-lagoon px-4 py-2 text-xs text-white">{n.button || "Shop"}</span>
              <p className="mt-3 text-[0.7rem] text-muted-foreground">
                {state.settings.mailingAddress || <span className="text-clay">Add your mailing address in the email setup above</span>}, Unsubscribe
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void save()} disabled={!!busy || !dirty} className="inline-flex h-10 items-center gap-2 rounded-xl bg-cocoa px-4 text-sm text-white disabled:opacity-40">
              {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save
            </button>
            <button type="button" onClick={() => void test()} disabled={!!busy || !testTo} className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm text-cocoa ring-1 ring-cocoa/15 hover:bg-sand">
              {busy === "test" ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />} Send me a test
            </button>
            {!confirmSend ? (
              <button type="button" onClick={() => setConfirmSend(true)} disabled={!!busy || !state.subscribers || !state.ready} className="inline-flex h-10 items-center gap-2 rounded-xl bg-lagoon px-4 text-sm text-white disabled:opacity-40">
                <Send className="size-4" /> Send now
              </button>
            ) : (
              <span className="flex items-center gap-2 rounded-xl bg-lagoon/10 px-3 text-sm text-cocoa">
                Send to {state.subscribers}?
                <button type="button" onClick={() => void sendNow()} disabled={!!busy} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lagoon px-3 text-white">
                  {busy === "send" && <Loader2 className="size-3.5 animate-spin" />} Yes, send
                </button>
                <button type="button" onClick={() => setConfirmSend(false)} className="h-8 rounded-lg px-2 hover:bg-white">
                  Cancel
                </button>
              </span>
            )}
          </div>
          {!state.settings.mailingAddress && n.frequency !== "off" && (
            <p className="text-xs text-clay">Add your business mailing address in the setup above before newsletters go out.</p>
          )}
          {state.log.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-cocoa">Sent so far</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {state.log.slice(0, 6).map((l, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate">{date(l.at, true)}</span>
                    <span className="tabular-nums">
                      {l.sent} sent{l.failed ? `, ${l.failed} failed` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

/* ---------------- automatic order + welcome emails ---------------- */

function Automatic({ state, onSaved }: { state: State; onSaved: (s: State) => void }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <Panel title="Automatic emails" intro="Sent by themselves when something happens. Click one to change its words. Words in {curly brackets} are filled in for each person.">
      <ul className="divide-y divide-cocoa/10">
        {AUTOMATIC.map((a) => (
          <TemplateRow key={a.id} meta={a} tpl={state.templates[a.id]} open={open === a.id} onToggle={() => setOpen(open === a.id ? null : a.id)} state={state} onSaved={onSaved} />
        ))}
      </ul>
    </Panel>
  )
}

function TemplateRow({
  meta,
  tpl,
  open,
  onToggle,
  state,
  onSaved,
}: {
  meta: (typeof AUTOMATIC)[number]
  tpl: Template
  open: boolean
  onToggle: () => void
  state: State
  onSaved: (s: State) => void
}) {
  const [t, setT] = useState(tpl)
  const [busy, setBusy] = useState("")
  const dirty = JSON.stringify(t) !== JSON.stringify(tpl)
  const save = async (next = t) => {
    setBusy("save")
    const { ok, data } = await api<State>("/api/admin/email", "PUT", { templates: { [meta.id]: next } })
    setBusy("")
    if (ok) {
      onSaved(data)
      toast.success(`${meta.title} saved`)
    }
  }
  const test = async () => {
    if (dirty) await save()
    setBusy("test")
    const to = state.settings.notifyEmail || state.settings.user || state.settings.fromEmail
    const { data } = await api<{ ok: boolean; preview?: boolean; skipped?: boolean; error?: string }>("/api/admin/email", "POST", { action: "test", template: meta.id, to })
    setBusy("")
    if (data.skipped) toast.message("This email is switched off, so nothing was sent.")
    else if (data.ok && !data.preview) toast.success(`Test sent to ${meta.id === "orderAlert" ? "your alert address" : to}`)
    else if (data.preview) toast.message("Connect your email first; it was only shown in the black window.")
    else toast.error("Didn't send", { description: data.error })
  }
  return (
    <li className="py-1">
      <div className="flex items-center gap-3 py-2">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <ChevronDown className={cn("size-4 shrink-0 text-cocoa/40 transition-transform", open && "rotate-180")} />
          <span className="min-w-0">
            <span className={cn("block font-medium", t.enabled ? "text-cocoa" : "text-cocoa/40")}>{meta.title}</span>
            <span className="block truncate text-xs text-muted-foreground">
              To {meta.to.toLowerCase()}. {meta.when}.
            </span>
          </span>
        </button>
        <Switch
          checked={t.enabled}
          onCheckedChange={(v) => {
            const next = { ...t, enabled: v }
            setT(next)
            void save(next)
          }}
          aria-label={`${meta.title} on or off`}
        />
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="grid gap-3 pb-4 pl-7">
              <Labeled label="Subject">
                <input value={t.subject} onChange={(e) => setT({ ...t, subject: e.target.value })} className={field} />
              </Labeled>
              <Labeled label="Heading">
                <input value={t.heading} onChange={(e) => setT({ ...t, heading: e.target.value })} className={field} />
              </Labeled>
              <Labeled label="Message" hint="Leave an empty line between paragraphs. The order details are added below it automatically.">
                <textarea value={t.message} onChange={(e) => setT({ ...t, message: e.target.value })} rows={5} className={cn(field, "resize-y leading-relaxed")} />
              </Labeled>
              <div className="flex flex-wrap gap-1">
                {WORDS.map((w) => (
                  <button key={w} type="button" onClick={() => setT({ ...t, message: `${t.message}${t.message.endsWith(" ") || !t.message ? "" : " "}${w}` })} className="rounded-md bg-sand/70 px-2 py-0.5 font-mono text-xs text-cocoa hover:bg-sand">
                    {w}
                  </button>
                ))}
              </div>
              {t.button !== undefined && (
                <Labeled label="Button">
                  <input value={t.button} onChange={(e) => setT({ ...t, button: e.target.value })} className={field} />
                </Labeled>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => void save()} disabled={!!busy || !dirty} className="inline-flex h-9 items-center gap-2 rounded-xl bg-cocoa px-3.5 text-sm text-white disabled:opacity-40">
                  {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save
                </button>
                <button type="button" onClick={() => void test()} disabled={!!busy} className="inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-sm text-cocoa ring-1 ring-cocoa/15 hover:bg-sand">
                  {busy === "test" ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />} Send me a test
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

function Labeled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-cocoa">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}
