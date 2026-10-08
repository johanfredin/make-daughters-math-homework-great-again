// Level state machine (0001 R7, 0003 R5/R6). Pure: the UI calls these and renders the result.
// A run plays one section's unsolved sheet tasks in order:
//   correct            → solved, next task (or done)
//   wrong              → hint
//   skip               → next task, not solved (it comes back next time)
//   breakdown finished → solved
import { taskType } from "../tasks/index.js"
import { checkStep } from "../tasks/steps.js"
import { pick } from "./rng.js"

export const REVEAL_STEP_AFTER = 3
export const PRACTICE_TASKS = 3

/** "Dela upp det" when the task type has a breakdown for this task (fixed tasks: decimal · whole). */
export function hasBreakdown(task) {
  const type = taskType(task.type)
  return typeof type.breakdown === "function" && (type.canBreakdown ? type.canBreakdown(task) : true)
}

function withTask(lv, index) {
  if (index >= lv.queue.length) return { ...lv, index, task: null, tries: 0, breakdownOffered: false, breakdown: null, done: true }
  const task = { ...lv.queue[index], type: lv.queue[index].type ?? "fixed" }
  return { ...lv, index, task, tries: 0, breakdownOffered: hasBreakdown(task), breakdown: null, done: false }
}

/** Play `tasks` (a section), skipping those already solved unless `all`. */
export function startSection(tasks, { solved = [], practice = false, all = false } = {}) {
  const queue = all ? tasks : tasks.filter((t) => !solved.includes(t.id))
  return withTask({ queue, practice, total: queue.length, solvedNow: [] }, 0)
}

const solve = (lv) => ({ ...lv, solvedNow: [...lv.solvedNow, lv.task.id] })

/** → { lv, result: { status: "correct" | "wrong" | "invalid", hint?, offerBreakdown? } } */
export function answerTask(lv, input) {
  if (lv.done || lv.breakdown) throw new Error("answerTask: no open task")
  const r = taskType(lv.task.type).check(lv.task, input)
  if (r.status === "invalid") return { lv, result: r }
  if (r.status === "correct") return { lv: withTask(solve(lv), lv.index + 1), result: r }
  return { lv: { ...lv, tries: lv.tries + 1 }, result: { ...r, offerBreakdown: lv.breakdownOffered } }
}

/** "Hoppa över": move on without solving (0003 R6). */
export function skipTask(lv) {
  if (lv.done || lv.breakdown) throw new Error("skipTask: no open task")
  return withTask(lv, lv.index + 1)
}

export function openBreakdown(lv) {
  if (!lv.breakdownOffered) throw new Error("openBreakdown: not offered")
  return { ...lv, breakdown: startBreakdown(taskType(lv.task.type).breakdown(lv.task)) }
}

// ---- Breakdown runner (used inside a level and on its own in the camp) ----

/** data: { expr, answer, steps, summary } from a task type's breakdown(). */
export function startBreakdown(data) {
  return { data, step: 0, tries: 0, finished: false }
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

/** Breakdown inside a level: finishing it solves the task. → { lv, result } */
export function answerStep(lv, input) {
  const { run, result } = answerBreakdown(lv.breakdown, input)
  if (!result.finished) return { lv: { ...lv, breakdown: run }, result }
  return { lv: withTask(solve(lv), lv.index + 1), result: { ...result, taskCleared: true } }
}

// ---- Camp: practice and examples come from a level's own sheet tasks that can be broken down ----

const withBreakdown = (tasks) => tasks.map((t) => ({ ...t, type: t.type ?? "fixed" })).filter(hasBreakdown)

export function campPractice(tasks, rng) {
  const pool = withBreakdown(tasks)
  return startSection(Array.from({ length: PRACTICE_TASKS }, () => pick(rng, pool)), { practice: true, all: true })
}

export function campExample(tasks, rng) {
  const task = pick(rng, withBreakdown(tasks))
  return { task, breakdown: taskType(task.type).breakdown(task) }
}

/** The camp's fixed demo ("Visa mig hur"), described in world.json as { type, ...task fields }. */
export function campDemo(campNode) {
  const type = taskType(campNode.demo.type)
  return { breakdown: type.breakdown(type.demoTask(campNode.demo)) }
}
