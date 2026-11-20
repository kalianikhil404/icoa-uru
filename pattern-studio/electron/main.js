/* Icoa-Uru Pattern Studio: the window, and saving / opening files on the computer. */
const { app, BrowserWindow, dialog, ipcMain, shell, Menu } = require("electron")
const fs = require("node:fs/promises")
const path = require("node:path")

const FILTERS = {
  pattern: [{ name: "Icoa-Uru pattern", extensions: ["json"] }],
  sprites: [{ name: "Icoa-Uru sprites", extensions: ["json"] }],
  backup: [{ name: "Pattern Studio backup", extensions: ["json"] }],
  png: [{ name: "Picture", extensions: ["png"] }],
  pdf: [{ name: "PDF", extensions: ["pdf"] }],
  image: [{ name: "Pictures", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"] }],
}
const MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", bmp: "image/bmp" }

let win
let lastDir = app.getPath("documents")

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    title: "Icoa-Uru Pattern Studio",
    backgroundColor: "#fbf7f2",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  })
  win.once("ready-to-show", () => {
    win.maximize()
    win.show()
  })
  win.loadFile(path.join(__dirname, "..", "app", "index.html"))
  // links open in the normal browser, never inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url)
    return { action: "deny" }
  })
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("file:")) {
      e.preventDefault()
      if (/^https?:/.test(url)) shell.openExternal(url)
    }
  })
}

ipcMain.handle("save-file", async (_e, { name, text, base64, kind }) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(lastDir, name || "pattern.json"), filters: FILTERS[kind] || [] })
  if (r.canceled || !r.filePath) return { saved: false }
  await fs.writeFile(r.filePath, base64 ? Buffer.from(base64, "base64") : text ?? "")
  lastDir = path.dirname(r.filePath)
  return { saved: true, path: r.filePath }
})

ipcMain.handle("open-file", async (_e, { kind }) => {
  const r = await dialog.showOpenDialog(win, { defaultPath: lastDir, properties: ["openFile"], filters: FILTERS[kind] || [] })
  if (r.canceled || !r.filePaths[0]) return null
  const file = r.filePaths[0]
  lastDir = path.dirname(file)
  const name = path.basename(file)
  if (kind === "image") {
    const ext = path.extname(file).slice(1).toLowerCase()
    const data = await fs.readFile(file)
    return { name, dataUrl: `data:${MIME[ext] || "image/png"};base64,${data.toString("base64")}` }
  }
  return { name, text: await fs.readFile(file, "utf8") }
})

ipcMain.handle("save-pdf", async (_e, { name }) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(lastDir, name || "bead chart.pdf"), filters: FILTERS.pdf })
  if (r.canceled || !r.filePath) return { saved: false }
  const pdf = await win.webContents.printToPDF({ printBackground: true, pageSize: "Letter", margins: { marginType: "default" } })
  await fs.writeFile(r.filePath, pdf)
  lastDir = path.dirname(r.filePath)
  shell.openPath(r.filePath)
  return { saved: true, path: r.filePath }
})

// one window at a time: opening the app again brings it to the front
if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    createWindow()
  })
  app.on("window-all-closed", () => app.quit())
}
