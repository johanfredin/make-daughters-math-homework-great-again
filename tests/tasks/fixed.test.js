import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import * as F from "../../site/js/tasks/fixed.js"
import { formatNumber, parseAnswer } from "../../site/js/ui/number-format.js"
import { parseRational, eq as req } from "../../site/js/engine/rational.js"

const sheet = (id) => JSON.parse(readFileSync(new URL(`../../site/worlds/kap1/sheets/${id}.json`, import.meta.url), "utf8"))
const task = (sheetId, id) => ({ ...sheet(sheetId).tasks.find((t) => t.id === id), type: "fixed" })

test("0003 AC2: number tasks accept , or . and spaces; comma mistakes get the comma hint", () => {
  const t = task("rakna", "4b") // 12,75 · 10 = 127,5
  assert.deepEqual(F.check(t, "127,5"), { status: "correct" })
  assert.deepEqual(F.check(t, "127.50"), { status: "correct" })
  assert.deepEqual(F.check(t, "12,75"), { status: "wrong", hint: "comma" })
  assert.deepEqual(F.check(t, "1275"), { status: "wrong", hint: "comma" })
  assert.deepEqual(F.check(t, "22,75"), { status: "wrong", hint: "plus" })
  assert.deepEqual(F.check(t, "5"), { status: "wrong", hint: "generic" })
  assert.deepEqual(F.check(t, "abc"), { status: "invalid" })
  assert.deepEqual(F.check(task("rakna", "12b"), "1 400"), { status: "correct" })
})

test("0003: no comma hint on place-value, rounding or word tasks", () => {
  assert.deepEqual(F.check(task("repetition-1", "3a"), "5"), { status: "wrong", hint: "generic" }) // 5 in 587 = 500
  assert.deepEqual(F.check(task("repetition-1", "12a"), "2"), { status: "wrong", hint: "generic" }) // 19,8 → 20
})

test("0003 AC2: negative answers accept − and -", () => {
  const t = task("repetition-2", "4a") // −7 − 2 = −9
  assert.deepEqual(F.check(t, "−9"), { status: "correct" })
  assert.deepEqual(F.check(t, "-9"), { status: "correct" })
  assert.deepEqual(F.check(t, "9").status, "wrong")
})

test("0003 AC2: fraction tasks take the numerator", () => {
  const t = task("repetition-2", "6c") // 2 3/7 − 1 5/7 = 5/7
  assert.deepEqual(F.check(t, "5"), { status: "correct" })
  assert.deepEqual(F.check(t, "12").status, "wrong")
  assert.deepEqual(F.check(task("blandad-form", "4"), "8"), { status: "correct" }) // 2 = 8/4
})

test("0003 AC2: choice tasks take the option index", () => {
  const t = task("hur-raknar-1", "1")
  assert.deepEqual(F.check(t, 0), { status: "correct" })
  assert.deepEqual(F.check(t, 2), { status: "wrong", hint: "generic" })
  assert.deepEqual(F.check(t, "0"), { status: "invalid" })
})

test("0003 AC2: estimate accepts within ±15 % of the exact value", () => {
  const t = task("repetition-1", "15a") // 71,5 + 28,8 + 42,5 = 142,8
  for (const ok of ["140", "143", "150", "125"]) assert.deepEqual(F.check(t, ok), { status: "correct" }, ok)
  for (const bad of ["100", "170", "14"]) assert.equal(F.check(t, bad).status, "wrong", bad)
  assert.deepEqual(F.check(task("repetition-1", "15c"), "90"), { status: "correct" }) // 532 / 5,9 ≈ 90,2
})

test("0003 AC2: number line accepts 0,35 for arrow c", () => {
  assert.deepEqual(F.check(task("repetition-2", "12c"), "0,35"), { status: "correct" })
  assert.deepEqual(F.check(task("repetition-2", "12c"), "0,3").status, "wrong")
})

test("evaluate: precedence, mixed numbers, negatives", () => {
  assert.ok(req(F.evaluate("−4 + 7 − 1"), parseRational("2")))
  assert.ok(req(F.evaluate("2 3/7 − 1 5/7"), parseRational("5/7")))
  assert.ok(req(F.evaluate("24 · 60 / 7"), parseRational("1440/7")))
  assert.ok(req(F.evaluate("0,7 + 0,7 + 0,7"), parseRational("2,1")))
})

test("0003 R4: 'Dela upp det' for every decimal · whole task, and only those; last step = answer", () => {
  let offered = 0
  for (const id of ["multiplikation", "rakna", "repetition-1", "repetition-2"]) {
    for (const t of sheet(id).tasks.map((x) => ({ ...x, type: "fixed" }))) {
      const b = F.breakdown(t)
      assert.equal(F.canBreakdown(t), b !== null, `${id} ${t.id}`)
      if (!b) continue
      offered++
      assert.equal(b.expr, t.text)
      assert.equal(formatNumber(b.steps.at(-1).answer), formatNumber(parseAnswer(t.answer)), `${id} ${t.id}: last step`)
    }
  }
  assert.equal(offered, 46, "32 on Multiplikation, 11 on Räkna, 3 on Repetition 2")
  assert.equal(F.canBreakdown(task("rakna", "6b")), false, "0,7 · 0,5 is decimal · decimal")
  assert.equal(F.canBreakdown(task("repetition-1", "13c")), false, "6 · 90 has no decimal")
  assert.equal(F.canBreakdown(task("rakna", "4b")), false, "12,75 · 10: no strategy fits 12,75")
  assert.equal(F.canBreakdown(task("rakna", "3a")), false, "100 · 0,76: two non-zero digits")
  assert.equal(F.canBreakdown(task("rakna", "17b")), true, "0,07 · 1 000")
})
