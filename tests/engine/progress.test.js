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

test("AC3: a fresh game has 6 of 7 levels locked and 0 keys", () => {
  const s = P.freshState(world)
  const locked = levels(world).filter((n) => P.isLocked(world, s, n))
  assert.equal(locked.length, 6)
  assert.ok(!P.isLocked(world, s, world.nodes.find((n) => n.id === "multiplikation")))
  assert.equal(P.keys(s), 0)
  assert.equal(s.nodeId, "start")
})

test("blockedReason: coming soon for locked levels, boss locked until all keys", () => {
  const s = P.freshState(world)
  const reason = P.blockedReason(world, s)
  const node = (id) => world.nodes.find((n) => n.id === id)
  assert.equal(reason(node("rakna")), "comingSoon")
  assert.equal(reason(node("boss")), "bossLocked")
  assert.equal(reason(node("camp-mult")), null)
  assert.equal(reason(node("multiplikation")), null)
})

test("AC5: clearing a level gives one key and unlocks the next level; replay gives no second key", () => {
  let s = P.freshState(world)
  let r = P.clearLevel(world, s, "multiplikation")
  assert.equal(r.keyAwarded, true)
  s = r.state
  assert.equal(P.keys(s), 1)
  assert.ok(s.unlocked.includes("blandad-form"))
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
