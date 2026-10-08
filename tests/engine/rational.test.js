import { test } from "node:test"
import assert from "node:assert/strict"
import { rat, parseRational, add, sub, mul, div, eq, cmp } from "../../site/js/engine/rational.js"

test("rat normalises sign and common factors", () => {
  assert.deepEqual(rat(6, 8), { num: 3, den: 4 })
  assert.deepEqual(rat(3, -9), { num: -1, den: 3 })
  assert.deepEqual(rat(0, 5), { num: 0, den: 1 })
  assert.throws(() => rat(1, 0))
})

test("parseRational reads decimals (comma or dot), negatives, fractions and spaces", () => {
  assert.deepEqual(parseRational("1,5"), rat(3, 2))
  assert.deepEqual(parseRational("0.25"), rat(1, 4))
  assert.deepEqual(parseRational("−3"), rat(-3))
  assert.deepEqual(parseRational("-0,019"), rat(-19, 1000))
  assert.deepEqual(parseRational("7/5"), rat(7, 5))
  assert.deepEqual(parseRational("23 460"), rat(23460))
  assert.equal(parseRational("abc"), null)
  assert.equal(parseRational(""), null)
  assert.equal(parseRational("1/0"), null)
})

test("arithmetic is exact", () => {
  assert.ok(eq(add(parseRational("0,1"), parseRational("0,2")), parseRational("0,3")))
  assert.ok(eq(sub(rat(1), rat(5, 8)), rat(3, 8)))
  assert.ok(eq(add(rat(1, 2), parseRational("0,57")), parseRational("1,07")))
  assert.ok(eq(sub(parseRational("3,4"), rat(3, 4)), parseRational("2,65")))
  assert.ok(eq(mul(parseRational("0,7"), parseRational("0,02")), parseRational("0,014")))
  assert.ok(eq(div(parseRational("20"), parseRational("0,5")), rat(40)))
  assert.ok(eq(div(parseRational("532"), parseRational("5,9")), rat(5320, 59)))
})

test("eq and cmp", () => {
  assert.ok(eq(parseRational("1,5"), rat(15, 10)))
  assert.equal(cmp(rat(1, 4), rat(1, 5)), 1)
  assert.equal(cmp(parseRational("0,09"), parseRational("0,1")), -1)
  assert.equal(cmp(rat(-10), rat(-7)), -1)
})
