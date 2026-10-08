import { test } from "node:test"
import assert from "node:assert/strict"
import { columnRange, columnCells } from "../../site/js/ui/place-value.js"

// Render a row as text: boxes joined, a comma between ental (0) and tiondelar (-1), "_" for an empty box.
const row = (digits, endPos) => {
  const cols = columnRange(digits)
  return columnCells(digits, endPos)
    .map((c, i) => (c || "_") + (cols[i] === 0 ? "," : ""))
    .join("")
}

test("one-digit counts get their placeholder zeros: 8 hundredths reads 0,08", () => {
  assert.deepEqual(columnRange("8"), [0, -1, -2])
  assert.equal(row("8", -2), "0,08")
  assert.equal(row("8", -1), "0,8_")
  assert.equal(row("8", 0), "8,__")
})

test("two-digit counts: 24 hundredths", () => {
  assert.equal(row("24", -2), "_0,24")
  assert.equal(row("24", -1), "_2,4_")
  assert.equal(row("24", 0), "24,__")
})

test("counts ending in 0: 60 hundredths reads 0,60 (= 0,6)", () => {
  assert.equal(row("60", -2), "_0,60")
  assert.equal(row("60", -1), "_6,0_")
  assert.equal(row("60", 0), "60,__")
})

test("three-digit counts: 810 hundredths reads 8,10", () => {
  assert.equal(row("810", -2), "__8,10")
  assert.equal(row("810", -1), "_81,0_")
  assert.equal(row("810", 0), "810,__")
})

test("only the row ending in hundredths has the count's last digit in the hundredths box", () => {
  for (const digits of ["8", "24", "60", "810"]) {
    const last = (endPos) => columnCells(digits, endPos).at(-1)
    assert.equal(last(-2), digits.at(-1))
    assert.equal(last(-1), "")
    assert.equal(last(0), "")
  }
})

// 0004: rows ending left of ental (760, 14 000) get trailing zeros; the picture can go down to tusendelar.
const rowAt = (digits, endPos, maxEnd, minPos) => {
  const cols = columnRange(digits, maxEnd, minPos)
  return columnCells(digits, endPos, maxEnd, minPos)
    .map((c, i) => (c || "_") + (cols[i] === 0 ? "," : ""))
    .join("")
}

test("0004: trailing zeros left of ental: 76 → 7,6 / 76 / 760", () => {
  assert.deepEqual(columnRange("76", 1), [2, 1, 0, -1, -2])
  assert.equal(rowAt("76", -1, 1, -2), "__7,6_")
  assert.equal(rowAt("76", 0, 1, -2), "_76,__")
  assert.equal(rowAt("76", 1, 1, -2), "760,__")
})

test("0004: thousandths: 14 → 0,014 / 0,14 / 1,4; 457 → 0,457", () => {
  assert.equal(rowAt("14", -3, 0, -3), "_0,014")
  assert.equal(rowAt("14", -2, 0, -3), "_0,14_")
  assert.equal(rowAt("14", -1, 0, -3), "_1,4__")
  assert.equal(rowAt("457", -3, 0, -3), "__0,457")
})
