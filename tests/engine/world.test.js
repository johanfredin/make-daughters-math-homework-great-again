import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { validateWorld, neighbourInDirection, tryMove, levels } from "../../site/js/engine/world.js"

const load = () => JSON.parse(readFileSync(new URL("../../site/worlds/kap1/world.json", import.meta.url), "utf8"))
const world = load()

const E = 0, SE = Math.PI / 4, S = Math.PI / 2, SW = (3 * Math.PI) / 4
const W = Math.PI, NW = (-3 * Math.PI) / 4, N = -Math.PI / 2, NE = -Math.PI / 4

test("World 1 is valid", () => {
  assert.deepEqual(validateWorld(world), [])
})

test("AC3 + 0003: World 1 has 7 levels, all playable from their sheets with a theme, 1 camp, 1 boss", () => {
  assert.equal(levels(world).length, 7)
  assert.equal(world.nodes.filter((n) => n.kind === "camp").length, 1)
  assert.equal(world.nodes.filter((n) => n.kind === "boss").length, 1)
  assert.equal(world.keysToBoss, 7)
  assert.ok(levels(world).every((n) => n.playable && n.sheet === `sheets/${n.id}.json` && n.theme))
  assert.equal(new Set(levels(world).map((n) => n.theme)).size, 7, "each level its own theme")
})

test("AC16: removing a required field makes validation fail", () => {
  const mutations = [
    (w) => delete w.nodes[1].kind,
    (w) => delete w.nodes[1].x,
    (w) => delete w.nodes[2].sheet,
    (w) => (w.nodes[2].theme = "nope"),
    (w) => delete w.nodes.find((n) => n.kind === "camp").mentor,
    (w) => w.paths.push(["start", "ghost"]),
    (w) => (w.paths = w.paths.filter(([a, b]) => b !== "boss")),
    (w) => delete w.id,
    (w) => (w.nodes[2].foe = "dragon"),
    (w) => delete w.nodes.find((n) => n.kind === "camp").demo.type,
    (w) => (w.nodes.find((n) => n.kind === "camp").demo.decimal = "abc"),
  ]
  for (const [i, mutate] of mutations.entries()) {
    const w = load()
    mutate(w)
    assert.ok(validateWorld(w).length > 0, `mutation ${i} should be rejected`)
  }
})

test("AC4: neighbourInDirection at the 8 main angles from the playable level", () => {
  const at = (angle) => neighbourInDirection(world, "multiplikation", angle)
  assert.equal(at(E), "blandad-form")
  assert.equal(at(S), "rakna")
  assert.equal(at(W), "camp-mult")
  assert.equal(at(N), null, "no path up")
  assert.equal(at(NE), "blandad-form")
  assert.equal(at(SE), "blandad-form", "diagonal tie goes to the horizontal path")
  assert.equal(at(SW), "camp-mult", "diagonal tie goes to the horizontal path")
  assert.equal(at(NW), "camp-mult")
})

test("AC4: no path within 45° returns null", () => {
  assert.equal(neighbourInDirection(world, "start", W), null)
  assert.equal(neighbourInDirection(world, "start", S), null)
  assert.equal(neighbourInDirection(world, "boss", S), null)
  assert.equal(neighbourInDirection(world, "start", -Math.PI / 4 - 0.01), "camp-mult")
})

// 0002 replaces 0001's "blocked by a locked node" (R2: nothing blocks walking).
test("0002 AC2/AC3: tryMove walks onto unbuilt levels and the den; bumps where there is no path", () => {
  assert.deepEqual(tryMove(world, "start", N), { move: "camp-mult" })
  assert.deepEqual(tryMove(world, "start", E), { move: "rakna" }, "unbuilt level 1 is walkable")
  assert.deepEqual(tryMove(world, "rakna", N), { move: "multiplikation" }, "then up to the playable level")
  assert.deepEqual(tryMove(world, "repetition-2", E), { move: "boss" }, "the den is walkable")
  assert.deepEqual(tryMove(world, "start", W), { bump: true })
})
