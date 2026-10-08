// Swedish number notation: decimal comma, space as thousands separator, real minus sign, middle dot.
import { dec, toPlain } from "../engine/decimal.js"

export const MINUS = "−"
export const TIMES = "·"

const OPS = { "*": TIMES, "+": "+", "-": MINUS, "/": "/" }

/** Format a decimal (or a plain JS number) the Swedish way: 1 000,5 · −7 · 0,04 */
export function formatNumber(x) {
  const d = typeof x === "number" ? dec(String(x)) : dec(x)
  const plain = toPlain(d)
  const negative = plain.startsWith("-")
  const [whole, frac] = (negative ? plain.slice(1) : plain).split(".")
  const grouped = whole.length > 3 ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : whole
  return `${negative ? MINUS : ""}${grouped}${frac ? "," + frac : ""}`
}

export function formatExpr(a, op, b) {
  return `${formatNumber(a)} ${OPS[op] ?? op} ${formatNumber(b)}`
}

/**
 * Read what the player typed. Accepts "," or ".", spaces between digits, a leading comma,
 * trailing zeros and both minus signs. Returns a decimal, or null if it is not a number.
 */
export function parseAnswer(input) {
  if (typeof input !== "string") return null
  const s = input.replace(/[−–]/g, "-").replace(/[\s  ]+/g, "")
  if (!/^-?\d*(?:[.,]\d*)?$/.test(s) || !/\d/.test(s)) return null
  return dec(s.endsWith(",") || s.endsWith(".") ? s.slice(0, -1) : s)
}
