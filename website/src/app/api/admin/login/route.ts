import { NextResponse } from "next/server"

/** POST { password }: opens the control center from another device or the live website (needs ADMIN_PASSWORD). */
export async function POST(request: Request) {
  const pw = process.env.ADMIN_PASSWORD
  const body = await request.json().catch(() => ({}))
  if (!pw || typeof body?.password !== "string" || body.password !== pw) {
    await new Promise((r) => setTimeout(r, 600)) // slows down guessing
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set("iu_admin", pw, { httpOnly: true, sameSite: "strict", secure: request.url.startsWith("https"), path: "/", maxAge: 60 * 60 * 24 * 30 })
  return res
}
