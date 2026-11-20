/* Puts the Icoa-Uru icon and name into the .exe (done here so the build also works without Windows signing tools). */
const fs = require("node:fs")
const path = require("node:path")

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return
  const ResEdit = await import("resedit")
  const { NtExecutable, NtExecutableResource, Resource, Data } = ResEdit.default || ResEdit
  const name = context.packager.appInfo.productFilename
  const exe = path.join(context.appOutDir, `${name}.exe`)
  const version = context.packager.appInfo.version
  const data = fs.readFileSync(exe)
  const ne = NtExecutable.from(data, { ignoreCert: true })
  const res = NtExecutableResource.from(ne)
  const ico = Data.IconFile.from(fs.readFileSync(path.join(context.packager.projectDir, "build", "icon.ico")))
  const groups = Resource.IconGroupEntry.fromEntries(res.entries)
  const id = groups.length ? groups[0].id : 1
  const lang = groups.length ? groups[0].lang : 1033
  Resource.IconGroupEntry.replaceIconsForResource(res.entries, id, lang, ico.icons.map((i) => i.data))
  const vi = Resource.VersionInfo.fromEntries(res.entries)[0] || Resource.VersionInfo.createEmpty()
  const [a, b, c] = version.split(".").map(Number)
  vi.setFileVersion(a, b, c, 0, 1033)
  vi.setProductVersion(a, b, c, 0, 1033)
  vi.setStringValues({ lang: 1033, codepage: 1200 }, {
    FileDescription: "Icoa-Uru Pattern Studio",
    ProductName: "Icoa-Uru Pattern Studio",
    CompanyName: "Icoa-Uru",
    LegalCopyright: "Icoa-Uru",
    OriginalFilename: `${name}.exe`,
    InternalName: name,
  })
  vi.outputToResourceEntries(res.entries)
  res.outputResource(ne)
  fs.writeFileSync(exe, Buffer.from(ne.generate()))
  console.log("  set the Icoa-Uru icon on", path.basename(exe))
}
