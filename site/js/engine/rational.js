// Exact fractions { num, den } for answer checking (0003): sheet answers can be fractions (7/5, 5/7)
// or decimals, and 1,5 must equal 15/10. Safe integers suffice for homework-sized numbers.

const gcd = (a, b) => {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a || 1
}

export function rat(num, den = 1) {
  if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den) || den === 0) throw new RangeError(`rat: bad ${num}/${den}`)
  const g = gcd(num, den) * Math.sign(den)
  return { num: num / g || 0, den: den / g }
}

/** "1,5", "0.25", "−3", "7/5", "23 460" → rational; anything else → null. */
export function parseRational(input) {
  if (typeof input !== "string") return null
  const s = input.replace(/[−–]/g, "-").replace(/[\s  ]+/g, "")
  let m = /^(-?\d+)\/(\d+)$/.exec(s)
  if (m) return Number(m[2]) === 0 ? null : rat(Number(m[1]), Number(m[2]))
  m = /^(-?)(\d*)(?:[.,](\d*))?$/.exec(s)
  if (!m || (m[2] === "" && (m[3] ?? "") === "")) return null
  const frac = m[3] ?? ""
  const num = Number((m[2] || "0") + frac) * (m[1] ? -1 : 1)
  return rat(num, 10 ** frac.length)
}

export const add = (a, b) => rat(a.num * b.den + b.num * a.den, a.den * b.den)
export const sub = (a, b) => rat(a.num * b.den - b.num * a.den, a.den * b.den)
export const mul = (a, b) => rat(a.num * b.num, a.den * b.den)
export const div = (a, b) => rat(a.num * b.den, a.den * b.num)
export const cmp = (a, b) => Math.sign(a.num * b.den - b.num * a.den)
export const eq = (a, b) => cmp(a, b) === 0
export const toNumber = (a) => a.num / a.den
