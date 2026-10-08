import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { withSearch, versioned } from "../../site/js/engine/version.js"

test("withSearch adds the release query", () => {
  assert.equal(String(withSearch("https://x.se/worlds/kap1/world.json", "?v=abc1234")), "https://x.se/worlds/kap1/world.json?v=abc1234")
  assert.equal(String(withSearch(new URL("https://x.se/a.json"), "?v=1")), "https://x.se/a.json?v=1")
})

test("withSearch without a version leaves the url unchanged", () => {
  assert.equal(String(withSearch("http://localhost:8000/worlds/index.json", "")), "http://localhost:8000/worlds/index.json")
})

test("versioned is a no-op for an unstamped module", () => {
  assert.equal(String(versioned("http://localhost/a.json")), "http://localhost/a.json")
})

test("main.js fetches data through versioned()", () => {
  const main = readFileSync(new URL("../../site/js/main.js", import.meta.url), "utf8")
  assert.match(main, /import \{ versioned \} from "\.\/engine\/version\.js"/)
  assert.match(main, /fetch\(versioned\(url\)\)/)
  assert.doesNotMatch(main, /fetch\(url\)/)
})
