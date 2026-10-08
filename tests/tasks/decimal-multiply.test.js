import { test } from "node:test"
import assert from "node:assert/strict"
import { generate, check, taskFrom } from "../../site/js/tasks/decimal-multiply.js"
import { mulberry32 } from "../../site/js/engine/rng.js"
import { dec, toPlain } from "../../site/js/engine/decimal.js"
import { formatNumber } from "../../site/js/ui/number-format.js"
import { SLOTS, DECIMAL_PATTERN, wholeSet } from "./fixtures.js"

// Independent oracle: multiply digit strings as BigInt and place the comma by hand (no decimal.js).
function oracle(decimalPlain, whole) {
  const [w, f = ""] = decimalPlain.split(".")
  let digits = (BigInt(w + f) * BigInt(whole)).toString().padStart(f.length + 1, "0")
  if (f.length === 0) return digits
  let out = `${digits.slice(0, -f.length)}.${digits.slice(-f.length)}`
  out = out.replace(/0+$/, "").replace(/\.$/, "")
  return out
}

const SEEDS = 1000

test("AC7: every slot × 1000 seeds gives an exact answer, matches its sheet pattern, formats cleanly", () => {
  SLOTS.forEach((spec, slot) => {
    const wholes = wholeSet(spec.whole)
    for (let seed = 1; seed <= SEEDS; seed++) {
      const t = generate(spec, mulberry32(seed))
      const where = `slot ${slot + 1}, seed ${seed}`
      const decPlain = toPlain(t.decimalFactor)
      const whole = Number(toPlain(t.wholeFactor))

      assert.ok(wholes.has(whole), `${where}: whole ${whole} outside sheet pattern`)
      // Never harder than the sheet: every task is one times-table fact plus moving the comma
      // (no 45 · 0,7 = 31,5 style carrying, which the sheet never asks for).
      assert.equal(String(whole).replace(/0/g, "").length, 1, `${where}: ${whole} needs more than one table fact`)
      assert.match(decPlain, DECIMAL_PATTERN[spec.decimal], `${where}: decimal ${decPlain} outside sheet pattern`)
      assert.equal(toPlain(t.answer), oracle(decPlain, whole), `${where}: wrong answer`)

      const shown = formatNumber(t.answer)
      assert.match(shown, /^\d{1,3}( \d{3})*(,\d{1,3})?$/, `${where}: odd formatting "${shown}"`)
      assert.doesNotMatch(t.text, /e|\d{5,}|NaN|undefined/, `${where}: noisy text "${t.text}"`)
    }
  })
})

test("AC7: the same seed gives the same task; factor order varies", () => {
  for (const spec of SLOTS) {
    assert.deepEqual(generate(spec, mulberry32(99)), generate(spec, mulberry32(99)))
  }
  const firsts = new Set()
  for (let seed = 1; seed <= 50; seed++) firsts.add(generate(SLOTS[0], mulberry32(seed)).decimalFirst)
  assert.deepEqual([...firsts].sort(), [false, true])
})

test("AC9: 0,3 · 20 — comma hint, plus hint, correct, invalid", () => {
  const t = taskFrom(dec("0,3"), dec(20), true)
  assert.equal(t.text, "0,3 · 20")
  assert.deepEqual(check(t, "60"), { status: "wrong", hint: "comma" })
  assert.deepEqual(check(t, "0,6"), { status: "wrong", hint: "comma" })
  assert.deepEqual(check(t, "20,3"), { status: "wrong", hint: "plus" })
  assert.deepEqual(check(t, "6"), { status: "correct" })
  assert.deepEqual(check(t, "6,0"), { status: "correct" })
  assert.deepEqual(check(t, "5"), { status: "wrong", hint: "generic" })
  assert.deepEqual(check(t, "abc"), { status: "invalid" })
  assert.deepEqual(check(t, ""), { status: "invalid" })
})

test("check: the comma hint covers factors 10, 100 and 1000", () => {
  const t = taskFrom(dec("0,04"), dec(6), false) // 0,24
  for (const s of ["2,4", "24", "240", "0,024", "0,0024"]) {
    assert.deepEqual(check(t, s), { status: "wrong", hint: "comma" }, s)
  }
})
