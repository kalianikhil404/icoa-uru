import type { Metadata } from "next"
import { headers } from "next/headers"
import { accessFor } from "@/lib/admin/server"
import { Editor } from "@/components/admin/editor"
import { Locked } from "@/components/admin/locked"

export const metadata: Metadata = { title: "Website editor" }
export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const access = accessFor(await headers(), { editor: true })
  if (access !== "ok") return <Locked reason={access} />
  return <Editor />
}
