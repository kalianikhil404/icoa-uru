import { NextResponse } from "next/server"
import { runScheduledEmails } from "@/lib/server/people"

export const dynamic = "force-dynamic"

/** Online, Vercel calls this once a day (see vercel.json) to send the newsletter when it's due.
    On your computer the website checks by itself every few minutes. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Not allowed" }, { status: 401 })
  return NextResponse.json(await runScheduledEmails())
}
