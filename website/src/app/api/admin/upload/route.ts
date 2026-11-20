import { NextResponse } from "next/server"
import { denied, saveUpload } from "@/lib/admin/server"

export const dynamic = "force-dynamic"

/** POST form-data { file, folder }: saves a photo or video into public/images/<folder>. */
export async function POST(request: Request) {
  const no = denied(request, { editor: true })
  if (no) return no
  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "No file was sent." }, { status: 400 })
  try {
    const url = await saveUpload(file, String(form?.get("folder") ?? "uploads"))
    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
