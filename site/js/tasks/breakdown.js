// "Dela upp det" for decimal-multiply (R10): break decimal · whole into small steps that teach *how*,
// never the result. Step format: see steps.js.
//
// Step shape:
//   { kind: "number", prompt, help, answer: dec, visual: [dec…] }       she types the answer
//   { kind: "choose", prompt, help, options: [string], answerIndex, visual } she picks an option
// visual = the numbers to show in place-value boxes (inputs of the step, never its answer).
import { dec, mul, add, sub, eq, shift, digits, decimals, cmp, fracPart } from "../engine/decimal.js"
import { formatNumber as f, formatExpr } from "../ui/number-format.js"
import { T } from "../ui/text-sv.js"

const B = T.breakdown

function splitStrategy(d, w) {
  const whole = dec(Math.trunc(d.n / 10 ** d.scale))
  const frac = sub(d, whole)
  const wholeProduct = mul(whole, w)
  const fracProduct = mul(frac, w)
  const right = `${f(whole)} + ${f(frac)}`
  const wrong = [`${f(whole)} + ${digits(frac)}`, `${f(shift(whole, -1))} + ${f(frac)}`]
  const answerIndex = d.n % 3 // varies the position of the right option, deterministically
  const options = [...wrong]
  options.splice(answerIndex, 0, right)
  return [
    { kind: "choose", prompt: B.splitPrompt(f(d)), help: B.splitHelp, options, answerIndex, visual: [d] },
    { kind: "number", prompt: B.wholePartPrompt(f(whole), f(w)), help: B.wholePartHelp, answer: wholeProduct, visual: [whole, w] },
    {
      kind: "number",
      prompt: B.halfPrompt(f(frac), f(w)),
      help: B.halfHelp(f(w)), // split is only used for halves (see breakdown())
      answer: fracProduct,
      visual: [frac, w],
    },
    { kind: "number", prompt: B.sumPrompt(f(wholeProduct), f(fracProduct)), help: B.sumHelp, answer: add(wholeProduct, fracProduct), visual: [wholeProduct, fracProduct] },
  ]
}

// Units strategy (0002 R7), decimals below 1: count in tenths/hundredths, multiply, then pick the number
// of the right size. 0,3 · 20 → "3 tiondelar" → 3 · 20 = 60 tiondelar → which number is 60 tiondelar? 6
function unitsStrategy(d, w) {
  const unitKey = decimals(d) === 1 ? "tenths" : "hundredths"
  const unit = B.units[unitKey]
  const word = (n) => (eq(n, dec(1)) ? unit.one : unit.many)
  const count = dec(Number(digits(d)))
  const product = mul(count, w)
  const answer = shift(product, -decimals(d))
  // Step 3 options are likely mistakes, in size order, never more than 2 decimals (like the sheet):
  //   tenths:     ÷10, answer, ×10 (×10 = the count she forgot to turn back into a number)
  //   hundredths: answer, ×10, ×100, drawn as the count's digits ending in the hundredths, tenths, ones box
  const tenths = unitKey === "tenths"
  const shifts = tenths ? [-1, 0, 1] : [0, 1, 2]
  const options = shifts.map((k) => f(shift(answer, k)))
  const answerIndex = shifts.indexOf(0)
  const picture = tenths ? { bar: unitKey } : { columns: { digits: digits(product), ends: [-2, -1, 0] } }
  return [
    { kind: "number", prompt: B.unitCountPrompt(f(d), unit.many), help: B.unitCountHelp[unitKey], answer: count, visual: [d] },
    { kind: "number", prompt: B.unitTimesPrompt(f(count), word(count), f(w), unit.many), help: B.unitTimesHelp(unit.many), answer: product, visual: [] },
    { kind: "choose", prompt: B.unitWhichPrompt(f(product), word(product)), help: B.unitWhichHelp[unitKey](f(product)), options, answerIndex, answer, visual: [], ...picture },
  ]
}

/** Breakdown of decimalFactor · wholeFactor. `expr` = the task as she saw it (factor order). */
export function breakdown(decimalFactor, wholeFactor, expr = formatExpr(decimalFactor, "*", wholeFactor)) {
  // Split for halves ≥ 1 (1,5 · 5 → 1 + 0,5); everything else counts in tenths/hundredths.
  const useSplit = cmp(decimalFactor, dec(1)) >= 0 && eq(fracPart(decimalFactor), dec("0,5"))
  const steps = useSplit ? splitStrategy(decimalFactor, wholeFactor) : unitsStrategy(decimalFactor, wholeFactor)
  const answer = mul(decimalFactor, wholeFactor)
  return { strategy: useSplit ? "split" : "units", expr, answer, steps, summary: B.assembled(expr, f(answer)) }
}

