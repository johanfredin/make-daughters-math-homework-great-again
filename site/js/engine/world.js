// World data: validation, lookups and SMB3-style movement along paths (R5, R6, R19).
// Pure: no DOM. Angles are radians in screen space (y down): 0 = right, π/2 = down.
import { TASK_TYPES } from "../tasks/index.js"

export const MAP_W = 320
export const MAP_H = 180
const KINDS = new Set(["start", "level", "camp", "boss"])

/** Returns a list of human-readable problems; empty means valid. */
export function validateWorld(w) {
  const errors = []
  const err = (m) => errors.push(m)
  if (!w || typeof w !== "object") return ["world is not an object"]
  if (typeof w.id !== "string" || !w.id) err("world.id missing")
  if (typeof w.name !== "string" || !w.name) err("world.name missing")
  if (!Number.isInteger(w.keysToBoss) || w.keysToBoss < 1) err("world.keysToBoss must be a positive integer")
  if (!Array.isArray(w.nodes) || w.nodes.length === 0) return [...errors, "world.nodes missing"]

  const ids = new Set()
  for (const [i, n] of w.nodes.entries()) {
    const at = `nodes[${i}]${n?.id ? ` (${n.id})` : ""}`
    if (typeof n?.id !== "string" || !n.id) err(`${at}: id missing`)
    else if (ids.has(n.id)) err(`${at}: duplicate id`)
    else ids.add(n.id)
    if (!KINDS.has(n?.kind)) err(`${at}: kind must be one of ${[...KINDS].join(", ")}`)
    if (!(n?.x >= 0 && n.x <= MAP_W && n?.y >= 0 && n.y <= MAP_H)) err(`${at}: x/y missing or outside the ${MAP_W}×${MAP_H} map`)
    if (n?.kind !== "start" && (typeof n?.name !== "string" || !n.name)) err(`${at}: name missing`)
    if (n?.kind === "level") {
      if (typeof n.playable !== "boolean") err(`${at}: playable must be true or false`)
      if (n.playable) {
        if (!Array.isArray(n.tasks) || n.tasks.length === 0) err(`${at}: a playable level needs tasks`)
        else n.tasks.forEach((t, j) => TASK_TYPES[t?.type] || err(`${at}: tasks[${j}] has unknown type "${t?.type}"`))
      }
    }
    if (n?.kind === "camp") {
      if (typeof n.mentor !== "string" || !n.mentor) err(`${at}: mentor missing`)
      if (!n.demo || typeof n.demo.decimal !== "string" || !Number.isInteger(n.demo.whole)) err(`${at}: demo {decimal, whole} missing`)
    }
  }
  const byKind = (k) => w.nodes.filter((n) => n?.kind === k)
  if (byKind("start").length !== 1) err("there must be exactly one start node")
  if (byKind("boss").length > 1) err("there can be at most one boss node")
  if (Number.isInteger(w.keysToBoss) && w.keysToBoss > byKind("level").length) err("keysToBoss is more than the number of levels")
  for (const c of byKind("camp")) {
    const src = w.nodes.find((n) => n?.id === c.practiceFrom)
    if (!src?.playable) err(`camp ${c.id}: practiceFrom must name a playable level`)
  }

  if (!Array.isArray(w.paths)) return [...errors, "world.paths missing"]
  for (const [i, p] of w.paths.entries()) {
    if (!Array.isArray(p) || p.length !== 2 || !ids.has(p[0]) || !ids.has(p[1]) || p[0] === p[1]) err(`paths[${i}]: must join two different existing nodes`)
  }
  if (errors.length === 0) {
    const start = byKind("start")[0].id
    const seen = new Set([start])
    const queue = [start]
    while (queue.length) {
      for (const n of neighbours(w, queue.shift())) {
        if (seen.has(n)) continue
        seen.add(n)
        queue.push(n)
      }
    }
    for (const id of ids) if (!seen.has(id)) err(`node ${id} cannot be reached from start`)
  }
  return errors
}

export function nodeById(world, id) {
  return world.nodes.find((n) => n.id === id)
}

export function startNode(world) {
  return world.nodes.find((n) => n.kind === "start")
}

/** Level nodes in journey order (the order of `nodes`). */
export function levels(world) {
  return world.nodes.filter((n) => n.kind === "level")
}

export function neighbours(world, id) {
  return world.paths.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []))
}

const angleDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))

/**
 * The neighbour whose path direction is closest to `angle`, within 45°; null if none.
 * An exact diagonal tie goes to the horizontal path, so diagonal pushes are predictable.
 */
export function neighbourInDirection(world, id, angle) {
  const from = nodeById(world, id)
  const EPS = 1e-9
  let best = null
  for (const nid of neighbours(world, id)) {
    const to = nodeById(world, nid)
    const dx = Math.abs(to.x - from.x)
    const diff = angleDiff(Math.atan2(to.y - from.y, to.x - from.x), angle)
    if (diff > Math.PI / 4 + EPS) continue
    if (!best || diff < best.diff - EPS || (Math.abs(diff - best.diff) <= EPS && dx > best.dx)) {
      best = { id: nid, diff, dx }
    }
  }
  return best?.id ?? null
}

/**
 * Decide what happens when she pushes a direction on node `from`.
 * blockedReason(node) returns null when the node may be walked to, otherwise a reason string.
 * → { move: id } | { blocked: reason, target: id } | { bump: true }
 */
export function tryMove(world, from, angle, blockedReason) {
  const to = neighbourInDirection(world, from, angle)
  if (!to) return { bump: true }
  const reason = blockedReason(nodeById(world, to))
  return reason ? { blocked: reason, target: to } : { move: to }
}
