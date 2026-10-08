// Shared pieces of the "count in tiondelar/hundradelar/tusendelar" breakdowns (0002 R7, 0004).
import { dec, eq, shift, digits } from "../engine/decimal.js"
import { formatNumber as f } from "../ui/number-format.js"
import { T } from "../ui/text-sv.js"

const B = T.breakdown

/** Unit key for a number of decimals: 1 → tenths, 2 → hundredths, 3 → thousandths. */
export const unitKeyFor = (k) => ["tenths", "hundredths", "thousandths"][k - 1] ?? null

/** "tiondel" for exactly 1, otherwise "tiondelar" (same for hundradel, tusendel). */
export function unitWord(unitKey, n) {
  return eq(n, dec(1)) ? B.units[unitKey].one : B.units[unitKey].many
}

/**
 * The last step, "<count> tiondelar/hundradelar/tusendelar, vilket tal är det?". Options are likely
 * mistakes, in size order:
 *   tenths:      ÷10, answer, ×10 (×10 = the count she forgot to turn back into a number), with the bar
 *   hundredths:  answer, ×10, ×100, as a column picture with the hundredths box highlighted
 *   thousandths: answer, ×10, ×100, as a column picture with the thousandths box highlighted
 */
export function unitsChoice(count, unitKey) {
  const k = { tenths: 1, hundredths: 2, thousandths: 3 }[unitKey]
  const answer = shift(count, -k)
  const shifts = k === 1 ? [-1, 0, 1] : [0, 1, 2]
  const picture = k === 1 ? { bar: unitKey } : { columns: { digits: digits(count), ends: [-k, -k + 1, -k + 2], target: -k, minPos: -k } }
  return {
    kind: "choose",
    prompt: B.unitWhichPrompt(f(count), unitWord(unitKey, count)),
    help: B.unitWhichHelp[unitKey](f(count)),
    options: shifts.map((s) => f(shift(answer, s))),
    answerIndex: shifts.indexOf(0),
    answer,
    visual: [],
    ...picture,
  }
}

/** The breakdown object every strategy returns. */
export function breakdownOf(expr, answer, steps, strategy) {
  return { strategy, expr, answer, steps, summary: B.assembled(expr, f(answer)) }
}
