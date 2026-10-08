import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import * as P from "../../site/js/engine/progress.js"
import { levels } from "../../site/js/engine/world.js"

const world = JSON.parse(readFileSync(new URL("../../site/worlds/kap1/world.json", import.meta.url), "utf8"))

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => void (data[k] = String(v)),
    removeItem: (k) => void delete data[k],
  }
}
const throwingStorage = {
  getItem() { throw new Error("SecurityError") },
  setItem() { throw new Error("QuotaExceededError") },
  removeItem() { throw new Error("SecurityError") },
}

// 0002 replaces 0001's "6 of 7 levels locked" (R1: no unlocking order any more).
// 0003: every level is built from its sheet, so nothing is "coming soon"; only the den is locked.
test("0002 AC1 + 0003: no level is locked or coming soon; the den is locked", () => {
  const s = P.freshState(world)
  assert.deepEqual(levels(world).filter((n) => P.isLocked(world, s, n)), [])
  assert.deepEqual(levels(world).filter((n) => P.isComingSoon(n)), [])
  assert.ok(P.isLocked(world, s, world.nodes.find((n) => n.kind === "boss")))
  assert.equal(P.keys(s), 0)
  assert.equal(s.nodeId, "start")
})

// 0002 replaces 0001's blockedReason (R2: it gates entering, not walking).
test("0002: enterReason — coming soon for unbuilt levels, boss locked until all keys", () => {
  const s = P.freshState(world)
  const reason = P.enterReason(world, s)
  const node = (id) => world.nodes.find((n) => n.id === id)
  assert.equal(reason(node("rakna")), null, "0003: every level can be entered")
  assert.equal(reason(node("boss")), "bossLocked")
  assert.equal(reason(node("camp-mult")), null)
  assert.equal(reason(node("multiplikation")), null)
  const allKeys = { ...s, cleared: levels(world).map((n) => n.id) }
  assert.equal(P.enterReason(world, allKeys)(node("boss")), null)
})

// 0003: keys come from solving 2/3 of a level (tests/engine/level.test.js); here: the save shape.
test("0003: saves keep unlocked/levelTask for old code, and solved/sound for the new", () => {
  const storage = memoryStorage()
  const s = P.withSound(P.markSolved(P.freshState(world), "multiplikation", ["1a", "1b"]), false)
  P.save(storage, s)
  const raw = JSON.parse(storage.data[P.STORAGE_KEY])
  assert.deepEqual(raw.unlocked, [])
  assert.deepEqual(raw.levelTask, {})
  assert.deepEqual(raw.solved, { multiplikation: ["1a", "1b"] })
  assert.equal(raw.sound, false)
  assert.deepEqual(P.load(storage, world).state, s)
})

test("save → load round-trips", () => {
  const storage = memoryStorage()
  let s = P.freshState(world)
  s = P.markSolved(s, "multiplikation", ["1a"])
  s = P.withCat(P.moveTo(s, "camp-mult"), { name: "Misse", fur: 2 })
  assert.equal(P.save(storage, s), true)
  const { state, reset } = P.load(storage, world)
  assert.equal(reset, false)
  assert.deepEqual(state, s)
})

test("0002 AC4: a save from 0001 (with unlocked) loads with keys and position kept", () => {
  const save0001 = {
    version: 1, worldId: "kap1", nodeId: "multiplikation", visited: ["start", "camp-mult", "multiplikation"],
    cleared: ["multiplikation"], unlocked: ["blandad-form"], levelTask: {}, fur: 1, name: "Misse",
  }
  const { state, reset } = P.load(memoryStorage({ [P.STORAGE_KEY]: JSON.stringify(save0001) }), world)
  assert.equal(reset, false)
  assert.equal(P.keys(state), 1)
  assert.equal(state.nodeId, "multiplikation")
  assert.equal(state.name, "Misse")
  assert.deepEqual(state.solved, {}, "0003 fields default for old saves")
  assert.equal(state.sound, true)
})

test("0002: saves keep an unlocked array so 0001 code could still read them (rollback safety)", () => {
  const storage = memoryStorage()
  P.save(storage, P.freshState(world))
  assert.deepEqual(JSON.parse(storage.data[P.STORAGE_KEY]).unlocked, [])
})

test("AC14: corrupt, wrong-typed or unknown-version data starts fresh with reset = true", () => {
  const bad = [
    "{not json",
    JSON.stringify({ version: 99 }),
    JSON.stringify({ ...P.freshState(world), cleared: "multiplikation" }),
    JSON.stringify({ ...P.freshState(world), nodeId: "nowhere" }),
    JSON.stringify({ ...P.freshState(world), fur: 17 }),
    JSON.stringify({ ...P.freshState(world), name: 42 }),
    JSON.stringify({ ...P.freshState(world), levelTask: { multiplikation: -1 } }),
    JSON.stringify(null),
    JSON.stringify({ ...P.freshState(world), solved: { nowhere: ["1a"] } }),
    JSON.stringify({ ...P.freshState(world), solved: { rakna: [1] } }),
    JSON.stringify({ ...P.freshState(world), sound: "yes" }),
  ]
  for (const raw of bad) {
    const { state, reset } = P.load(memoryStorage({ [P.STORAGE_KEY]: raw }), world)
    assert.equal(reset, true, raw)
    assert.deepEqual(state, P.freshState(world), raw)
  }
})

test("AC14: nothing saved → fresh, no reset message", () => {
  const { state, reset } = P.load(memoryStorage(), world)
  assert.equal(reset, false)
  assert.deepEqual(state, P.freshState(world))
})

test("AC14: storage that throws never crashes the game", () => {
  const { state, reset } = P.load(throwingStorage, world)
  assert.equal(reset, false)
  assert.deepEqual(state, P.freshState(world))
  assert.equal(P.save(throwingStorage, state), false)
  assert.doesNotThrow(() => P.clear(throwingStorage))
  assert.equal(P.hasSave(throwingStorage), false)
})

test("AC15: clear removes the saved game", () => {
  const storage = memoryStorage()
  P.save(storage, P.freshState(world))
  assert.equal(P.hasSave(storage), true)
  P.clear(storage)
  assert.equal(P.hasSave(storage), false)
})

test("names are trimmed and capped; an empty name falls back to null", () => {
  const s = P.freshState(world)
  assert.equal(P.withCat(s, { name: "  Misse  ", fur: 1 }).name, "Misse")
  assert.equal(P.withCat(s, { name: "x".repeat(50), fur: 1 }).name.length, P.MAX_NAME)
  assert.equal(P.withCat(s, { name: "   ", fur: 1 }).name, null)
})
