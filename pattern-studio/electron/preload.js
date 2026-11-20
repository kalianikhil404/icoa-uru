/* The small, safe bridge the app's screen uses to save and open files. */
const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("studioApp", {
  isApp: true,
  saveFile: (opts) => ipcRenderer.invoke("save-file", opts),
  openFile: (opts) => ipcRenderer.invoke("open-file", opts),
  savePdf: (opts) => ipcRenderer.invoke("save-pdf", opts),
})
