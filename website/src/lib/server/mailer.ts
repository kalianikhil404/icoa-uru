import "server-only"
import nodemailer, { type Transporter } from "nodemailer"
import { getSetting, setSetting } from "@/lib/server/db"
import { site } from "@/content/site"

/* ------------------------------------------------------------------
   Sending email. Set up in the control center → Emails:
   • Gmail: your Gmail address + a 16-character app password
     (Google account → Security → 2-Step Verification → App passwords).
     Gmail lets you send about 500 emails a day.
   • Other email (SMTP): the server details from your email provider.
   • Resend: an API key from resend.com (best for lots of email, needs
     your own domain to send to everyone).
   Until one is set up, emails are only printed in the black window.
------------------------------------------------------------------- */

export type EmailSettings = {
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
  /** where new-order alerts go */
  notifyEmail: string
  /** your live website address, for links and pictures in emails */
  siteUrl: string
  /** required in promotional emails in Canada (CASL) */
  mailingAddress: string
  timezone: string
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  provider: "off",
  fromName: site.name,
  fromEmail: "",
  user: "",
  pass: "",
  host: "",
  port: 587,
  secure: false,
  resendKey: "",
  replyTo: "",
  notifyEmail: "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost") ? process.env.NEXT_PUBLIC_SITE_URL : "",
  mailingAddress: "",
  timezone: "America/Toronto",
}

export async function getEmailSettings(): Promise<EmailSettings> {
  return { ...DEFAULT_EMAIL_SETTINGS, ...(await getSetting<Partial<EmailSettings>>("email", {})) }
}
export async function saveEmailSettings(next: Partial<EmailSettings>) {
  const current = await getEmailSettings()
  // a blank password/key field means "keep the saved one"
  const merged: EmailSettings = { ...current, ...next }
  if (!next.pass) merged.pass = current.pass
  if (!next.resendKey) merged.resendKey = current.resendKey
  await setSetting("email", merged)
  transporter = null
  return merged
}

/** The settings with secrets hidden, for the control center. */
export function maskSettings(s: EmailSettings) {
  return { ...s, pass: "", resendKey: "", hasPass: !!s.pass, hasResendKey: !!s.resendKey }
}

export async function isEmailReady() {
  const s = await getEmailSettings()
  if (s.provider === "gmail") return !!(s.user && s.pass)
  if (s.provider === "smtp") return !!(s.host && s.user && s.pass)
  if (s.provider === "resend") return !!s.resendKey
  return !!process.env.RESEND_API_KEY
}

export async function ownerAddress() {
  const s = await getEmailSettings()
  return s.notifyEmail || process.env.ORDER_NOTIFY_EMAIL || s.fromEmail || s.user || site.email
}

/** Base address for links in emails. */
export async function siteUrl(fallbackOrigin?: string) {
  const s = await getEmailSettings()
  return (s.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || fallbackOrigin || "http://localhost:3000").replace(/\/+$/, "")
}

let transporter: Transporter | null = null
let transporterKey = ""

function smtpFor(s: EmailSettings) {
  const key = JSON.stringify([s.provider, s.host, s.port, s.secure, s.user, s.pass])
  if (transporter && key === transporterKey) return transporter
  transporterKey = key
  transporter =
    s.provider === "gmail"
      ? nodemailer.createTransport({ service: "gmail", auth: { user: s.user, pass: s.pass.replace(/\s+/g, "") } })
      : nodemailer.createTransport({ host: s.host, port: Number(s.port) || 587, secure: !!s.secure, auth: { user: s.user, pass: s.pass } })
  return transporter
}

export type Mail = {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  /** marketing emails: one-click unsubscribe link for inbox "Unsubscribe" buttons */
  unsubscribeUrl?: string
}

export type SendResult = { ok: boolean; preview?: boolean; error?: string }

export async function sendMail(m: Mail): Promise<SendResult> {
  const s = await getEmailSettings()
  const fromEmail = s.fromEmail || s.user
  const from = fromEmail ? `"${(s.fromName || site.name).replace(/"/g, "")}" <${fromEmail}>` : undefined
  const replyTo = m.replyTo || s.replyTo || undefined
  const text = m.text ?? htmlToText(m.html)
  const headers: Record<string, string> = {}
  if (m.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${m.unsubscribeUrl}>`
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
  }
  try {
    if (s.provider === "gmail" || s.provider === "smtp") {
      if (!s.user || !s.pass) throw new Error("Email isn't connected yet: add the email address and app password in Emails → Setup.")
      await smtpFor(s).sendMail({ from: from ?? s.user, to: m.to, subject: m.subject, html: m.html, text, replyTo, headers })
      return { ok: true }
    }
    const resendKey = s.provider === "resend" ? s.resendKey : process.env.RESEND_API_KEY
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: from ?? process.env.EMAIL_FROM ?? `${site.name} <onboarding@resend.dev>`,
          to: [m.to],
          subject: m.subject,
          html: m.html,
          text,
          reply_to: replyTo,
          headers: Object.keys(headers).length ? headers : undefined,
        }),
      })
      if (!res.ok) throw new Error(`Resend said ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`)
      return { ok: true }
    }
    // not set up: show it in the black window instead, so nothing breaks while testing
    console.log(`\n[email not sent: set up email in the control center]\nTo: ${m.to}\nSubject: ${m.subject}\n${text.slice(0, 500)}\n`)
    return { ok: true, preview: true }
  } catch (e) {
    const msg = friendlyError((e as Error).message)
    console.error("Email failed:", msg)
    return { ok: false, error: msg }
  }
}

function friendlyError(msg: string) {
  if (/535|Username and Password not accepted|Invalid login/i.test(msg))
    return "The email address or app password wasn't accepted. For Gmail, use an app password (not your normal password)."
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|getaddrinfo/i.test(msg)) return "Couldn't reach the email server. Check the internet connection and the server name."
  return msg
}

export function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|tr|div)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
