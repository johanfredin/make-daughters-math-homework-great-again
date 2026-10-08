#!/usr/bin/env node
// Cache busting (0005): stamps "?v=<version>" onto every file the page loads, in the copy of the site
// that gets deployed (CI runs it on the checkout just before upload; the repo is never stamped).
// usage: node scripts/stamp-version.mjs <siteDir> <version>
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Static relative imports: from "./x.js", from "../x.js", import "./x.js".
const IMPORT = /\b(from|import)(\s*)"(\.{1,2}\/[^"?]+\.js)"/g
const PAGE_REFS = ["css/game.css", "js/main.js"]

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

export const stampImports = (source, version) => source.replace(IMPORT, (_, kw, sp, spec) => `${kw}${sp}"${spec}?v=${version}"`)

export function stampSite(dir, version) {
  if (!/^[\w.-]+$/.test(version)) throw new Error(`bad version: ${version}`)
  const indexPath = path.join(dir, "index.html")
  let html = readFileSync(indexPath, "utf8")
  for (const ref of PAGE_REFS) {
    const attr = new RegExp(`(href|src)="${ref.replace(".", "\\.")}"`)
    if (!attr.test(html)) throw new Error(`index.html has no reference to ${ref}`)
    html = html.replace(attr, `$1="${ref}?v=${version}"`)
  }
  writeFileSync(indexPath, html)
  for (const f of walk(path.join(dir, "js")).filter((p) => p.endsWith(".js"))) {
    writeFileSync(f, stampImports(readFileSync(f, "utf8"), version))
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dir, version] = process.argv.slice(2)
  if (!dir || !version) {
    console.error("usage: stamp-version.mjs <siteDir> <version>")
    process.exit(2)
  }
  stampSite(dir, version)
  console.log(`stamped ${dir} with v=${version}`)
}
