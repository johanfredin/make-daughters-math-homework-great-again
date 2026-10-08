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

test("AC8: 0,04 · 6 uses the without-the-comma strategy", () => {
  const b = breakdown(dec("0,04"), dec(6))
  assert.equal(b.strategy, "noComma")
  assert.deepEqual(answers(b), ["24", "2", "0,24"])
})

test("slots 4–6 work without the comma: 0,3 · 20 → 60 → 1 → 6", () => {
  assert.deepEqual(answers(breakdown(dec("0,3"), dec(20))), ["60", "1", "6"])
  assert.deepEqual(answers(breakdown(dec("0,9"), dec(500))), ["4 500", "1", "450"])
})

// Numbers that appear in a text, e.g. "0,5 är en halv. Vad är hälften av 6?" → ["0,5", "6"]
const numbersIn = (s) => (s.match(/\d+(?:[  ]\d{3})*(?:,\d+)?/g) ?? []).map((x) => x.replace(/[  ]/g, " "))

test("AC8: 1000 generated tasks — last step equals the answer, no help line gives its step's answer", () => {
  let n = 0
  for (let seed = 1; n < 1000; seed++) {
    for (const spec of SLOTS) {
      const t = generate(spec, mulberry32(seed))
      const b = breakdown(t.decimalFactor, t.wholeFactor)
      const last = b.steps.at(-1)
      assert.ok(eq(last.answer, t.answer), `${t.text}: last step ${formatNumber(last.answer)}`)
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
      if (++n >= 1000) break
    }
  }
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
