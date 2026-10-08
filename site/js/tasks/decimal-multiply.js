// Task type "decimal-multiply": whole number · decimal, e.g. 6 · 0,04 or 0,3 · 20 (R9, R11).
//
// Spec (from world.json):
//   whole:   { from, to, step = 1, also = [] }   the whole-number factor
//   decimal: "0,d" | "0,0d" | "n,5"              the decimal factor's pattern (one non-zero digit, or 1,5 / 2,5)
//   n:       [1, 2]                              whole parts allowed for "n,5"
import { dec, mul, add, eq, shift } from "../engine/decimal.js"
import { int, pick } from "../engine/rng.js"
import { formatExpr } from "../ui/number-format.js"
import { parseAnswer } from "../ui/number-format.js"

export const TYPE = "decimal-multiply"

function wholeChoices({ from, to, step = 1, also = [] }) {
  const out = new Set(also)
  for (let v = from; v <= to; v += step) out.add(v)
  return [...out].sort((a, b) => a - b)
}

function decimalFactor(spec, rng) {
  switch (spec.decimal) {
    case "0,d":
      return dec(`0,${int(rng, 1, 9)}`)
    case "0,0d":
      return dec(`0,0${int(rng, 1, 9)}`)
    case "n,5":
      return dec(`${pick(rng, spec.n ?? [1, 2])},5`)
    default:
      throw new Error(`decimal-multiply: unknown decimal pattern "${spec.decimal}"`)
  }
}

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

export function generate(spec, rng) {
  const d = decimalFactor(spec, rng)
  const w = dec(pick(rng, wholeChoices(spec.whole)))
  return taskFrom(d, w, rng() < 0.5)
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
