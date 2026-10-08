import { test } from "node:test"
import assert from "node:assert/strict"
import { cpSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { stampSite, stampImports } from "../../scripts/stamp-version.mjs"

const SITE = fileURLToPath(new URL("../../site/", import.meta.url))
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
const RELATIVE_IMPORT = /\b(?:from|import)\s*["'](\.{1,2}\/[^"']+)["']/g

function stampedCopy(version) {
  const dir = mkdtempSync(path.join(tmpdir(), "stamp-"))
  cpSync(SITE, dir, { recursive: true })
  stampSite(dir, version)
  return dir
}

test("index.html loads the stylesheet and main.js with the version", () => {
  const dir = stampedCopy("abc1234")
  try {
    const html = readFileSync(path.join(dir, "index.html"), "utf8")
    assert.match(html, /href="css\/game\.css\?v=abc1234"/)
    assert.match(html, /src="js\/main\.js\?v=abc1234"/)
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test("every relative import in every module is stamped, none is left behind", () => {
  const dir = stampedCopy("abc1234")
  try {
    let count = 0
    for (const f of walk(path.join(dir, "js")).filter((p) => p.endsWith(".js"))) {
      for (const [, spec] of readFileSync(f, "utf8").matchAll(RELATIVE_IMPORT)) {
        count++
        assert.match(spec, /\.js\?v=abc1234$/, `${path.relative(dir, f)}: ${spec}`)
      }
    }
    assert.ok(count > 40, `expected the game's imports, found ${count}`)
    // The source tree itself is untouched (local development stays unstamped).
    assert.doesNotMatch(readFileSync(path.join(SITE, "js/main.js"), "utf8"), /\?v=/)
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test("only import specifiers change", () => {
  const src = 'import { a } from "./a.js"\nimport "../b.js"\nh("div", { className: "pv-from" }, h("span"))\nconst s = "from ./x.js"\n'
  assert.equal(
    stampImports(src, "v1"),
    'import { a } from "./a.js?v=v1"\nimport "../b.js?v=v1"\nh("div", { className: "pv-from" }, h("span"))\nconst s = "from ./x.js"\n',
  )
})

test("stamping fails when index.html lacks a reference it must stamp", () => {
  const dir = stampedCopy("first")
  try {
    writeFileSync(path.join(dir, "index.html"), '<link rel="stylesheet" href="css/game.css">')
    assert.throws(() => stampSite(dir, "abc1234"), /js\/main\.js/)
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test("a version with odd characters is refused", () => {
  assert.throws(() => stampSite(SITE, 'x"><script>'), /bad version/)
})
