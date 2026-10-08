// 0004: "Dela upp det" for + − · / with decimals and whole numbers.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { strategyFor } from "../../site/js/tasks/strategies.js"
import * as fixed from "../../site/js/tasks/fixed.js"
import { eq } from "../../site/js/engine/decimal.js"
import { formatNumber, parseAnswer } from "../../site/js/ui/number-format.js"

const stepAnswer = (s) => (s.kind === "choose" ? s.options[s.answerIndex] : formatNumber(s.answer))
const answers = (text) => {
  const b = strategyFor(text)
  assert.ok(b, `no strategy for "${text}"`)
  return b.steps.map(stepAnswer)
}
const M = "−"

test("0004 AC2: decimal ± decimal/whole counts in the smallest unit", () => {
  assert.deepEqual(answers("7,65 + 0,2"), ["765", "20", "785", "7,85"])
  assert.deepEqual(answers(`4 ${M} 0,3`), ["40", "3", "37", "3,7"])
  assert.deepEqual(answers(`100,1 ${M} 99,9`), ["1 001", "999", "2", "0,2"])
  assert.deepEqual(answers("0,1 + 0,05"), ["10", "5", "15", "0,15"])
})

test("0004 AC2: whole ± whole — over a ten, or tens first", () => {
  assert.deepEqual(answers("137 + 9"), ["3", "146"])
  assert.deepEqual(answers(`102 ${M} 3`), ["2", "99"])
  assert.deepEqual(answers("122 + 90"), ["210", "212"])
})

test("0004 AC2: negatives walk the number line", () => {
  assert.deepEqual(answers(`${M}7 ${M} 2`), ["Åt vänster", `${M}9`])
  assert.deepEqual(answers(`4 ${M} 9`), ["Åt vänster", `${M}5`])
  assert.deepEqual(answers(`${M}7 + 7`), ["Åt höger", "0"])
})

test("0004 AC2: chains go one part at a time", () => {
  assert.deepEqual(answers("0,7 + 0,7 + 0,7"), ["1,4", "2,1"])
  assert.deepEqual(answers(`3 ${M} 8 ${M} 2`), [`${M}5`, `${M}7`])
  assert.deepEqual(answers(`${M}4 + 7 ${M} 1`), ["3", "2"])
})

test("0004 AC2: · and / by 10, 100, 1 000 — bigger/smaller, then the column picture", () => {
  assert.deepEqual(answers("100 · 0,76"), ["Större", "76"])
  assert.deepEqual(answers("45,3 / 10"), ["Mindre", "4,53"])
  assert.deepEqual(answers("19 / 1 000"), ["Mindre", "0,019"])
  const s = strategyFor("45,7 / 100").steps[1]
  assert.deepEqual(s.options, ["0,457", "4,57", "45,7"], "never more than 3 decimals, like the sheet")
  assert.deepEqual(s.columns.from, { end: -1, label: "45,7" })
})

test("0004 AC2: decimal · decimal", () => {
  assert.deepEqual(answers("0,7 · 0,5"), ["35", "hundradelar", "0,35"])
  assert.deepEqual(answers("0,7 · 0,02"), ["14", "tusendelar", "0,014"])
})

test("0004 AC2: decimal / whole counts in tiondelar or hundradelar", () => {
  assert.deepEqual(answers("1,2 / 6"), ["12", "2", "0,2"])
  assert.deepEqual(answers("0,15 / 3"), ["15", "5", "0,05"])
})

test("0004 AC2: whole · whole and whole / whole", () => {
  assert.deepEqual(answers("6 · 90"), ["54", "540"])
  assert.deepEqual(answers("40 · 200"), ["8", "8 000"])
  assert.deepEqual(answers("6 000 / 200"), ["60 / 2", "30"])
  assert.deepEqual(answers("8 000 / 40"), ["800 / 4", "200"])
  assert.deepEqual(answers("2 400 / 6"), ["24", "4", "400"])
})

test("0004 AC2: whole / decimal makes the divisor whole", () => {
  assert.deepEqual(answers("20 / 0,5"), ["200 / 5", "40"])
})

test("fractions and non-calculations get no strategy", () => {
  for (const t of ["1/2 + 0,57", `3,4 ${M} 3/4`, "7,9", "sjutusen sextiofem", "587"]) assert.equal(strategyFor(t), null, t)
})

// ---- over all sheets ----
const SHEETS = new URL("../../site/worlds/kap1/sheets/", import.meta.url)
const TASKS = readdirSync(SHEETS).flatMap((f) => JSON.parse(readFileSync(new URL(f, SHEETS), "utf8")).tasks.map((t) => ({ ...t, type: "fixed", sheet: f })))
const isCalculation = (t) => t.kind === "number" && !t.prompt && / [+−·/] /.test(t.text) && !/\d\/\d/.test(t.text)

test("0004 AC1: every calculation task with decimals/whole numbers has a breakdown (96)", () => {
  const calc = TASKS.filter(isCalculation)
  const missing = calc.filter((t) => !fixed.canBreakdown(t)).map((t) => `${t.sheet} ${t.id}: ${t.text}`)
  assert.deepEqual(missing, [])
  assert.equal(calc.length, 96)
})

const numbersIn = (s) => (s.match(/−?\d+(?:[  ]\d{3})*(?:,\d+)?/g) ?? []).map((x) => x.replace(/ /g, " "))

test("0004 AC3: property — every breakdown ends in the answer, no help gives its step's answer, options valid", () => {
  for (const t of TASKS.filter((x) => fixed.canBreakdown(x))) {
    const where = `${t.sheet} ${t.id} "${t.text}"`
    const b = fixed.breakdown(t)
    assert.ok(eq(b.steps.at(-1).answer ?? parseAnswer(stepAnswer(b.steps.at(-1))), parseAnswer(t.answer)), `${where}: last step ${stepAnswer(b.steps.at(-1))}`)
    assert.equal(b.expr, t.text)
    for (const s of b.steps) {
      assert.ok(s.prompt && s.help, `${where}: step without prompt/help`)
      const ans = stepAnswer(s)
      assert.ok(!numbersIn(s.help).includes(ans), `${where}: help "${s.help}" gives ${ans}`)
      if (s.kind === "choose" && parseAnswer(ans) === null) {
        // text answers (units, directions, Större/Mindre, "200 / 5"): the help must not name them either
        const stem = ans.toLowerCase().replace(/^åt /, "").replace(/(ar|er|re)$/, "")
        assert.ok(!s.help.toLowerCase().includes(stem), `${where}: help "${s.help}" names the answer "${ans}"`)
      }
      if (s.kind === "number") {
        const inPrompt = numbersIn(s.prompt).includes(ans)
        for (const v of s.visual) assert.ok(inPrompt || !eq(v, s.answer), `${where}: visual gives the answer`)
      } else {
        assert.equal(new Set(s.options).size, s.options.length, `${where}: duplicate options`)
        assert.ok(s.answerIndex >= 0 && s.answerIndex < s.options.length)
        const numeric = s.options.map((o) => parseAnswer(o))
        if (numeric.every((v) => v !== null)) {
          const vals = s.options.map((o) => Number(o.replace(/ /g, "").replace(",", ".").replace("−", "-")))
          assert.deepEqual([...vals].sort((x, y) => x - y), vals, `${where}: options not in size order`)
          for (const o of s.options) assert.ok(!/,\d{4,}/.test(o), `${where}: option ${o} has more than 3 decimals`)
        }
        if (s.columns) assert.equal(s.columns.ends.length, s.options.length)
      }
    }
  }
})

import { T } from "../../site/js/ui/text-sv.js"
import { columnRange } from "../../site/js/ui/place-value.js"

test("0004: every column in every sheet column picture has a name (e.g. tiotusental for 14 000)", () => {
  for (const t of TASKS.filter((x) => fixed.canBreakdown(x))) {
    for (const s of fixed.breakdown(t).steps.filter((x) => x.columns)) {
      const c = s.columns
      const maxEnd = Math.max(...c.ends, c.from?.end ?? -2)
      for (const pos of columnRange(c.digits, maxEnd, c.minPos ?? -2)) assert.ok(T.breakdown.placeNames[pos], `${t.sheet} ${t.id}: column ${pos} has no name`)
    }
  }
})
