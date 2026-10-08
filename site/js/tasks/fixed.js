// Task type "fixed" (0003): a task transcribed from a homework sheet file, with its own answer.
// Kinds: number, fraction (numerator over a shown denominator), choice, estimate, numberline.
import { parseRational, rat, add, sub, mul, div, eq, cmp } from "../engine/rational.js"
import { dec, isInteger, cmp as dcmp } from "../engine/decimal.js"
import { parseAnswer } from "../ui/number-format.js"
import { breakdown as decimalBreakdown } from "./breakdown.js"

export const TYPE = "fixed"
export const ESTIMATE_TOLERANCE = rat(15, 100)

/** Value of a number as written on a sheet: "23 460", "−0,5", "3/4", "2 3/7". */
function valueOf(tok) {
  const s = tok.trim().replace(/[−–]/g, "-")
  const mixed = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(s)
  if (mixed) {
    const v = add(rat(Number(mixed[2])), rat(Number(mixed[3]), Number(mixed[4])))
    return mixed[1] ? mul(v, rat(-1)) : v
  }
  return parseRational(s)
}

/** Exact value of a sheet expression ("0,7 + 0,5", "2 3/7 − 1 5/7"); · and / bind tighter. null if not one. */
export function evaluate(text) {
  if (typeof text !== "string") return null
  const parts = text.split(/ ([+−·/]) /)
  if (parts.length < 3) return valueOf(text)
  const values = parts.filter((_, i) => i % 2 === 0).map(valueOf)
  if (values.some((v) => v === null)) return null
  const ops = parts.filter((_, i) => i % 2 === 1)
  const terms = [values[0]]
  const addOps = []
  ops.forEach((op, i) => {
    if (op === "·") terms[terms.length - 1] = mul(terms.at(-1), values[i + 1])
    else if (op === "/") terms[terms.length - 1] = div(terms.at(-1), values[i + 1])
    else {
      addOps.push(op)
      terms.push(values[i + 1])
    }
  })
  return addOps.reduce((acc, op, i) => (op === "+" ? add(acc, terms[i + 1]) : sub(acc, terms[i + 1])), terms[0])
}

const abs = (r) => (r.num < 0 ? mul(r, rat(-1)) : r)
const POWERS = [10, 100, 1000].map((p) => rat(p))

/**
 * → { status: "correct" } | { status: "invalid" } (does not count as a try)
 *   | { status: "wrong", hint: "comma" | "plus" | "generic" }
 * For choice tasks the input is the chosen option's index.
 */
export function check(task, input) {
  if (task.kind === "choice") {
    if (!Number.isInteger(input)) return { status: "invalid" }
    return input === task.answer ? { status: "correct" } : { status: "wrong", hint: "generic" }
  }
  const given = parseRational(String(input ?? ""))
  if (given === null) return { status: "invalid" }
  const answer = parseRational(task.answer)
  if (task.kind === "estimate") {
    const exact = evaluate(task.text)
    const ok = exact && cmp(abs(sub(given, exact)), mul(abs(exact), ESTIMATE_TOLERANCE)) <= 0
    return ok ? { status: "correct" } : { status: "wrong", hint: "generic" }
  }
  if (eq(given, answer)) return { status: "correct" }
  // The comma hint only fits calculations; place value ("5 i 587"), rounding and words have a prompt instead
  if (task.kind !== "fraction" && !task.prompt && POWERS.some((p) => eq(mul(given, p), answer) || eq(div(given, p), answer))) {
    return { status: "wrong", hint: "comma" }
  }
  const factors = typeof task.text === "string" ? task.text.split(" · ") : []
  if (factors.length === 2 && factors.every((f) => valueOf(f)) && eq(given, add(valueOf(factors[0]), valueOf(factors[1])))) {
    return { status: "wrong", hint: "plus" }
  }
  return { status: "wrong", hint: "generic" }
}

// The breakdown strategies (0002) are built for decimals with one non-zero digit (0,7 / 0,04: count in
// tiondelar/hundradelar) and for halves ≥ 1 (1,5: split). Other decimals (0,76, 12,75) get no breakdown.
const BREAKABLE_DECIMAL = /^(?:0,0?[1-9]|[1-9],5)$/

/** decimal · whole (either order) with a breakable decimal → [decimal, whole] as decimal.js values; otherwise null. */
function decimalTimesWhole(task) {
  if (task.kind !== "number" || typeof task.text !== "string") return null
  const factors = task.text.split(" · ")
  if (factors.length !== 2) return null
  const vals = factors.map((f) => parseAnswer(f))
  if (vals.some((v) => v === null || dcmp(v, dec(0)) <= 0)) return null
  const [a, b] = vals
  const pair = !isInteger(a) && isInteger(b) ? [a, b, factors[0]] : isInteger(a) && !isInteger(b) ? [b, a, factors[1]] : null
  return pair && BREAKABLE_DECIMAL.test(pair[2].trim()) ? [pair[0], pair[1]] : null
}

/** "Dela upp det" is offered for decimal · whole tasks (0003 R4). */
export const canBreakdown = (task) => decimalTimesWhole(task) !== null

export function breakdown(task) {
  const pair = decimalTimesWhole(task)
  return pair ? decimalBreakdown(pair[0], pair[1], task.text) : null
}
