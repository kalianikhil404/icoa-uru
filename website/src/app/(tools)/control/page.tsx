import type { Metadata } from "next"
import { headers } from "next/headers"
import QRCode from "qrcode"
import { accessFor, serverPort, wifiAddresses } from "@/lib/admin/server"
import { Locked } from "@/components/admin/locked"
import { ControlCenter, type Wifi } from "@/components/control/control-center"
import { site } from "@/content/site"

export const metadata: Metadata = { title: "Control center" }
export const dynamic = "force-dynamic"

export default async function ControlPage() {
  const h = await headers()
  const access = accessFor(h)
  if (access !== "ok") return <Locked reason={access} area="control" />

  const online = !!process.env.VERCEL
  let wifi: Wifi = null
  if (!online) {
    const port = serverPort(h)
    const nets = wifiAddresses()
    const url = nets[0] ? `http://${nets[0].address}:${port}` : null
    const qr = url ? await QRCode.toString(url, { type: "svg", margin: 0, color: { dark: "#3b2418", light: "#00000000" }, errorCorrectionLevel: "M" }) : null
    wifi = { url, qr, others: nets.slice(1).map((n) => `${n.address}:${port}`) }
  }
  return <ControlCenter wifi={wifi} online={online} shopName={site.name} />
}
