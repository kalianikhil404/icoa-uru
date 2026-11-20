import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { denied } from "@/lib/admin/server"
import { getEmailSettings, isEmailReady, maskSettings, saveEmailSettings, sendMail, type EmailSettings } from "@/lib/server/mailer"
import { getTemplates, promotionalEmail, saveTemplates, sendOrderAlert, sendOrderReceived, sendStatusUpdate, type TemplateId } from "@/lib/server/emails"
import { getSetting } from "@/lib/server/db"
import { listSubscribers, newsletterDue, sendNewsletter, type NewsletterLog } from "@/lib/server/people"
import { requestOrigin } from "@/lib/server/place-order"
import type { Order } from "@/lib/server/orders-store"

export const dynamic = "force-dynamic"

async function state() {
  const [settings, templates, ready, log, subs, due] = await Promise.all([
    getEmailSettings(),
    getTemplates(),
    isEmailReady(),
    getSetting<NewsletterLog[]>("newsletterLog", []),
    listSubscribers(),
    newsletterDue(),
  ])
  return { settings: maskSettings(settings), templates, ready, log, subscribers: subs.filter((s) => s.status === "subscribed").length, dueNow: !!due }
}

export async function GET(request: Request) {
  const no = denied(request)
  if (no) return no
  return NextResponse.json(await state())
}

/** PUT { settings?, templates? } */
export async function PUT(request: Request) {
  const no = denied(request)
  if (no) return no
  const b = await request.json().catch(() => ({}))
  if (b?.settings) {
    const s = b.settings as Partial<EmailSettings>
    const allowed: (keyof EmailSettings)[] = ["provider", "fromName", "fromEmail", "user", "pass", "host", "port", "secure", "resendKey", "replyTo", "notifyEmail", "siteUrl", "mailingAddress", "timezone"]
    await saveEmailSettings(Object.fromEntries(Object.entries(s).filter(([k]) => allowed.includes(k as keyof EmailSettings))))
  }
  if (b?.templates) await saveTemplates(b.templates)
  return NextResponse.json(await state())
}

const sampleOrder = (to: string): Order => {
  const now = new Date().toISOString()
  return {
    orderNumber: "IU-TEST01",
    key: "test",
    createdAt: now,
    updatedAt: now,
    status: "new",
    history: [{ status: "new", at: now }],
    paymentMethod: "etransfer",
    paymentLabel: "Interac e-Transfer",
    email: to,
    customer: { firstName: "Sam", lastName: "Sample", name: "Sam Sample", email: to, phone: "", address: ["12 Sample Street", "Toronto, ON M5V 1A1", "Canada"] },
    shipping: "Canada Post, tracked",
    lines: [{ productId: "p-001", name: "Aqua Peaks", quantity: 1, sizeText: "17 rows wide", unitPrice: 48, lineTotal: 48 }],
    totals: { subtotal: 48, discount: 0, shipping: 8, tax: 0, total: 56, freeShippingRemaining: 0, itemCount: 1 },
    discountCode: "",
    giftNote: "",
    note: "",
    carrier: "Canada Post",
    trackingNumber: "1234567890123456",
    messageToCustomer: "",
  }
}

/** POST { action: "test", template, to } · { action: "newsletter" } · { action: "check" } */
export async function POST(request: Request) {
  const no = denied(request)
  if (no) return no
  const b = await request.json().catch(() => ({}))
  const origin = await requestOrigin()
  const settings = await getEmailSettings()
  const to = String(b?.to || settings.notifyEmail || settings.fromEmail || settings.user || "").trim()

  if (b?.action === "check") {
    if (settings.provider !== "gmail" && settings.provider !== "smtp") return NextResponse.json({ ok: await isEmailReady() })
    try {
      const t =
        settings.provider === "gmail"
          ? nodemailer.createTransport({ service: "gmail", auth: { user: settings.user, pass: settings.pass.replace(/\s+/g, "") } })
          : nodemailer.createTransport({ host: settings.host, port: Number(settings.port) || 587, secure: !!settings.secure, auth: { user: settings.user, pass: settings.pass } })
      await t.verify()
      return NextResponse.json({ ok: true })
    } catch (e) {
      const m = (e as Error).message
      return NextResponse.json({
        ok: false,
        error: /535|not accepted|Invalid login/i.test(m) ? "The email or app password wasn't accepted. For Gmail, use a 16-character app password." : m,
      })
    }
  }

  if (b?.action === "newsletter") {
    const r = await sendNewsletter({ origin })
    return NextResponse.json(r)
  }

  if (b?.action === "test") {
    if (!to) return NextResponse.json({ error: "Type an email address to send the test to." }, { status: 400 })
    const id = String(b?.template) as TemplateId
    const order = sampleOrder(to)
    let r
    if (id === "newsletter" || id === "welcome") {
      const mail = await promotionalEmail(id, { email: to, name: "Sam", token: "preview" }, undefined, origin)
      r = await sendMail({ to, ...mail, subject: `[Test] ${mail.subject}` })
    } else if (id === "orderReceived") {
      r = await sendOrderReceived({ ...order }, origin)
    } else if (id === "orderAlert") {
      r = await sendOrderAlert({ ...order }, origin)
    } else {
      r = await sendStatusUpdate({ ...order, status: id as Order["status"] }, origin)
    }
    return NextResponse.json(r)
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 })
}
