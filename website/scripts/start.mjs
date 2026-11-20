/* Starts the website for this computer AND everyone on the same WiFi,
   then opens the control center in the browser.
   Used by "Start Website.bat". You can also run:  npm run start-site */
import { spawn, spawnSync } from "node:child_process"
import fs from "node:fs"
import net from "node:net"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next")

function wifiAddresses() {
  const virtual = /virtual|vbox|vmware|wsl|docker|vethernet|hyper-v|loopback|bridge|tailscale|zerotier/i
  const out = []
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const n of list ?? []) {
      if (n.family === "IPv4" && !n.internal && !n.address.startsWith("169.254.")) out.push({ name, address: n.address, virtual: virtual.test(name) })
    }
  }
  return out.sort((a, b) => Number(a.virtual) - Number(b.virtual))
}

function portFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer()
    s.once("error", () => resolve(false))
    s.once("listening", () => s.close(() => resolve(true)))
    s.listen(port, "0.0.0.0")
  })
}

function openBrowser(url) {
  const cmd = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]]
  try {
    spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).unref()
  } catch {
    /* the address is printed anyway */
  }
}

async function waitUntilReady(url, seconds = 180) {
  for (let i = 0; i < seconds; i++) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return true
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

const [major, minor] = process.versions.node.split(".").map(Number)
if (major < 20 || (major === 20 && minor < 9)) {
  console.log(`\n  This computer has Node.js ${process.versions.node}, which is too old for the website.`)
  console.log("  The download page is opening: install the LTS version, then start the website again.\n")
  openBrowser("https://nodejs.org/en/download")
  process.exit(1)
}

// After an update, new parts may be needed: install them before starting.
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
const missing = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((name) => !fs.existsSync(path.join(root, "node_modules", name, "package.json")))
if (missing.length) {
  console.log(`\n  Installing new parts the website needs (${missing.slice(0, 4).join(", ")}${missing.length > 4 ? ", …" : ""}). One moment…\n`)
  const r = spawnSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: root, stdio: "inherit", shell: true })
  if (r.status !== 0) {
    console.log("\n  Couldn't install them. Check the internet connection, then start again.\n")
    process.exit(1)
  }
}

let port = Number(process.env.PORT) || 3000
if (!(await portFree(port))) {
  console.log(`\n  Port ${port} is busy. Is the website already running in another black window?`)
  console.log(`  If so, use that one: http://localhost:${port}/control`)
  for (port = port + 1; port < 3020 && !(await portFree(port)); port++);
  console.log(`  Starting a second copy on port ${port} instead.\n`)
}

const nets = wifiAddresses()
const line = "  " + "-".repeat(58)
console.log("\n" + line)
console.log("   ICOA-URU WEBSITE IS STARTING")
console.log(line)
console.log(`   On this computer      http://localhost:${port}`)
if (nets[0]) console.log(`   On phones and WiFi    http://${nets[0].address}:${port}`)
else console.log("   On phones and WiFi    (connect this computer to WiFi first)")
console.log(`   Website editor        http://localhost:${port}/admin`)
console.log(line)
console.log("   Keep this window open. Closing it stops the website.")
console.log('   If Windows asks about the firewall, tick "Private networks" and click Allow,')
console.log("   otherwise phones on the WiFi can't open it.")
console.log(line + "\n")

/* The fast-start cache can miss changes made while the website was off (new colours or styles
   would not show). So when any file in src/ changed since the last start, start fresh. */
function clearStaleCache() {
  const cache = path.join(root, ".next", "dev", "cache", "turbopack")
  const stamp = path.join(root, ".next", "dev", "cache", "last-start")
  try {
    const last = fs.existsSync(stamp) ? fs.statSync(stamp).mtimeMs : 0
    let newest = 0
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name)
        if (e.isDirectory()) walk(p)
        else newest = Math.max(newest, fs.statSync(p).mtimeMs)
      }
    }
    walk(path.join(root, "src"))
    if (newest > last && fs.existsSync(cache)) fs.rmSync(cache, { recursive: true, force: true })
    fs.mkdirSync(path.dirname(stamp), { recursive: true })
    fs.writeFileSync(stamp, new Date().toISOString())
  } catch {
    /* not important: the website still starts */
  }
}
clearStaleCache()

const child = spawn(process.execPath, [nextBin, "dev", "-H", "0.0.0.0", "-p", String(port)], { cwd: root, stdio: "inherit", env: { ...process.env, PORT: String(port), NEXT_TELEMETRY_DISABLED: "1" } })
child.on("exit", (code) => process.exit(code ?? 0))
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig))

if (await waitUntilReady(`http://localhost:${port}/control`)) {
  if (!process.env.NO_BROWSER) openBrowser(`http://localhost:${port}/control`)
  console.log(`\n  Ready. The control center is open in your browser: http://localhost:${port}/control\n`)
}
