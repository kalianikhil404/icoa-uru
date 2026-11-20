/* Builds the app's screen into one file: app/index.html
   (src/studio.html + src/studio.js + the seed bead renderer + the logo). */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const read = (p) => fs.readFileSync(path.join(root, p), "utf8")

const beadTs = read("src/seed-bead.ts").replace(/^export /gm, "")
const beadJs = ts.transpileModule(beadTs, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText.replace(/^export \{\};?\s*$/m, "")
const badge = "data:image/png;base64," + fs.readFileSync(path.join(root, "build", "badge-128.png")).toString("base64")

const html = read("src/studio.html")
  .replace("/*@@SEED_BEAD@@*/", () => beadJs)
  .replace("/*@@STUDIO_JS@@*/", () => read("src/studio.js"))
  .replaceAll("@@BADGE@@", badge)
  .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${badge}" />`)

fs.mkdirSync(path.join(root, "app"), { recursive: true })
fs.writeFileSync(path.join(root, "app", "index.html"), html)
console.log(`  app/index.html (${Math.round(html.length / 1024)} KB)`)
