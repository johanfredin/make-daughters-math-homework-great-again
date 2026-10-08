import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { validateWorld } from "../../site/js/engine/world.js"
import { SLOTS } from "../tasks/fixtures.js"

const root = new URL("../../site/worlds/", import.meta.url)
const index = JSON.parse(readFileSync(new URL("index.json", root), "utf8"))

test("R21: every world listed in index.json exists and is valid", () => {
  assert.ok(index.worlds.length > 0)
  for (const { id, path } of index.worlds) {
    const w = JSON.parse(readFileSync(new URL(path, root), "utf8"))
    assert.equal(w.id, id)
    assert.deepEqual(validateWorld(w), [], `${path} is invalid`)
  }
})

test("R21: every world directory is listed in index.json", () => {
  const dirs = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  assert.deepEqual(dirs.sort(), index.worlds.map((w) => w.id).sort())
})

test("level sources point at real homework sheets", () => {
  const repo = new URL("../../", import.meta.url)
  for (const { path } of index.worlds) {
    const w = JSON.parse(readFileSync(new URL(path, root), "utf8"))
    for (const n of w.nodes.filter((n) => n.kind === "level")) assert.ok(existsSync(new URL(n.source, repo)), `${n.id}: ${n.source}`)
  }
})

test("the test fixture equals the kap1 level slots", () => {
  const w = JSON.parse(readFileSync(new URL("kap1/world.json", root), "utf8"))
  assert.deepEqual(w.nodes.find((n) => n.id === "multiplikation").tasks, SLOTS)
})
