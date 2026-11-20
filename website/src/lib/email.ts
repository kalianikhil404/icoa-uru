import "server-only"
import { beadPalette } from "@/content/bead-colors"
import { site } from "@/content/site"
import type { CustomDesign } from "@/lib/types"

/* Sends email with Resend (https://resend.com). Without RESEND_API_KEY
   in .env.local the email is printed in the terminal instead, so the
   site still works while you're testing. */

export async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log(`\n[email preview] To: ${opts.to}\nSubject: ${opts.subject}\n${opts.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600)}\n`)
    return { ok: true, preview: true }
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || `${site.name} <onboarding@resend.dev>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      reply_to: opts.replyTo,
    }),
  })
  if (!res.ok) console.error("Email failed:", res.status, await res.text().catch(() => ""))
  return { ok: res.ok }
}

export const ownerEmail = () => process.env.ORDER_NOTIFY_EMAIL || site.email

export function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

/** A custom pattern drawn as a little table of coloured cells, so it shows in any inbox. */
export function designTable(d: CustomDesign) {
  let rows = ""
  for (let r = 0; r < d.rows; r++) {
    let cells = ""
    for (let c = 0; c < d.cols; c++) {
      const hex = beadPalette[parseInt(d.cells[r * d.cols + c] ?? "0", 16)]?.hex ?? "#eee"
      cells += `<td style="width:8px;height:9px;background:${hex};border-radius:2px"></td>`
    }
    rows += `<tr>${cells}</tr>`
  }
  return `<table cellspacing="1" cellpadding="0" style="border-collapse:separate;background:#e9dfd1;padding:2px;border-radius:4px">${rows}</table>`
}

export function emailLayout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#fbf7f2;font-family:Helvetica,Arial,sans-serif;color:#3a2419">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px">
    <p style="font-family:Georgia,serif;font-size:22px;margin:0 0 24px">${esc(site.name)}</p>
    <div style="background:#fff;border-radius:20px;padding:28px">
      <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:0 0 16px">${title}</h1>
      ${body}
    </div>
    <p style="font-size:12px;color:#7a6357;margin-top:24px">${esc(site.name)}, ${esc(site.tagline)}</p>
  </div></body></html>`
}
