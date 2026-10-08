// Level state machine (R7, R8, R10, R13). Pure: the UI calls these and renders the result.
//
// task → answer
//   correct            → next task (or done)
//   wrong (1st)        → hint
//   wrong (2nd+)       → hint + offer "Dela upp det"
//   breakdown finished → the task counts as cleared
import { taskType } from "../tasks/index.js"
import { breakdown, checkStep } from "../tasks/breakdown.js"
import { clearLevel } from "./progress.js"
import { dec } from "./decimal.js"
import { pick } from "./rng.js"

export const OFFER_BREAKDOWN_AFTER = 2
export const REVEAL_STEP_AFTER = 3
export const PRACTICE_TASKS = 3

function withTask(lv, index) {
  if (index >= lv.specs.length) return { ...lv, index, task: null, tries: 0, breakdownOffered: false, breakdown: null, done: true }
  const spec = lv.specs[index]
  const task = taskType(spec.type).generate(spec, lv.rng)
  return { ...lv, index, task, tries: 0, breakdownOffered: false, breakdown: null, done: false }
}

export function startLevel(specs, rng, { startIndex = 0, practice = false } = {}) {
  const lv = { specs, rng, practice, total: specs.length }
  return withTask(lv, Math.min(startIndex, specs.length))
}

/** → { lv, result: { status: "correct" | "wrong" | "invalid", hint?, offerBreakdown? } } */
export function answerTask(lv, input) {
  if (lv.done || lv.breakdown) throw new Error("answerTask: no open task")
  const r = taskType(lv.task.type).check(lv.task, input)
  if (r.status === "invalid") return { lv, result: r }
  if (r.status === "correct") return { lv: withTask(lv, lv.index + 1), result: r }
  const tries = lv.tries + 1
  const offerBreakdown = tries >= OFFER_BREAKDOWN_AFTER
  return { lv: { ...lv, tries, breakdownOffered: offerBreakdown }, result: { ...r, offerBreakdown } }
}

export function openBreakdown(lv) {
  if (!lv.breakdownOffered) throw new Error("openBreakdown: not offered yet")
  return { ...lv, breakdown: startBreakdown(lv.task.decimalFactor, lv.task.wholeFactor) }
}

// ---- Breakdown runner (used inside a level and on its own in the camp) ----

export function startBreakdown(decimalFactor, wholeFactor) {
  return { data: breakdown(decimalFactor, wholeFactor), step: 0, tries: 0, finished: false }
}

/** → { run, result: { status: "correct" | "wrong" | "invalid" | "revealed", finished } } */
export function answerBreakdown(run, input) {
  const step = run.data.steps[run.step]
  const status = checkStep(step, input)
  if (status === "invalid") return { run, result: { status, finished: false } }
  const tries = status === "wrong" ? run.tries + 1 : run.tries
  const advance = status === "correct" || tries >= REVEAL_STEP_AFTER
  if (!advance) return { run: { ...run, tries }, result: { status: "wrong", finished: false } }
  const next = run.step + 1
  const finished = next >= run.data.steps.length
  return {
    run: { ...run, step: finished ? run.step : next, tries: 0, finished },
    result: { status: status === "correct" ? "correct" : "revealed", finished, revealedStep: status === "correct" ? null : step },
  }
}

export const currentStep = (lv) => lv.breakdown.data.steps[lv.breakdown.step]

/** Breakdown inside a level: finishing it clears the task. → { lv, result } */
export function answerStep(lv, input) {
  const { run, result } = answerBreakdown(lv.breakdown, input)
  if (!result.finished) return { lv: { ...lv, breakdown: run }, result }
  return { lv: withTask(lv, lv.index + 1), result: { ...result, taskCleared: true } }
}

/** Key and unlock for a finished level; practice and unfinished levels give nothing. */
export function reward(world, state, lv, levelId) {
  if (!lv.done || lv.practice) return { state, keyAwarded: false }
  return clearLevel(world, state, levelId)
}

// ---- Camp helpers: everything comes from the level's own specs (owner edit to R13) ----

export function campPractice(levelNode, rng) {
  const specs = Array.from({ length: PRACTICE_TASKS }, () => pick(rng, levelNode.tasks))
  return startLevel(specs, rng, { practice: true })
}

export function campExample(levelNode, rng) {
  const spec = pick(rng, levelNode.tasks)
  const task = taskType(spec.type).generate(spec, rng)
  return { spec, task, breakdown: breakdown(task.decimalFactor, task.wholeFactor) }
}

export function campDemo(campNode) {
  const b = breakdown(dec(campNode.demo.decimal), dec(campNode.demo.whole))
  return { breakdown: b }
}
