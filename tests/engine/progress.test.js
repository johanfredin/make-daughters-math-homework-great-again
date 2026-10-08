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
test("0002 AC1: no level is locked by order; 6 unbuilt levels are coming soon; the den is locked", () => {
  const s = P.freshState(world)
  assert.deepEqual(levels(world).filter((n) => P.isLocked(world, s, n)), [])
  assert.equal(levels(world).filter((n) => P.isComingSoon(n)).length, 6)
  assert.ok(!P.isComingSoon(world.nodes.find((n) => n.id === "multiplikation")))
  assert.ok(P.isLocked(world, s, world.nodes.find((n) => n.kind === "boss")))
  assert.equal(P.keys(s), 0)
  assert.equal(s.nodeId, "start")
})

// 0002 replaces 0001's blockedReason (R2: it gates entering, not walking).
test("0002: enterReason — coming soon for unbuilt levels, boss locked until all keys", () => {
  const s = P.freshState(world)
  const reason = P.enterReason(world, s)
  const node = (id) => world.nodes.find((n) => n.id === id)
  assert.equal(reason(node("rakna")), "comingSoon")
  assert.equal(reason(node("boss")), "bossLocked")
  assert.equal(reason(node("camp-mult")), null)
  assert.equal(reason(node("multiplikation")), null)
  const allKeys = { ...s, cleared: levels(world).map((n) => n.id) }
  assert.equal(P.enterReason(world, allKeys)(node("boss")), null)
})

// 0002: the unlock assertion is gone with the unlock chain (R1); the key-once rule stays.
test("AC5: clearing a level gives one key; replay gives no second key", () => {
  let s = P.freshState(world)
  let r = P.clearLevel(world, s, "multiplikation")
  assert.equal(r.keyAwarded, true)
  s = r.state
  assert.equal(P.keys(s), 1)
  assert.deepEqual(s.unlocked, [], "unlocked is kept for old code but never written")
  r = P.clearLevel(world, s, "multiplikation")
  assert.equal(r.keyAwarded, false)
  assert.equal(P.keys(r.state), 1)
})

test("save → load round-trips", () => {
  const storage = memoryStorage()
  let s = P.freshState(world)
  s = P.clearLevel(world, s, "multiplikation").state
  s = P.withCat(P.moveTo(s, "camp-mult"), { name: "Misse", fur: 2 })
  s = P.setTaskIndex(s, "multiplikation", 3)
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
})

test("0002: saves keep an unlocked array so 0001 code could still read them (rollback safety)", () => {
  const storage = memoryStorage()
  P.save(storage, P.clearLevel(world, P.freshState(world), "multiplikation").state)
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
