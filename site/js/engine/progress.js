// Saved progress (R8, R16): pure state helpers plus a thin, never-throwing storage adapter.
// Keys earned = levels cleared (one key per level). Storage is passed in (localStorage in the browser).
import { levels, nodeById, startNode } from "./world.js"

export const STORAGE_KEY = "mattespel.v1"
export const VERSION = 1
export const MAX_NAME = 16
export const FUR_COUNT = 4

export function freshState(world) {
  return {
    version: VERSION,
    worldId: world.id,
    nodeId: startNode(world).id,
    visited: [startNode(world).id],
    cleared: [],
    unlocked: [],
    levelTask: {},
    fur: 0,
    name: null,
  }
}

const isStringArray = (a) => Array.isArray(a) && a.every((x) => typeof x === "string")

/** Returns the state if it is a well-formed save for this world, otherwise null. */
export function validate(obj, world) {
  if (!obj || typeof obj !== "object") return null
  const ids = new Set(world.nodes.map((n) => n.id))
  const levelIds = new Set(levels(world).map((n) => n.id))
  const ok =
    obj.version === VERSION &&
    obj.worldId === world.id &&
    ids.has(obj.nodeId) &&
    isStringArray(obj.visited) && obj.visited.every((id) => ids.has(id)) &&
    isStringArray(obj.cleared) && obj.cleared.every((id) => levelIds.has(id)) &&
    isStringArray(obj.unlocked) && obj.unlocked.every((id) => levelIds.has(id)) &&
    obj.levelTask && typeof obj.levelTask === "object" && !Array.isArray(obj.levelTask) &&
    Object.entries(obj.levelTask).every(([id, i]) => levelIds.has(id) && Number.isInteger(i) && i >= 0) &&
    Number.isInteger(obj.fur) && obj.fur >= 0 && obj.fur < FUR_COUNT &&
    (obj.name === null || (typeof obj.name === "string" && obj.name.length <= MAX_NAME))
  if (!ok) return null
  const { version, worldId, nodeId, visited, cleared, unlocked, levelTask, fur, name } = obj
  return { version, worldId, nodeId, visited, cleared, unlocked, levelTask, fur, name }
}

/** → { state, reset }. reset is true when a save existed but could not be used (show a message). */
export function load(storage, world) {
  let raw
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { state: freshState(world), reset: false }
  }
  if (raw === null || raw === undefined) return { state: freshState(world), reset: false }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { state: freshState(world), reset: true }
  }
  const state = validate(parsed, world)
  return state ? { state, reset: false } : { state: freshState(world), reset: true }
}

/** → true when saved. Never throws (private mode, full storage). */
export function save(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function hasSave(storage) {
  try {
    return storage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export function clear(storage) {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // nothing to do: there is no save we can reach
  }
}

export const keys = (state) => state.cleared.length

export function isUnlocked(world, state, levelId) {
  return Boolean(nodeById(world, levelId)?.startUnlocked) || state.unlocked.includes(levelId)
}

/** Shown with a lock on the map. Not-yet-built levels stay locked ("Kommer snart"). */
export function isLocked(world, state, node) {
  if (node.kind === "level") return !node.playable || !isUnlocked(world, state, node.id)
  if (node.kind === "boss") return keys(state) < world.keysToBoss
  return false
}

/** For world.tryMove: why the cat may not walk to `node`, or null. */
export function blockedReason(world, state) {
  return (node) => (!isLocked(world, state, node) ? null : node.kind === "boss" ? "bossLocked" : "comingSoon")
}

/** → { state, keyAwarded }. The next level in journey order gets unlocked. */
export function clearLevel(world, state, levelId) {
  const levelTask = { ...state.levelTask }
  delete levelTask[levelId]
  if (state.cleared.includes(levelId)) return { state: { ...state, levelTask }, keyAwarded: false }
  const order = levels(world).map((n) => n.id)
  const next = order[order.indexOf(levelId) + 1]
  const unlocked = next && !state.unlocked.includes(next) ? [...state.unlocked, next] : state.unlocked
  return { state: { ...state, cleared: [...state.cleared, levelId], unlocked, levelTask }, keyAwarded: true }
}

export function moveTo(state, nodeId) {
  const visited = state.visited.includes(nodeId) ? state.visited : [...state.visited, nodeId]
  return { ...state, nodeId, visited }
}

export function setTaskIndex(state, levelId, index) {
  return { ...state, levelTask: { ...state.levelTask, [levelId]: index } }
}

export function withCat(state, { name, fur }) {
  const trimmed = typeof name === "string" ? name.trim().slice(0, MAX_NAME) : ""
  const safeFur = Number.isInteger(fur) && fur >= 0 && fur < FUR_COUNT ? fur : 0
  return { ...state, name: trimmed || null, fur: safeFur }
}
