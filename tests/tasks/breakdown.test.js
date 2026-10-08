import { test } from "node:test"
import assert from "node:assert/strict"
import { breakdown } from "../../site/js/tasks/breakdown.js"
import { checkStep } from "../../site/js/tasks/steps.js"
import { generate } from "../../site/js/tasks/decimal-multiply.js"
import { mulberry32 } from "../../site/js/engine/rng.js"
import { dec, eq } from "../../site/js/engine/decimal.js"
import { formatNumber } from "../../site/js/ui/number-format.js"
import { SLOTS } from "./fixtures.js"

const answers = (b) =>
  b.steps.map((s) => (s.kind === "choose" ? s.options[s.answerIndex] : formatNumber(s.answer)))

test("AC8: 1,5 · 5 uses the split strategy", () => {
  const b = breakdown(dec("1,5"), dec(5))
  assert.equal(b.strategy, "split")
  assert.deepEqual(answers(b), ["1 + 0,5", "5", "2,5", "7,5"])
  assert.equal(b.steps[0].options.length, 3)
  assert.equal(b.summary, "1,5 · 5 = 7,5")
})

// 0002 replaces 0001's without-the-comma tests (R7: units strategy, no more "move the comma").
test("0002 AC7: 0,3 · 20 counts in tenths: 3 → 60 → choose 6", () => {
  const b = breakdown(dec("0,3"), dec(20))
  assert.equal(b.strategy, "units")
  assert.deepEqual(answers(b), ["3", "60", "6"])
  assert.deepEqual(b.steps[2].options.filter((o) => o === "6"), ["6"])
  assert.equal(b.steps[2].bar, "tenths")
})

test("0002 AC7: 0,04 · 6 counts in hundredths: 4 → 24 → choose 0,24", () => {
  const b = breakdown(dec("0,04"), dec(6))
  assert.equal(b.strategy, "units")
  assert.deepEqual(answers(b), ["4", "24", "0,24"])
  assert.equal(b.steps[2].bar, "hundredths")
  assert.match(b.steps[0].prompt, /hundradelar/)
})

test("0002: slot 6 — 500 · 0,9 → 9 tiondelar → 4 500 tiondelar → 450; singular unit for 1", () => {
  assert.deepEqual(answers(breakdown(dec("0,9"), dec(500))), ["9", "4 500", "450"])
  assert.match(breakdown(dec("0,1"), dec(7)).steps[1].prompt, /^1 tiondel · 7/)
})

// Numbers that appear in a text, e.g. "0,5 är en halv. Vad är hälften av 6?" → ["0,5", "6"]
const numbersIn = (s) => (s.match(/\d+(?:[  ]\d{3})*(?:,\d+)?/g) ?? []).map((x) => x.replace(/[  ]/g, " "))

test("AC8 + 0002 AC7: 6 slots × 1000 tasks — last step is the answer, units invariants, no help gives its step's answer", () => {
  let n = 0
  const positions = new Set()
  for (let seed = 1; n < 6000; seed++) {
    for (const spec of SLOTS) {
      const t = generate(spec, mulberry32(seed))
      const b = breakdown(t.decimalFactor, t.wholeFactor)
      const last = b.steps.at(-1)
      assert.ok(eq(last.answer, t.answer), `${t.text}: last step ${formatNumber(last.answer)}`)
      positions.add(b.steps.at(-1).answerIndex)
      for (const s of b.steps) {
        assert.ok(s.prompt && s.help, `${t.text}: step without prompt/help`)
        if (b.strategy === "units") {
          const [count, times, choose] = b.steps
          // step 2 is exactly one times-table fact: count 1–9 times a number with one non-zero digit
          assert.ok(/^[1-9]$/.test(formatNumber(count.answer)), `${t.text}: unit count ${formatNumber(count.answer)}`)
          assert.equal(formatNumber(t.wholeFactor).replace(/[0 ]/g, "").length, 1, `${t.text}: more than one table fact`)
          assert.equal(choose.kind, "choose")
          assert.equal(new Set(choose.options).size, 3, `${t.text}: options not distinct`)
          assert.equal(choose.options.filter((o) => o === formatNumber(t.answer)).length, 1, `${t.text}: answer not exactly once`)
          assert.equal(choose.options[choose.answerIndex], formatNumber(t.answer))
          const values = choose.options.map((o) => Number(o.replace(/ /g, "").replace(",", ".")))
          assert.deepEqual([...values].sort((x, y) => x - y), values, `${t.text}: options not in size order`)
          assert.ok(!numbersIn(choose.help).includes(formatNumber(t.answer)), `${t.text}: choice help reveals the answer`)
        }
        if (s.kind === "number") {
          assert.ok(!numbersIn(s.help).includes(formatNumber(s.answer)), `${t.text}: help "${s.help}" reveals ${formatNumber(s.answer)}`)
          // The visual shows the step's inputs. It may only contain the answer when the question itself
          // already does (1 · 2 = ?), never otherwise.
          const inQuestion = numbersIn(s.prompt).includes(formatNumber(s.answer))
          for (const v of s.visual) assert.ok(inQuestion || !eq(v, s.answer), `${t.text}: visual reveals the answer`)
        }
      }
      if (++n >= 6000) break
    }
  }
  assert.deepEqual([...positions].filter((x) => x !== undefined).sort(), [0, 1, 2], "the right option is not always in the same place")
})

test("checkStep: numbers, choices and invalid input", () => {
  const b = breakdown(dec("1,5"), dec(5))
  const choose = b.steps[0]
  assert.equal(checkStep(choose, choose.answerIndex), "correct")
  assert.equal(checkStep(choose, (choose.answerIndex + 1) % 3), "wrong")
  assert.equal(checkStep(b.steps[2], "2.5"), "correct")
  assert.equal(checkStep(b.steps[2], "25"), "wrong")
  assert.equal(checkStep(b.steps[2], "x"), "invalid")
})
