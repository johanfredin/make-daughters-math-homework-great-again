// "Dela upp det" for sheet calculations (0004): + − · / with decimals and whole numbers, negatives and
// chains. Each strategy builds on what she already knows from 0002 — count in tiondelar/hundradelar,
// then pick the right number — and never says "move the comma n steps". Pure; exact maths via decimal.js.
//
// strategyFor(text) → { strategy, expr, answer, steps, summary } | null (not handled)
import { dec, add, sub, mul, cmp, shift, decimals, isInteger, normalise, digits, toPlain } from "../engine/decimal.js"
import { formatNumber as f, parseAnswer, MINUS } from "../ui/number-format.js"
import { T } from "../ui/text-sv.js"
import { unitsChoice, unitWord, unitKeyFor, breakdownOf } from "./units.js"

const B = T.breakdown
const ZERO = dec(0)
const isNeg = (x) => cmp(x, ZERO) < 0
const num = (x) => Number(toPlain(x))
const POWERS = { 10: 1, 100: 2, 1000: 3 }
const isPower = (x) => isInteger(x) && String(num(x)) in POWERS
const sym = (op) => (op === "-" ? MINUS : op)

function parse(text) {
  if (typeof text !== "string") return null
  const parts = text.split(/ ([+−·/]) /)
  if (parts.length < 3) return null
  const values = parts.filter((_, i) => i % 2 === 0).map((p) => (/\d\/\d/.test(p) ? null : parseAnswer(p)))
  if (values.some((v) => v === null)) return null
  const ops = parts.filter((_, i) => i % 2 === 1).map((o) => (o === "−" ? "-" : o))
  return { values, ops }
}

/** Exact a / b as a decimal, or null if it does not end within 6 decimals. */
function divide(a, b) {
  const A = normalise(a)
  const Bv = normalise(b)
  const top = A.n * 10 ** Bv.scale
  const bottom = Bv.n * 10 ** A.scale
  for (let k = 0; k <= 6; k++) {
    const n = top * 10 ** k
    if (n % bottom === 0) return normalise({ n: n / bottom, scale: k })
  }
  return null
}
const apply = (a, op, b) => (op === "+" ? add(a, b) : op === "-" ? sub(a, b) : op === "·" ? mul(a, b) : divide(a, b))
const trailingZeros = (x) => /0*$/.exec(String(num(x)))[0].length
const question = (expr) => T.level.question(expr)

/** The digits of v without trailing zeros, and the column its last digit is in (0 = ental). */
function sigDigits(v) {
  const { n, scale } = normalise(v)
  const str = String(Math.abs(n))
  const trimmed = str.replace(/0+$/, "")
  return { digits: trimmed, end: str.length - trimmed.length - scale }
}

/** "Hur många tiondelar är 0,7?" / "… är 4 hela?" */
function countStep(x, unitKey) {
  const unit = B.units[unitKey]
  const k = { tenths: 1, hundredths: 2, thousandths: 3 }[unitKey]
  const whole = isInteger(x)
  return {
    kind: "number",
    prompt: whole ? B.wholesCountPrompt(f(x), num(x) === 1 ? B.hel.one : B.hel.many, unit.many) : B.unitCountPrompt(f(x), unit.many),
    help: whole ? B.wholesCountHelp[unitKey] : B.countHelp[unitKey],
    answer: shift(x, k),
    visual: [x],
  }
}

// ---- + and − ----

/** decimal ± decimal/whole: count both in the smallest unit, add or subtract, pick the number. */
function unitsAddSub(a, op, b, r) {
  const k = Math.max(decimals(a), decimals(b))
  const unitKey = unitKeyFor(k)
  if (!unitKey || cmp(r, ZERO) <= 0) return null
  const unit = B.units[unitKey]
  const [ca, cb, cr] = [a, b, r].map((x) => shift(x, k))
  const prompt = op === "+" ? B.unitAddPrompt : B.unitSubPrompt
  return [
    countStep(a, unitKey),
    countStep(b, unitKey),
    { kind: "number", prompt: prompt(f(ca), unitWord(unitKey, ca), f(cb), unitWord(unitKey, cb), unit.many), help: (op === "+" ? B.unitAddHelp : B.unitSubHelp)(unit.many), answer: cr, visual: [] },
    unitsChoice(cr, unitKey),
  ]
}

/** whole ± whole: over a ten goes via the ten (137 + 9 = 140 + 6); otherwise tens first, ones last. */
function wholeAddSub(a, op, b, r) {
  const A = num(a)
  const Bn = num(b)
  const ones = A % 10
  if (op === "+" && Bn < 10 && ones !== 0 && ones + Bn >= 10) {
    const up = 10 - ones
    const ten = dec(A + up)
    return [
      { kind: "number", prompt: B.bridgeUpPrompt(f(a), f(ten)), help: B.bridgeHelp, answer: dec(up), visual: [] },
      { kind: "number", prompt: B.calcPrompt(f(ten), "+", f(dec(Bn - up))), help: B.bridgeRestHelp(f(b), f(dec(up)), f(dec(Bn - up))), answer: r, visual: [] },
    ]
  }
  if (op === "-" && Bn < 10 && ones !== 0 && ones < Bn) {
    const ten = dec(A - ones)
    return [
      { kind: "number", prompt: B.bridgeDownPrompt(f(a), f(ten)), help: B.bridgeHelp, answer: dec(ones), visual: [] },
      { kind: "number", prompt: B.calcPrompt(f(ten), MINUS, f(dec(Bn - ones))), help: B.bridgeRestHelp(f(b), f(dec(ones)), f(dec(Bn - ones))), answer: r, visual: [] },
    ]
  }
  if (ones === 0) return null
  const tens = dec(A - ones)
  const part = op === "+" ? add(tens, b) : sub(tens, b)
  if (isNeg(part)) return null
  return [
    { kind: "number", prompt: B.calcPrompt(f(tens), sym(op), f(b)), help: B.tensFirstHelp, answer: part, visual: [] },
    { kind: "number", prompt: B.calcPrompt(f(part), "+", f(dec(ones))), help: B.onesLastHelp, answer: r, visual: [] },
  ]
}

/** With negatives: which way on the number line, then walk. */
function negative(a, op, b, r) {
  if (isNeg(b)) return null
  return [
    { kind: "choose", prompt: B.directionPrompt, help: B.directionHelp, options: B.directionOptions, answerIndex: op === "+" ? 0 : 1, visual: [] },
    { kind: "number", prompt: B.walkPrompt(f(a), f(b), op === "+" ? B.directions.right : B.directions.left), help: op === "+" ? B.walkHelp.right : B.walkHelp.left, answer: r, visual: [] },
  ]
}

/** 3+ numbers with + and −: one part at a time, left to right. */
function chain(values, ops) {
  if (!ops.every((o) => o === "+" || o === "-")) return null
  const k = Math.max(...values.map(decimals))
  const steps = []
  let acc = values[0]
  ops.forEach((op, i) => {
    const next = apply(acc, op, values[i + 1])
    const help = k > 0 ? B.chainHelp.decimals(B.units[unitKeyFor(k)].many) : op === "+" ? B.chainHelp.plus : B.chainHelp.minus
    steps.push({ kind: "number", prompt: B.calcPrompt(f(acc), sym(op), f(values[i + 1])), help, answer: next, visual: [] })
    acc = next
  })
  return steps
}

// ---- · and / ----

/** · or / by 10, 100, 1 000: bigger or smaller? Then pick the number, with the digits' start shown. */
function scale(op, value, power, expr) {
  const times = op === "·"
  const p = num(power)
  const k = POWERS[p]
  const answer = shift(value, times ? k : -k)
  const shifts = decimals(answer) + 1 <= 3 ? [-1, 0, 1] : [0, 1, 2]
  const { digits: sig, end } = sigDigits(answer)
  const from = { end: sigDigits(value).end, label: f(value) }
  const ends = shifts.map((s) => end + s)
  const kind = times ? "times" : "divide"
  return [
    { kind: "choose", prompt: B.scaleBiggerPrompt(f(value)), help: B.scaleBiggerHelp[kind](f(power)), options: B.scaleBiggerOptions, answerIndex: times ? 0 : 1, visual: [value] },
    {
      kind: "choose",
      prompt: question(expr),
      // tiondelar blir tiotal (·100) / ental blir hundradelar (/100): name the columns, don't count boxes
      help: B.scaleWhichHelp[kind](f(power), B.powerWords[p], ...(times ? [B.plainPlaceNames[-1], B.plainPlaceNames[-1 + k]] : [B.plainPlaceNames[0], B.plainPlaceNames[-k]])),
      options: shifts.map((s) => f(shift(answer, s))),
      answerIndex: shifts.indexOf(0),
      answer,
      visual: [],
      columns: { digits: sig, ends, from, minPos: Math.min(-2, ...ends, from.end) },
    },
  ]
}

/** decimal · decimal: the table fact, "tiondelar gånger tiondelar blir hundradelar", pick the number. */
function decimalTimesDecimal(a, b) {
  const ka = decimals(a)
  const kb = decimals(b)
  const unitKey = unitKeyFor(ka + kb)
  if (!unitKey) return null
  const da = dec(Number(digits(a)))
  const db = dec(Number(digits(b)))
  const fact = mul(da, db)
  const name = (k) => B.units[unitKeyFor(k)].many
  const first = name(ka)
  return [
    { kind: "number", prompt: B.calcPrompt(f(da), "·", f(db)), help: B.tableFactHelp, answer: fact, visual: [a, b] },
    { kind: "choose", prompt: B.unitTimesUnitPrompt(first[0].toUpperCase() + first.slice(1), name(kb)), help: B.unitTimesUnitHelp(B.units[unitKeyFor(Math.max(ka, kb))].one), options: B.unitTimesUnitOptions, answerIndex: ka + kb - 1, visual: [] },
    unitsChoice(fact, unitKey),
  ]
}

/** decimal / whole: count in tiondelar/hundradelar, divide (one table fact), pick the number. */
function decimalDivideWhole(a, b) {
  const unitKey = unitKeyFor(decimals(a))
  if (!unitKey) return null
  const count = shift(a, decimals(a))
  const q = divide(count, b)
  if (!q || !isInteger(q)) return null
  const unit = B.units[unitKey]
  return [
    countStep(a, unitKey),
    { kind: "number", prompt: B.unitDivPrompt(f(count), unitWord(unitKey, count), f(b), unit.many), help: B.unitDivHelp(unit.many), answer: q, visual: [] },
    unitsChoice(q, unitKey),
  ]
}

/** whole · whole with zeros: the table fact, then put the zeros back. */
function wholeTimes(a, b, r, expr) {
  const za = trailingZeros(a)
  const zb = trailingZeros(b)
  const z = za + zb
  if (z === 0 || !B.zeroWords[z]) return null
  const fa = dec(num(a) / 10 ** za)
  const fb = dec(num(b) / 10 ** zb)
  const x = mul(fa, fb)
  return [
    { kind: "number", prompt: B.calcPrompt(f(fa), "·", f(fb)), help: B.tableFactWholeHelp, answer: x, visual: [] },
    { kind: "choose", prompt: question(expr), help: B.zerosHelp(f(a), f(b), B.zeroWords[z], f(x)), options: [-1, 0, 1].map((s) => f(shift(r, s))), answerIndex: 1, answer: r, visual: [] },
  ]
}

/** whole / whole: cross out equal zeros (6 000 / 200 → 60 / 2), or count in hundratal/tiotal. */
function wholeDivide(a, b, r) {
  if (!isInteger(r)) return null
  const z = Math.min(trailingZeros(a), trailingZeros(b))
  if (z > 0) {
    const a2 = dec(num(a) / 10 ** z)
    const b2 = dec(num(b) / 10 ** z)
    const timesTen = `${f(shift(a2, 1))} / ${f(b2)}` // struck one zero too few in the dividend
    const right = `${f(a2)} / ${f(b2)}`
    const onlyOne = `${f(a2)} / ${f(b)}`
    return [
      { kind: "choose", prompt: B.cancelPrompt(`${f(a)} / ${f(b)}`), help: B.cancelHelp, options: [right, onlyOne, timesTen], answerIndex: 0, visual: [] },
      { kind: "number", prompt: B.calcPrompt(f(a2), "/", f(b2)), help: B.divideHelp(f(b2), f(a2)), answer: r, visual: [] },
    ]
  }
  const A = num(a)
  const Bn = num(b)
  const unitKey = A % 100 === 0 && (A / 100) % Bn === 0 ? "hundreds" : A % 10 === 0 && (A / 10) % Bn === 0 ? "tens" : null
  if (!unitKey) return null
  const u = unitKey === "hundreds" ? 2 : 1
  const unit = B.wholeUnits[unitKey].many
  const count = dec(A / 10 ** u)
  const q = dec(A / 10 ** u / Bn)
  return [
    { kind: "number", prompt: B.wholeUnitCountPrompt(f(a), unit), help: B.wholeUnitCountHelp[unitKey], answer: count, visual: [a] },
    { kind: "number", prompt: B.unitDivPrompt(f(count), unit, f(b), unit), help: B.unitDivHelp(unit), answer: q, visual: [] },
    { kind: "choose", prompt: B.wholeUnitWhichPrompt(f(q), unit), help: B.wholeUnitWhichHelp[unitKey], options: [u - 1, u, u + 1].map((s) => f(shift(q, s))), answerIndex: 1, answer: r, visual: [] },
  ]
}

/** x / decimal: make the divisor whole (20 / 0,5 = 200 / 5), then divide. */
function wholeDivisor(a, b, r) {
  const k = decimals(b)
  const a2 = shift(a, k)
  const b2 = shift(b, k)
  return [
    {
      kind: "choose",
      prompt: B.divisorPrompt(`${f(a)} / ${f(b)}`),
      help: B.divisorHelp(f(dec(10 ** k))),
      options: [`${f(a)} / ${f(b2)}`, `${f(a2)} / ${f(b2)}`, `${f(shift(a2, 1))} / ${f(b2)}`],
      answerIndex: 1,
      visual: [],
    },
    { kind: "number", prompt: B.calcPrompt(f(a2), "/", f(b2)), help: B.divideHelp(f(b2), f(a2)), answer: r, visual: [] },
  ]
}

function stepsFor(values, ops, answer, expr) {
  if (values.length > 2) return [chain(values, ops), "chain"]
  const [a, b] = values
  const op = ops[0]
  if (op === "+" || op === "-") {
    if (isNeg(a) || isNeg(b) || isNeg(answer)) return [negative(a, op, b, answer), "negative"]
    if (isInteger(a) && isInteger(b)) return [wholeAddSub(a, op, b, answer), "whole-add-sub"]
    return [unitsAddSub(a, op, b, answer), "units-add-sub"]
  }
  if (op === "·") {
    if (isInteger(a) && isInteger(b)) return [wholeTimes(a, b, answer, expr), "whole-times"]
    if (isPower(a) && !isInteger(b)) return [scale("·", b, a, expr), "scale"]
    if (isPower(b) && !isInteger(a)) return [scale("·", a, b, expr), "scale"]
    if (!isInteger(a) && !isInteger(b)) return [decimalTimesDecimal(a, b), "decimal-times-decimal"]
    return [null, null] // decimal · whole: tasks/breakdown.js (0002) handles the ones it fits
  }
  if (isPower(b)) return [scale("/", a, b, expr), "scale"]
  if (isInteger(a) && isInteger(b)) return [wholeDivide(a, b, answer), "whole-divide"]
  if (isInteger(b)) return [decimalDivideWhole(a, b), "units-divide"]
  return [wholeDivisor(a, b, answer), "whole-divisor"]
}

export function strategyFor(text) {
  const parsed = parse(text)
  if (!parsed) return null
  const { values, ops } = parsed
  let answer = values[0]
  for (let i = 0; i < ops.length; i++) {
    if (values.length > 2 && (ops[i] === "·" || ops[i] === "/")) return null // only +/− chains
    answer = apply(answer, ops[i], values[i + 1])
    if (answer === null) return null
  }
  const [steps, name] = stepsFor(values, ops, answer, text)
  return steps ? breakdownOf(text, answer, steps, name) : null
}
