// Exact decimal numbers: { n, scale } means n / 10^scale, with n a safe integer.
// All game maths goes through here so that 0.1 + 0.2 style float noise can never reach the player.

const POW10 = (k) => 10 ** k

export function normalise({ n, scale }) {
  if (n === 0) return { n: 0, scale: 0 }
  while (scale > 0 && n % 10 === 0) {
    n /= 10
    scale--
  }
  return { n, scale }
}

/** From an integer, or a string like "1,5", "-0.04", ",5". Throws on anything else. */
export function dec(x) {
  if (typeof x === "number") {
    if (!Number.isSafeInteger(x)) throw new TypeError(`dec: only integers may be passed as numbers, got ${x}`)
    return { n: x, scale: 0 }
  }
  if (typeof x === "object" && x !== null && "n" in x && "scale" in x) return normalise(x)
  const m = /^(-?)(\d*)(?:[.,](\d*))?$/.exec(String(x).trim())
  if (!m || (m[2] === "" && (m[3] ?? "") === "")) throw new TypeError(`dec: not a number: "${x}"`)
  const [, sign, whole, frac = ""] = m
  const n = Number((whole || "0") + frac) * (sign ? -1 : 1)
  if (!Number.isSafeInteger(n)) throw new RangeError(`dec: out of range: "${x}"`)
  return normalise({ n, scale: frac.length })
}

const align = (a, b) => {
  const scale = Math.max(a.scale, b.scale)
  return [a.n * POW10(scale - a.scale), b.n * POW10(scale - b.scale), scale]
}

export function mul(a, b) {
  return normalise({ n: a.n * b.n, scale: a.scale + b.scale })
}

export function add(a, b) {
  const [x, y, scale] = align(a, b)
  return normalise({ n: x + y, scale })
}

export function sub(a, b) {
  return add(a, { n: -b.n, scale: b.scale })
}

export function cmp(a, b) {
  const [x, y] = align(a, b)
  return Math.sign(x - y)
}

export function eq(a, b) {
  return cmp(a, b) === 0
}

/** Multiply by 10^k (k may be negative): moves the decimal comma. */
export function shift(x, k) {
  if (k >= 0) {
    const drop = Math.min(k, x.scale)
    return normalise({ n: x.n * POW10(k - drop), scale: x.scale - drop })
  }
  return normalise({ n: x.n, scale: x.scale - k })
}

export function isInteger(x) {
  return normalise(x).scale === 0
}

/** Number of decimals after normalising (0,04 → 2). */
export function decimals(x) {
  return normalise(x).scale
}

/** The value's digits without sign or comma, e.g. 0,24 → "24", 6 → "6". */
export function digits(x) {
  return String(Math.abs(normalise(x).n))
}

/** Plain, locale-free string with a dot, for logs and tests: 7.5, -0.04. */
export function toPlain(x) {
  const { n, scale } = normalise(x)
  if (scale === 0) return String(n)
  const abs = String(Math.abs(n)).padStart(scale + 1, "0")
  return `${n < 0 ? "-" : ""}${abs.slice(0, -scale)}.${abs.slice(-scale)}`
}
