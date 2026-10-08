import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import * as L from "../../site/js/engine/level.js"
import * as P from "../../site/js/engine/progress.js"
import { mulberry32 } from "../../site/js/engine/rng.js"
import { formatNumber } from "../../site/js/ui/number-format.js"
import { add, dec } from "../../site/js/engine/decimal.js"
import { TASK_TYPES } from "../../site/js/tasks/index.js"
import * as decimalMultiply from "../../site/js/tasks/decimal-multiply.js"

const world = JSON.parse(readFileSync(new URL("../../site/worlds/kap1/world.json", import.meta.url), "utf8"))
const levelNode = world.nodes.find((n) => n.id === "multiplikation")
const right = (lv) => formatNumber(lv.task.answer)
const wrong = (lv) => formatNumber(add(lv.task.answer, dec(1000))) // never a comma/plus mistake

/** Answer the current breakdown step correctly. */
const stepRight = (lv) => {
  const s = L.currentStep(lv)
  return L.answerStep(lv, s.kind === "choose" ? s.answerIndex : formatNumber(s.answer))
}

test("AC5: six right answers clear the level; the key is awarded once", () => {
  let lv = L.startLevel(levelNode.tasks, mulberry32(1))
  assert.equal(lv.total, 6)
  for (let i = 0; i < 6; i++) {
    assert.equal(lv.done, false)
    const r = L.answerTask(lv, right(lv))
    assert.equal(r.result.status, "correct")
    lv = r.lv
  }
  assert.equal(lv.done, true)
  let s = P.freshState(world)
  let reward = L.reward(world, s, lv, "multiplikation")
  assert.equal(reward.keyAwarded, true)
  assert.equal(P.keys(reward.state), 1)
  reward = L.reward(world, reward.state, L.startLevel(levelNode.tasks, mulberry32(2)), "multiplikation")
  assert.equal(reward.keyAwarded, false, "an unfinished level gives nothing")
})

// 0002 replaces 0001's "two wrong answers offer the breakdown" (R5: help from the first second).
test("0002 AC5: the breakdown is offered before any answer, on every task; finishing it clears the task", () => {
  let lv = L.startLevel(levelNode.tasks, mulberry32(3))
  for (let i = 0; i < lv.total; i++) {
    assert.equal(lv.breakdownOffered, true, `task ${i + 1} offers the breakdown up front`)
    lv = L.answerTask(lv, right(lv)).lv
  }
  lv = L.startLevel(levelNode.tasks, mulberry32(3))
  const r = L.answerTask(lv, wrong(lv))
  assert.equal(r.result.status, "wrong")
  assert.equal(r.result.offerBreakdown, true, "still offered after a wrong answer")
  lv = L.openBreakdown(L.startLevel(levelNode.tasks, mulberry32(3)))
  const steps = lv.breakdown.data.steps.length
  for (let i = 0; i < steps; i++) {
    const rr = stepRight(lv)
    assert.equal(rr.result.status, "correct")
    lv = rr.lv
  }
  assert.equal(lv.index, 1, "the task counts as cleared")
  assert.equal(lv.breakdown, null)
  assert.equal(lv.tries, 0)
})

test("0002 AC5: camp practice offers the breakdown up front too", () => {
  assert.equal(L.campPractice(levelNode, mulberry32(4)).breakdownOffered, true)
})

test("invalid input does not count as a try", () => {
  let lv = L.startLevel(levelNode.tasks, mulberry32(5))
  for (const s of ["", "abc", ","]) {
    const r = L.answerTask(lv, s)
    assert.equal(r.result.status, "invalid")
    lv = r.lv
  }
  assert.equal(lv.tries, 0)
})

test("R10: a breakdown step reveals its answer after 3 wrong tries and moves on", () => {
  let lv = L.startLevel(levelNode.tasks, mulberry32(6))
  lv = L.answerTask(lv, wrong(lv)).lv
  lv = L.openBreakdown(L.answerTask(lv, wrong(lv)).lv)
  const firstWrong = (l) => {
    const s = L.currentStep(l)
    return s.kind === "choose" ? (s.answerIndex + 1) % s.options.length : formatNumber(add(s.answer, dec(1000)))
  }
  let r = L.answerStep(lv, firstWrong(lv))
  assert.equal(r.result.status, "wrong")
  r = L.answerStep(r.lv, firstWrong(r.lv))
  assert.equal(r.result.status, "wrong")
  r = L.answerStep(r.lv, firstWrong(r.lv))
  assert.equal(r.result.status, "revealed")
  assert.equal(r.lv.breakdown.step, 1)
  assert.equal(L.answerStep(r.lv, "xyz").result.status, "invalid")
})

test("resuming starts at the saved task index", () => {
  const lv = L.startLevel(levelNode.tasks, mulberry32(7), { startIndex: 4 })
  assert.equal(lv.index, 4)
  assert.equal(lv.total, 6)
})

test("AC11: camp practice is 3 tasks from the level's own specs and gives no key", () => {
  let lv = L.campPractice(levelNode, mulberry32(8))
  assert.equal(lv.practice, true)
  assert.equal(lv.total, 3)
  for (const spec of lv.specs) assert.ok(levelNode.tasks.includes(spec))
  while (!lv.done) lv = L.answerTask(lv, right(lv)).lv
  const r = L.reward(world, P.freshState(world), lv, "multiplikation")
  assert.equal(r.keyAwarded, false)
  assert.equal(P.keys(r.state), 0)
})

test("AC11: camp examples come from the level's specs", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const ex = L.campExample(levelNode, mulberry32(seed))
    assert.ok(levelNode.tasks.includes(ex.spec))
    assert.ok(ex.breakdown.steps.length >= 3)
  }
})

test("the camp demo is the world's demo task (1,5 · 5) with the split strategy", () => {
  const camp = world.nodes.find((n) => n.kind === "camp")
  const demo = L.campDemo(camp)
  assert.equal(demo.breakdown.strategy, "split")
  assert.equal(demo.breakdown.expr, "1,5 · 5")
})

test("a task type without breakdown() is never offered 'Dela upp det'", () => {
  const { breakdown, ...withoutBreakdown } = decimalMultiply
  TASK_TYPES["no-breakdown"] = withoutBreakdown
  try {
    const specs = [{ ...levelNode.tasks[0], type: "no-breakdown" }]
    let lv = L.startLevel(specs, mulberry32(9))
    for (let i = 0; i < 4; i++) {
      const r = L.answerTask(lv, wrong(lv))
      assert.equal(r.result.offerBreakdown, false)
      lv = r.lv
    }
    assert.throws(() => L.openBreakdown(lv))
  } finally {
    delete TASK_TYPES["no-breakdown"]
  }
})
