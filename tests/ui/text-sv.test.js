import { test } from "node:test"
import assert from "node:assert/strict"
import { T } from "../../site/js/ui/text-sv.js"

// English UI words that must never reach the player (R15). "OK" is fine in Swedish.
const ENGLISH = /\b(level|levels|boss|score|game ?over|lives|loading|error|continue|restart|play|hint|next|back|start|key|keys|world|camp|task)\b/i

/** Every displayed string, with template functions called on sample arguments. */
function allStrings(node, path = "T") {
  if (typeof node === "string") return [[path, node]]
  if (typeof node === "function") {
    const sample = Array.from({ length: node.length }, (_, i) => String(i + 2))
    return allStrings(node(...sample), `${path}()`)
  }
  if (Array.isArray(node)) return node.flatMap((v, i) => allStrings(v, `${path}[${i}]`))
  if (node && typeof node === "object") return Object.entries(node).flatMap(([k, v]) => allStrings(v, `${path}.${k}`))
  throw new Error(`unexpected value at ${path}: ${node}`)
}

const strings = allStrings(T)

test("there are player strings", () => {
  assert.ok(strings.length > 50)
})

test("AC13: no empty strings", () => {
  for (const [path, s] of strings) assert.ok(s.trim().length > 0, `${path} is empty`)
})

test("AC13: no English UI words", () => {
  for (const [path, s] of strings) assert.doesNotMatch(s, ENGLISH, `${path}: "${s}"`)
})

test("Swedish notation: no dot decimals or star multiplication in texts", () => {
  for (const [path, s] of strings) {
    assert.doesNotMatch(s, /\d\.\d/, `${path} uses a decimal point`)
    assert.doesNotMatch(s, /\d ?\* ?\d/, `${path} uses * for multiplication`)
  }
})
