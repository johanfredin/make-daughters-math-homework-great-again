import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const SITE = fileURLToPath(new URL("../../site/", import.meta.url))
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
const files = walk(SITE)
const rel = (p) => path.relative(SITE, p).split(path.sep).join("/")
const js = files.filter((f) => f.endsWith(".js"))
const read = (f) => readFileSync(f, "utf8")

// DOM/canvas modules: not imported in Node (they touch window/document by design).
const DOM_MODULES = new Set(["js/main.js", "js/engine/scene.js", "js/engine/input.js", "js/engine/dialog.js", "js/engine/sound.js", "js/ui/numpad.js", "js/ui/screens.js"])

const importsOf = (src) => [...src.matchAll(/(?:import|export)\s[^"'`]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1] ?? m[2])

test("R21: every relative import under site/js resolves to a file", () => {
  for (const f of js) {
    for (const spec of importsOf(read(f))) {
      assert.ok(spec.startsWith("./") || spec.startsWith("../"), `${rel(f)}: non-relative import "${spec}"`)
      assert.ok(existsSync(path.resolve(path.dirname(f), spec)), `${rel(f)}: "${spec}" does not exist`)
    }
  }
})

test("R20/AC16: every non-DOM module imports cleanly in Node", async () => {
  const pure = js.filter((f) => !DOM_MODULES.has(rel(f)))
  assert.ok(pure.length >= 10)
  for (const f of pure) await assert.doesNotReject(import(pathToFileURL(f).href), rel(f))
})

test("R20: DOM modules are the only ones that mention window or document", () => {
  for (const f of js.filter((f) => !DOM_MODULES.has(rel(f)))) {
    assert.doesNotMatch(read(f), /\b(window|document)\./, `${rel(f)} touches the DOM`)
  }
})

// Player-facing text must live in text-sv.js (R15). Heuristic: a string literal with å/ä/ö, or a
// capitalised multi-word phrase, outside text-sv.js. Extend ALLOWED only for genuine non-UI text.
const ALLOWED = new Set([])
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1")
const literals = (src) => [...stripComments(src).matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)].map((m) => m[1] ?? m[2] ?? m[3])

test("AC13: no player-facing string literals outside text-sv.js", () => {
  for (const f of js.filter((f) => rel(f) !== "js/ui/text-sv.js")) {
    for (const s of literals(read(f))) {
      if (ALLOWED.has(s)) continue
      assert.doesNotMatch(s, /[åäöÅÄÖ]/, `${rel(f)}: Swedish text "${s}" belongs in text-sv.js`)
      assert.doesNotMatch(s, /^[A-ZÅÄÖ][a-zåäö]+(?: [a-zåäö]+){1,}/, `${rel(f)}: phrase "${s}" belongs in text-sv.js`)
    }
  }
})

test("security: no innerHTML/outerHTML/insertAdjacentHTML/eval in site/js", () => {
  for (const f of js) assert.doesNotMatch(read(f), /\.(innerHTML|outerHTML|insertAdjacentHTML)\b|\beval\(|new Function\(/, rel(f))
})

const html = read(path.join(SITE, "index.html"))

test("R3: index.html has the CSP and no inline scripts or styles", () => {
  assert.match(html, /<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'">/)
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    assert.match(m[1], /\bsrc=/, "inline <script>")
    assert.equal(m[2].trim(), "", "inline script body")
  }
  assert.doesNotMatch(html, /<style\b/, "<style> element")
  assert.doesNotMatch(html, /\sstyle=/, "style= attribute")
})

test("R3: no setAttribute('style') in JS (CSP blocks it; use el.style.x)", () => {
  for (const f of js) assert.doesNotMatch(read(f), /setAttribute\(\s*["']style["']/, rel(f))
})

test("R1/AC2: no absolute or external URLs in the site", () => {
  for (const f of files.filter((f) => /\.(html|css|js|json)$/.test(f))) {
    const src = read(f)
    assert.doesNotMatch(src, /\b(?:src|href)=["'](?:https?:|\/\/|\/)/, `${rel(f)}: absolute src/href`)
    assert.doesNotMatch(src, /url\(\s*["']?(?:https?:|\/\/|\/)/, `${rel(f)}: absolute url()`)
    assert.doesNotMatch(src, /fetch\(\s*["'](?:https?:|\/)/, `${rel(f)}: absolute fetch`)
    // the SVG namespace is an identifier, never fetched
    assert.doesNotMatch(src, /https?:\/\/(?!json\.schemastore|www\.w3\.org\/2000\/svg)/, `${rel(f)}: external URL`)
  }
})

test("R21: no homework photos or other images are deployed", () => {
  for (const f of files) assert.doesNotMatch(rel(f), /\.(png|jpe?g|heic|webp|pdf)$/i, `${rel(f)} should not be in site/`)
})

test("AC12: every button-like control is at least 48 px (Gå in at least 64 px) in the stylesheet", () => {
  const css = read(path.join(SITE, "css/game.css"))
  let checked = 0
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const selector = m[1].trim()
    if (!/\.(btn|key|swatch)\b|\.btn-|\.key-/.test(selector)) continue
    for (const d of m[2].matchAll(/min-(?:height|width):\s*(\d+)px/g)) {
      checked++
      assert.ok(Number(d[1]) >= 48, `${selector}: ${d[0]}`)
    }
  }
  assert.ok(checked >= 4, "found the button rules")
  const enter = css.match(/#enter-btn\s*\{([^}]*)\}/)[1]
  for (const d of enter.matchAll(/(?:^|[\s;])(?:width|height):\s*(\d+)px/g)) assert.ok(Number(d[1]) >= 64, `#enter-btn ${d[0]}`)
})

test("sprites: every row has the sprite's width and only palette colours", async () => {
  const { allSprites } = await import(pathToFileURL(path.join(SITE, "js/engine/sprites.js")).href)
  for (const [name, { rows, palette }] of Object.entries(allSprites())) {
    for (const [i, r] of rows.entries()) {
      assert.equal(r.length, rows[0].length, `${name} row ${i}`)
      for (const c of r) assert.ok(c === "." || c in palette, `${name} row ${i}: unknown colour "${c}"`)
    }
  }
})
