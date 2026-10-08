import { test } from "node:test"
import assert from "node:assert/strict"
import { mulberry32, int, pick } from "../../site/js/engine/rng.js"

test("same seed gives the same sequence", () => {
  const a = mulberry32(42)
  const b = mulberry32(42)
  for (let i = 0; i < 100; i++) assert.equal(a(), b())
})

test("different seeds give different sequences", () => {
  assert.notEqual(mulberry32(1)(), mulberry32(2)())
})

test("values are in [0, 1)", () => {
  const r = mulberry32(7)
  for (let i = 0; i < 10000; i++) {
    const v = r()
    assert.ok(v >= 0 && v < 1)
  }
})

test("int is inclusive and covers the whole range", () => {
  const r = mulberry32(3)
  const seen = new Set()
  for (let i = 0; i < 2000; i++) {
    const v = int(r, 2, 9)
    assert.ok(Number.isInteger(v) && v >= 2 && v <= 9)
    seen.add(v)
  }
  assert.equal(seen.size, 8)
})

test("pick returns an element of the array", () => {
  const r = mulberry32(5)
  const arr = ["a", "b", "c"]
  for (let i = 0; i < 100; i++) assert.ok(arr.includes(pick(r, arr)))
})
