// "Dela upp det" for decimal-multiply (R10): break decimal · whole into small steps that teach *how*,
// never the result. Step format: see steps.js.
//
// Step shape:
//   { kind: "number", prompt, help, answer: dec, visual: [dec…] }       she types the answer
//   { kind: "choose", prompt, help, options: [string], answerIndex, visual } she picks an option
// visual = the numbers to show in place-value boxes (inputs of the step, never its answer).
import { dec, mul, add, sub, eq, shift, digits, decimals, isInteger, cmp } from "../engine/decimal.js"
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
  const isHalf = eq(frac, dec("0,5"))
  return [
    { kind: "choose", prompt: B.splitPrompt(f(d)), help: B.splitHelp, options, answerIndex, visual: [d] },
    { kind: "number", prompt: B.wholePartPrompt(f(whole), f(w)), help: B.wholePartHelp, answer: wholeProduct, visual: [whole, w] },
    {
      kind: "number",
      prompt: B.halfPrompt(f(frac), f(w)),
      help: isHalf ? B.halfHelp(f(w)) : B.noCommaHelp,
      answer: fracProduct,
      visual: [frac, w],
    },
    { kind: "number", prompt: B.sumPrompt(f(wholeProduct), f(fracProduct)), help: B.sumHelp, answer: add(wholeProduct, fracProduct), visual: [wholeProduct, fracProduct] },
  ]
}

function noCommaStrategy(d, w) {
  const asInteger = dec(Number(digits(d)))
  const k = decimals(d)
  const product = mul(asInteger, w)
  return [
    { kind: "number", prompt: B.noCommaPrompt(f(asInteger), f(w)), help: B.noCommaHelp, answer: product, visual: [d] },
    { kind: "number", prompt: B.countDecimalsPrompt(f(d)), help: B.countDecimalsHelp, answer: dec(k), visual: [d] },
    { kind: "number", prompt: B.putBackPrompt(k, f(product)), help: B.putBackHelp, answer: shift(product, -k), visual: [product] },
  ]
}

/** Breakdown of decimalFactor · wholeFactor. */
export function breakdown(decimalFactor, wholeFactor) {
  const useSplit = cmp(decimalFactor, dec(1)) >= 0 && !isInteger(decimalFactor)
  const steps = useSplit ? splitStrategy(decimalFactor, wholeFactor) : noCommaStrategy(decimalFactor, wholeFactor)
  const answer = mul(decimalFactor, wholeFactor)
  const expr = formatExpr(decimalFactor, "*", wholeFactor)
  return { strategy: useSplit ? "split" : "noComma", expr, answer, steps, summary: B.assembled(expr, f(answer)) }
}

