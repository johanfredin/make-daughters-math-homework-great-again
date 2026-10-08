// The six level slots, identical to site/worlds/kap1/world.json (asserted in tests/site/worlds.test.js).
// Each slot mirrors a pattern on sources/kap1/multiply-decimals.png — same vintage, never harder.
export const SLOTS = [
  { type: "decimal-multiply", whole: { from: 2, to: 9 }, decimal: "0,d" },
  { type: "decimal-multiply", whole: { from: 2, to: 9 }, decimal: "0,0d" },
  { type: "decimal-multiply", whole: { from: 2, to: 6 }, decimal: "n,5", n: [1, 2] },
  { type: "decimal-multiply", whole: { from: 20, to: 90, step: 10 }, decimal: "0,d" },
  { type: "decimal-multiply", whole: { from: 20, to: 90, step: 10 }, decimal: "0,0d" },
  { type: "decimal-multiply", whole: { from: 200, to: 500, step: 100 }, decimal: "0,d" },
]

export const DECIMAL_PATTERN = {
  "0,d": /^0\.[1-9]$/,
  "0,0d": /^0\.0[1-9]$/,
  "n,5": /^[12]\.5$/,
}

export function wholeSet({ from, to, step = 1, also = [] }) {
  const s = new Set(also)
  for (let v = from; v <= to; v += step) s.add(v)
  return s
}
