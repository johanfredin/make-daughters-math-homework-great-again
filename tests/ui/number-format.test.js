import { test } from "node:test"
import assert from "node:assert/strict"
import { formatNumber, formatExpr, parseAnswer, MINUS, TIMES } from "../../site/js/ui/number-format.js"
import { dec, eq } from "../../site/js/engine/decimal.js"

const accepts = (input, expected) => {
  const got = parseAnswer(input)
  assert.ok(got, `"${input}" should parse`)
  assert.ok(eq(got, dec(expected)), `"${input}" should equal ${expected}`)
}

test("AC10: accepted spellings of 2,5", () => {
  for (const s of ["2,5", "2.5", "2,50", " 2,5 "]) accepts(s, "2,5")
})

test("AC10: leading comma, minus signs, spaces between digits", () => {
  accepts(",5", "0,5")
  accepts("-3", "-3")
  accepts(`${MINUS}3`, "-3")
  accepts("1 000", "1000")
  accepts("23 460", "23460")
  accepts("5,", "5")
})

test("AC10: non-numbers are rejected (null)", () => {
  for (const s of ["abc", "", "   ", ",", "-", "1,2,3", "1..2", "--3", "3-"]) {
    assert.equal(parseAnswer(s), null, `"${s}" should be rejected`)
  }
})

test("AC10: formatNumber uses decimal comma, space thousands, real minus", () => {
  assert.equal(formatNumber(1000.5), "1 000,5")
  assert.equal(formatNumber(dec("0,04")), "0,04")
  assert.equal(formatNumber(dec("23460")), "23 460")
  assert.equal(formatNumber(dec("-7")), `${MINUS}7`)
  assert.equal(formatNumber(dec("999")), "999")
  assert.equal(formatNumber(dec("1234567,25")), "1 234 567,25")
  assert.equal(formatNumber(7), "7")
})

test("formatExpr uses Swedish operators", () => {
  assert.equal(formatExpr(dec("1,5"), "*", dec(5)), `1,5 ${TIMES} 5`)
  assert.equal(formatExpr(dec(5), "+", dec("2,5")), "5 + 2,5")
  assert.equal(formatExpr(dec(5), "-", dec("2,5")), `5 ${MINUS} 2,5`)
})
