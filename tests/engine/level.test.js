import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import * as L from "../../site/js/engine/level.js"
import * as P from "../../site/js/engine/progress.js"
import { sectionTasks } from "../../site/js/engine/sheet.js"
import { mulberry32 } from "../../site/js/engine/rng.js"
import { TASK_TYPES } from "../../site/js/tasks/index.js"

const load = (p) => JSON.parse(readFileSync(new URL(`../../site/worlds/kap1/${p}`, import.meta.url), "utf8"))
const world = load("world.json")
const multi = load("sheets/multiplikation.json") // 32 tasks, 4 sections of 8
const rep2 = load("sheets/repetition-2.json")

const right = (lv) => (lv.task.kind === "choice" ? lv.task.answer : lv.task.answer)
const wrong = (lv) => (lv.task.kind === "choice" ? (lv.task.answer + 1) % lv.task.options.length : "999999")
const stepRight = (lv) => {
  const s = L.currentStep(lv)
  return L.answerStep(lv, s.kind === "choose" ? s.answerIndex : s.answer.n / 10 ** s.answer.scale + "")
}

test("0003 R5: a section plays its tasks in sheet order", () => {
  let lv = L.startSection(sectionTasks(multi, 0))
  assert.equal(lv.total, 8)
  const seen = []
  while (!lv.done) {
    seen.push(lv.task.id)
    lv = L.answerTask(lv, right(lv)).lv
  }
  assert.deepEqual(seen, ["1a", "1b", "2a", "2b", "3a", "3b", "4a", "4b"])
  assert.deepEqual(lv.solvedNow, seen)
})

test("0003 R6: skipping moves on without solving; a replay plays only unsolved tasks", () => {
  let lv = L.startSection(sectionTasks(multi, 0))
  lv = L.answerTask(lv, right(lv)).lv // 1a solved
  lv = L.skipTask(lv) // 1b skipped
  while (!lv.done) lv = L.answerTask(lv, right(lv)).lv
  assert.ok(!lv.solvedNow.includes("1b"))
  const replay = L.startSection(sectionTasks(multi, 0), { solved: lv.solvedNow })
  assert.equal(replay.total, 1)
  assert.equal(replay.task.id, "1b")
})

test("0003: choice tasks are answered by option index; wrong answers count as tries", () => {
  let lv = L.startSection(sectionTasks(rep2, 0)) // largest/smallest choices
  const r = L.answerTask(lv, wrong(lv))
  assert.equal(r.result.status, "wrong")
  assert.equal(r.lv.tries, 1)
  lv = L.answerTask(r.lv, right(r.lv)).lv
  assert.equal(lv.solvedNow.length, 1)
})

test("invalid input does not count as a try", () => {
  let lv = L.startSection(sectionTasks(multi, 0))
  for (const s of ["", "abc", ","]) {
    const r = L.answerTask(lv, s)
    assert.equal(r.result.status, "invalid", `"${s}"`)
    lv = r.lv
  }
  assert.equal(lv.tries, 0)
})

test("0003 R4: 'Dela upp det' on decimal · whole tasks; finishing it solves the task", () => {
  let lv = L.startSection(sectionTasks(multi, 0))
  assert.equal(lv.breakdownOffered, true, "7 · 0,1 can be broken down")
  const afterWrong = L.answerTask(lv, wrong(lv))
  assert.equal(afterWrong.result.offerBreakdown, true, "0002 AC5: still offered after a wrong answer")
  assert.equal(afterWrong.lv.breakdownOffered, true)
  lv = L.openBreakdown(lv)
  while (lv.breakdown) lv = stepRight(lv).lv
  assert.deepEqual(lv.solvedNow, ["1a"])
  assert.equal(lv.task.id, "1b")
  const choice = L.startSection(sectionTasks(rep2, 0))
  assert.equal(choice.breakdownOffered, false, "no breakdown for a choice task")
  assert.throws(() => L.openBreakdown(choice))
})

test("R10: a breakdown step reveals its answer after 3 wrong tries and moves on", () => {
  let lv = L.openBreakdown(L.startSection(sectionTasks(multi, 0)))
  const bad = (l) => {
    const s = L.currentStep(l)
    return s.kind === "choose" ? (s.answerIndex + 1) % s.options.length : "999"
  }
  let r = L.answerStep(lv, bad(lv))
  assert.equal(r.result.status, "wrong")
  r = L.answerStep(r.lv, bad(r.lv))
  assert.equal(r.result.status, "wrong")
  r = L.answerStep(r.lv, bad(r.lv))
  assert.equal(r.result.status, "revealed")
  assert.equal(r.lv.breakdown.step, 1)
  assert.equal(L.answerStep(r.lv, "xyz").result.status, "invalid")
})

test("0003 R7: the key comes once 2/3 of a level's tasks are solved — not before, and only once", () => {
  assert.equal(P.keyThreshold(32), 22)
  assert.equal(P.keyThreshold(5), 4)
  assert.equal(P.keyThreshold(39), 26)
  let s = P.freshState(world)
  const ids = multi.tasks.map((t) => t.id)
  s = P.markSolved(s, "multiplikation", ids.slice(0, 21))
  assert.equal(P.awardKeyIfEarned(s, "multiplikation", 32).keyAwarded, false)
  s = P.markSolved(s, "multiplikation", ids.slice(20, 22)) // overlap is ignored
  assert.equal(P.solvedIds(s, "multiplikation").length, 22)
  let r = P.awardKeyIfEarned(s, "multiplikation", 32)
  assert.equal(r.keyAwarded, true)
  assert.equal(P.keys(r.state), 1)
  r = P.awardKeyIfEarned(P.markSolved(r.state, "multiplikation", ids), "multiplikation", 32)
  assert.equal(r.keyAwarded, false, "no second key")
  assert.equal(P.keys(r.state), 1)
})

test("AC11: camp practice is 3 tasks with a breakdown from the level's sheet, played in full", () => {
  const lv = L.campPractice(multi.tasks, mulberry32(8))
  assert.equal(lv.practice, true)
  assert.equal(lv.total, 3)
  for (const t of lv.queue) assert.ok(L.hasBreakdown({ ...t, type: "fixed" }))
  const ex = L.campExample(multi.tasks, mulberry32(9))
  assert.ok(multi.tasks.some((t) => t.id === ex.task.id))
  assert.ok(ex.breakdown.steps.length >= 3)
})

test("the camp demo is the world's demo task (1,5 · 5) with the split strategy", () => {
  const demo = L.campDemo(world.nodes.find((n) => n.kind === "camp"))
  assert.equal(demo.breakdown.strategy, "split")
  assert.equal(demo.breakdown.expr, "1,5 · 5")
})

test("a task type without breakdown() is never offered 'Dela upp det'", () => {
  const { breakdown, canBreakdown, ...withoutBreakdown } = TASK_TYPES.fixed
  TASK_TYPES["no-breakdown"] = withoutBreakdown
  try {
    const lv = L.startSection(sectionTasks(multi, 0).map((t) => ({ ...t, type: "no-breakdown" })))
    assert.equal(lv.breakdownOffered, false)
    assert.throws(() => L.openBreakdown(lv))
  } finally {
    delete TASK_TYPES["no-breakdown"]
  }
})
