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
test("0002 AC7: 0,3 · 20 counts in tenths: 3 → 60 → choose 6 from likely mistakes", () => {
  const b = breakdown(dec("0,3"), dec(20))
  assert.equal(b.strategy, "units")
  assert.deepEqual(answers(b), ["3", "60", "6"])
  // amendment: tenths options = ÷10, answer, ×10 (60 = the count she forgot to turn back into a number)
  assert.deepEqual(b.steps[2].options, ["0,6", "6", "60"])
  assert.equal(b.steps[2].answerIndex, 1)
  assert.equal(b.steps[2].bar, "tenths")
  assert.equal(b.steps[2].columns, undefined)
})

test("0002 AC7: 0,04 · 6 counts in hundredths: 4 → 24 → choose 0,24 from the column picture", () => {
  const b = breakdown(dec("0,04"), dec(6))
  assert.equal(b.strategy, "units")
  assert.deepEqual(answers(b), ["4", "24", "0,24"])
  assert.match(b.steps[0].prompt, /hundradelar/)
  // amendment: hundredths options = answer, ×10, ×100; drawn as the count's digits ending in a column
  assert.deepEqual(b.steps[2].options, ["0,24", "2,4", "24"])
  assert.equal(b.steps[2].answerIndex, 0)
  assert.deepEqual(b.steps[2].columns, { digits: "24", ends: [-2, -1, 0] })
  assert.equal(b.steps[2].bar, undefined)
  assert.match(b.steps[2].help, /Sista siffran i 24/)
})

test("0002: hundredths whose count ends in 0 (20 · 0,03 = 60 hundradelar = 0,6) still have one right row", () => {
  const b = breakdown(dec("0,03"), dec(20))
  assert.deepEqual(b.steps[2].options, ["0,6", "6", "60"])
  assert.deepEqual(b.steps[2].columns, { digits: "60", ends: [-2, -1, 0] })
})

test("0002: slot 6 — 500 · 0,9 → 9 tiondelar → 4 500 tiondelar → 450; singular unit for 1", () => {
  const b = breakdown(dec("0,9"), dec(500))
  assert.deepEqual(answers(b), ["9", "4 500", "450"])
  assert.deepEqual(b.steps[2].options, ["45", "450", "4 500"])
  assert.match(breakdown(dec("0,1"), dec(7)).steps[1].prompt, /^1 tiondel · 7/)
})

test("0002: the split strategy is only used for halves; other decimals ≥ 1 count in tenths", () => {
  assert.equal(breakdown(dec("2,5"), dec(4)).strategy, "split")
  const b = breakdown(dec("1,2"), dec(3))
  assert.equal(b.strategy, "units")
  assert.ok(b.steps.every((st) => typeof st.help === "string" && st.help.length > 0))
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
      if (b.strategy === "units") {
        const [count, , choose] = b.steps
        // step 2 is exactly one times-table fact: count 1–9 times a number with one non-zero digit
        assert.ok(/^[1-9]$/.test(formatNumber(count.answer)), `${t.text}: unit count ${formatNumber(count.answer)}`)
        assert.equal(formatNumber(t.wholeFactor).replace(/[0 ]/g, "").length, 1, `${t.text}: more than one table fact`)
        assert.equal(choose.kind, "choose")
        assert.equal(new Set(choose.options).size, 3, `${t.text}: options not distinct`)
        assert.equal(choose.options.filter((o) => o === formatNumber(t.answer)).length, 1, `${t.text}: answer not exactly once`)
        assert.equal(choose.options[choose.answerIndex], formatNumber(t.answer))
        const values = choose.options.map((o) => Number(o.replace(/ /g, "").replace(",", ".")))
        assert.deepEqual([...values].sort((x, y) => x - y), values, `${t.text}: options not in size order`)
        // never harder than the sheet: no option with more than 2 decimals
        for (const o of choose.options) assert.ok(!/,\d{3,}/.test(o), `${t.text}: option ${o} has more than 2 decimals`)
        assert.ok(!numbersIn(choose.help).includes(formatNumber(t.answer)), `${t.text}: choice help reveals the answer`)
        if (choose.columns) {
          assert.equal(choose.columns.ends[choose.answerIndex], -2, `${t.text}: the right row must end in the hundredths box`)
          assert.equal(new Set(choose.columns.ends).size, 3)
        } else {
          assert.equal(choose.bar, "tenths")
        }
        positions.add(`${choose.columns ? "hundredths" : "tenths"}:${choose.answerIndex}`)
      }
      for (const s of b.steps) {
        assert.ok(s.prompt && s.help, `${t.text}: step without prompt/help`)
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
  // amendment: tenths ÷10/answer/×10 puts the answer in the middle; hundredths answer/×10/×100 puts it first
  assert.deepEqual([...positions].sort(), ["hundredths:0", "tenths:1"])
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
