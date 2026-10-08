import { test } from "node:test"
import assert from "node:assert/strict"
import * as W from "../../site/js/engine/walk-queue.js"

const E = 0, N = -Math.PI / 2

test("0002 AC10 (R12): a push while standing walks at once", () => {
  const r = W.push(W.idle(), E)
  assert.equal(r.go, E)
})

test("0002 AC10 (R12): one push = one stone — with no new push the cat stops on arrival", () => {
  let q = W.started(W.push(W.idle(), E).q)
  const r = W.arrived(q)
  assert.equal(r.go, null)
  assert.deepEqual(r.q, W.idle())
})

test("0002 AC10 (R12): a push during a walk is remembered and done on arrival, once", () => {
  let q = W.started(W.idle())
  let r = W.push(q, N)
  assert.equal(r.go, null, "not walked yet")
  r = W.arrived(r.q)
  assert.equal(r.go, N, "done on arrival")
  q = W.started(r.q)
  assert.equal(W.arrived(q).go, null, "not repeated on the next stone")
})

test("0002 AC10 (R12): the latest push during a walk wins", () => {
  let q = W.started(W.idle())
  q = W.push(q, N).q
  q = W.push(q, E).q
  assert.equal(W.arrived(q).go, E)
})
