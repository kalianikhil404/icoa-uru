import { NextResponse } from "next/server"
import { contactSchema } from "@/lib/schemas"
import { emailLayout, esc, ownerEmail, sendEmail } from "@/lib/email"

/* Contact form, custom-order requests and newsletter sign-ups all land here
   and are emailed to you. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the form fields and try again." }, { status: 400 })
  }
  const m = parsed.data
  if (m.company) return NextResponse.json({ ok: true }) // spam bot

  const label = m.type === "newsletter" ? "Newsletter sign-up" : m.type === "custom" ? "Custom order request" : "New message"
  await sendEmail({
    to: ownerEmail(),
    replyTo: m.email,
    subject: `${label}${m.type === "newsletter" ? `: ${m.email}` : ` from ${m.name}`}`,
    html: emailLayout(
      label,
      `<p style="font-size:14px;line-height:1.7">
        <strong>From:</strong> ${esc(m.name)} (${esc(m.email)})<br>
        ${m.topic ? `<strong>Topic:</strong> ${esc(m.topic)}<br>` : ""}
        ${m.orderNumber ? `<strong>Order:</strong> ${esc(m.orderNumber)}<br>` : ""}
        ${m.deadline ? `<strong>Needed by:</strong> ${esc(m.deadline)}<br>` : ""}
      </p>
      <p style="font-size:14px;line-height:1.7;white-space:pre-wrap">${esc(m.message)}</p>`
    ),
  })
  return NextResponse.json({ ok: true })
}
