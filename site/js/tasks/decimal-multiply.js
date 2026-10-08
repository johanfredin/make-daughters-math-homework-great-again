// Task type "decimal-multiply": whole number · decimal, e.g. 6 · 0,04. Since 0003 levels use the sheets'
// own tasks (tasks/fixed.js); this type remains for the camp's demo task and its breakdown.
import { dec, mul, add, eq, shift } from "../engine/decimal.js"
import { formatExpr, parseAnswer } from "../ui/number-format.js"
import { breakdown as breakdownOf } from "./breakdown.js"

export const TYPE = "decimal-multiply"

/** Build a task from its two factors. decimalFirst decides the order shown. */
export function taskFrom(decimalFactorValue, wholeFactorValue, decimalFirst) {
  const [a, b] = decimalFirst ? [decimalFactorValue, wholeFactorValue] : [wholeFactorValue, decimalFactorValue]
  return {
    type: TYPE,
    a,
    b,
    decimalFactor: decimalFactorValue,
    wholeFactor: wholeFactorValue,
    decimalFirst,
    answer: mul(decimalFactorValue, wholeFactorValue),
    text: formatExpr(a, "*", b),
  }
}

/** "Dela upp det" for this task (optional per task type; the level engine offers it only if present). */
export function breakdown(task) {
  return breakdownOf(task.decimalFactor, task.wholeFactor, task.text)
}

/** The camp's fixed demo task from world.json, e.g. { "type": "decimal-multiply", "decimal": "1,5", "whole": 5 }. */
export function demoTask(demo) {
  return taskFrom(dec(demo.decimal), dec(demo.whole), true)
}

/**
 * Judge an answer. Returns { status: "correct" } | { status: "invalid" } (not a number, does not
 * count as a try) | { status: "wrong", hint: "comma" | "plus" | "generic" }.
 */
export function check(task, input) {
  const given = parseAnswer(input)
  if (given === null) return { status: "invalid" }
  if (eq(given, task.answer)) return { status: "correct" }
  for (const k of [1, 2, 3, -1, -2, -3]) {
    if (eq(shift(given, k), task.answer)) return { status: "wrong", hint: "comma" }
  }
  if (eq(given, add(task.a, task.b))) return { status: "wrong", hint: "plus" }
  return { status: "wrong", hint: "generic" }
}
