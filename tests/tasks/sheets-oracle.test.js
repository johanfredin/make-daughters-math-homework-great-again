// 0003 AC1: every homework sheet file is valid, has the right number of tasks, and every answer that
// can be computed is recomputed here with an independent exact-fraction calculator (BigInt), so a
// transcription error fails verify.sh.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { validateSheet } from "../../site/js/engine/sheet.js"

const world = JSON.parse(readFileSync(new URL("../../site/worlds/kap1/world.json", import.meta.url), "utf8"))
const sheets = Object.fromEntries(
  world.nodes.filter((n) => n.kind === "level").map((n) => [n.id, JSON.parse(readFileSync(new URL(`../../site/worlds/kap1/${n.sheet}`, import.meta.url), "utf8"))]),
)

// ---- independent exact arithmetic: [num, den] as BigInt ----
const g = (a, b) => (b === 0n ? (a < 0n ? -a : a) : g(b, a % b))
const R = (n, d = 1n) => {
  if (d < 0n) [n, d] = [-n, -d]
  const k = g(n, d) || 1n
  return [n / k, d / k]
}
const radd = ([a, b], [c, d]) => R(a * d + c * b, b * d)
const rsub = ([a, b], [c, d]) => R(a * d - c * b, b * d)
const rmul = ([a, b], [c, d]) => R(a * c, b * d)
const rdiv = ([a, b], [c, d]) => R(a * d, b * c)
const cmp = (x, y) => { const [a, b] = rsub(x, y); return a === 0n ? 0 : a > 0n ? 1 : -1 }

/** A number as written on the sheet: "23 460", "−0,019", "3/4", "2 3/7". */
function value(tok) {
  let s = tok.trim().replace("−", "-")
  const neg = s.startsWith("-")
  if (neg) s = s.slice(1)
  let v
  let m
  if ((m = /^(\d+) (\d+)\/(\d+)$/.exec(s))) v = radd(R(BigInt(m[1])), R(BigInt(m[2]), BigInt(m[3])))
  else if ((m = /^(\d+)\/(\d+)$/.exec(s))) v = R(BigInt(m[1]), BigInt(m[2]))
  else {
    const [w, f = ""] = s.replace(/ /g, "").split(",")
    assert.match(w + f, /^\d+$/, `not a number: "${tok}"`)
    v = R(BigInt(w + f), 10n ** BigInt(f.length))
  }
  return neg ? rmul(v, R(-1n)) : v
}

/** "a op b op c" with · and / before + and −; operators are surrounded by spaces. */
function evaluate(text) {
  const parts = text.split(/ ([+−·/]) /)
  const terms = [[value(parts[0])]]
  const addOps = []
  for (let i = 1; i < parts.length; i += 2) {
    const op = parts[i]
    const v = value(parts[i + 1])
    if (op === "·" || op === "/") terms.at(-1).push(op, v)
    else {
      addOps.push(op)
      terms.push([v])
    }
  }
  const product = (t) => {
    let acc = t[0]
    for (let i = 1; i < t.length; i += 2) acc = t[i] === "·" ? rmul(acc, t[i + 1]) : rdiv(acc, t[i + 1])
    return acc
  }
  let acc = product(terms[0])
  addOps.forEach((op, i) => (acc = op === "+" ? radd(acc, product(terms[i + 1])) : rsub(acc, product(terms[i + 1]))))
  return acc
}
const isExpr = (s) => / [+−·/] /.test(s) || /^[\d ,−]+(?:\/\d+)?$/.test(s) && /\d \d\/\d/.test(s)

function roundTo(v, step) {
  // round half up to a multiple of step (step as rational)
  const q = rdiv(v, step)
  const [n, d] = q
  const floor = n >= 0n ? n / d : -((-n + d - 1n) / d)
  const frac = rsub(q, R(floor))
  const r = cmp(frac, R(1n, 2n)) >= 0 ? floor + 1n : floor
  return rmul(R(r), step)
}
const ROUND_STEPS = { "Avrunda till heltal.": R(1n), "Avrunda till tiotal.": R(10n), "Avrunda till hundradelar.": R(1n, 100n) }

test("0003 AC1: all 7 sheets are valid and hold 170 tasks", () => {
  const counts = Object.fromEntries(Object.entries(sheets).map(([id, s]) => [id, s.tasks.length]))
  assert.deepEqual(counts, { rakna: 40, multiplikation: 32, "blandad-form": 5, "hur-raknar-1": 8, "hur-raknar-2": 8, "repetition-1": 38, "repetition-2": 39 })
  for (const [id, s] of Object.entries(sheets)) assert.deepEqual(validateSheet(s), [], id)
})

test("0003 AC1: every computable answer matches an independent calculation", () => {
  let checked = 0
  for (const [level, sheet] of Object.entries(sheets)) {
    for (const t of sheet.tasks) {
      const at = `${level} ${t.id} "${t.text ?? t.prompt}"`
      if (t.kind === "number" && t.prompt in ROUND_STEPS) {
        assert.equal(cmp(value(t.answer), roundTo(value(t.text), ROUND_STEPS[t.prompt])), 0, at)
        checked++
      } else if (t.kind === "number" && isExpr(t.text)) {
        assert.equal(cmp(value(t.answer), evaluate(t.text)), 0, `${at}: expected ${evaluate(t.text).join("/")}`)
        checked++
      } else if (t.kind === "fraction") {
        assert.equal(cmp(rmul(evaluate(t.text), R(BigInt(t.den))), value(t.answer)), 0, at)
        checked++
      } else if (t.kind === "estimate") {
        const exact = evaluate(t.text)
        const off = rdiv(rsub(value(t.answer), exact), exact)
        assert.ok(cmp(off, R(15n, 100n)) <= 0 && cmp(off, R(-15n, 100n)) >= 0, `${at}: estimate too far off`)
        checked++
      } else if (t.kind === "choice" && /störst|minst/.test(t.prompt)) {
        const vals = t.options.map(value)
        const best = vals.reduce((bi, v, i) => (cmp(v, vals[bi]) * (/störst/.test(t.prompt) ? 1 : -1) > 0 ? i : bi), 0)
        assert.equal(t.answer, best, at)
        checked++
      } else if (t.kind === "choice" && t.prompt === "Vilket svar är bäst?") {
        const exact = evaluate(t.text)
        const dist = t.options.map((o) => { const d = rsub(value(o), exact); return d[0] < 0n ? rmul(d, R(-1n)) : d })
        const best = dist.reduce((bi, d, i) => (cmp(d, dist[bi]) < 0 ? i : bi), 0)
        assert.equal(t.answer, best, at)
        checked++
      } else if (t.kind === "numberline") {
        const v = value(t.answer)
        assert.ok(cmp(v, value(t.from)) >= 0 && cmp(v, value(t.to)) <= 0, at)
      }
    }
  }
  assert.ok(checked >= 120, `only ${checked} answers checked`)
})

test("0003 AC1: number-line answers read from the zoomed photo", () => {
  const nl = sheets["repetition-2"].tasks.filter((t) => t.kind === "numberline").map((t) => t.answer)
  assert.deepEqual(nl, ["0,03", "0,18", "0,35", "0,76", "0,82", "1,04"])
})

test("0003: 'Hur räknar du?' choices have distinct options and a valid answer", () => {
  for (const id of ["hur-raknar-1", "hur-raknar-2"]) {
    for (const t of sheets[id].tasks) {
      assert.equal(new Set(t.options).size, t.options.length, `${id} ${t.id}`)
      assert.ok(t.answer >= 0 && t.answer < t.options.length)
    }
  }
})
