import { test } from "node:test"
import assert from "node:assert/strict"
import { dec, mul, add, sub, eq, cmp, shift, isInteger, decimals, toPlain, fracPart } from "../../site/js/engine/decimal.js"

test("dec parses strings with comma or dot, and integers", () => {
  assert.deepEqual(dec("1,5"), { n: 15, scale: 1 })
  assert.deepEqual(dec("1.5"), { n: 15, scale: 1 })
  assert.deepEqual(dec("-0,04"), { n: -4, scale: 2 })
  assert.deepEqual(dec(7), { n: 7, scale: 0 })
  assert.deepEqual(dec("2,50"), { n: 25, scale: 1 }, "normalised: trailing zeros dropped")
  assert.deepEqual(dec("0"), { n: 0, scale: 0 })
})

test("dec rejects non-integer JS numbers and garbage", () => {
  assert.throws(() => dec(0.1))
  assert.throws(() => dec("abc"))
  assert.throws(() => dec(""))
})

test("mul is exact where floats are not", () => {
  assert.equal(toPlain(mul(dec("0,1"), dec(3))), "0.3") // 0.1 * 3 = 0.30000000000000004 in floats
  assert.equal(toPlain(mul(dec("0,7"), dec("0,5"))), "0.35")
  assert.equal(toPlain(mul(dec("1,5"), dec(5))), "7.5")
  assert.equal(toPlain(mul(dec("0,04"), dec(6))), "0.24")
  assert.equal(toPlain(mul(dec("0,3"), dec(20))), "6")
  assert.equal(toPlain(mul(dec("500"), dec("0,9"))), "450")
})

test("add and sub align scales", () => {
  assert.equal(toPlain(add(dec("0,1"), dec("0,2"))), "0.3")
  assert.equal(toPlain(add(dec(5), dec("2,5"))), "7.5")
  assert.equal(toPlain(sub(dec("100,1"), dec("99,9"))), "0.2")
  assert.equal(toPlain(sub(dec(1), dec("0,05"))), "0.95")
})

test("eq and cmp", () => {
  assert.ok(eq(dec("2,5"), dec("2,50")))
  assert.ok(!eq(dec("2,5"), dec("25")))
  assert.equal(cmp(dec("3,1"), dec("3,09")), 1)
  assert.equal(cmp(dec("-7"), dec("-2")), -1)
  assert.equal(cmp(dec("0,5"), dec(",5")), 0)
})

test("shift multiplies by powers of ten", () => {
  assert.equal(toPlain(shift(dec("0,76"), 2)), "76")
  assert.equal(toPlain(shift(dec("45,3"), -1)), "4.53")
  assert.equal(toPlain(shift(dec(24), -2)), "0.24")
  assert.equal(toPlain(shift(dec("0,07"), 3)), "70")
})

test("fracPart keeps only the part after the comma", () => {
  assert.equal(toPlain(fracPart(dec("2,5"))), "0.5")
  assert.equal(toPlain(fracPart(dec("1,25"))), "0.25")
  assert.equal(toPlain(fracPart(dec("7"))), "0")
  assert.equal(toPlain(fracPart(dec("-1,5"))), "-0.5")
})

test("isInteger and decimals", () => {
  assert.ok(isInteger(dec("6")))
  assert.ok(isInteger(dec("6,0")))
  assert.ok(!isInteger(dec("0,6")))
  assert.equal(decimals(dec("0,04")), 2)
  assert.equal(decimals(dec("1,5")), 1)
  assert.equal(decimals(dec("40")), 0)
})
