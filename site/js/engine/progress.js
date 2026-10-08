// Saved progress (R8, R16): pure state helpers plus a thin, never-throwing storage adapter.
// Keys earned = levels cleared (one key per level). Storage is passed in (localStorage in the browser).
import { levels, startNode } from "./world.js"

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
  const { version, worldId, nodeId, visited, cleared, levelTask, fur, name } = obj
  return { version, worldId, nodeId, visited, cleared, unlocked: [], levelTask, fur, name } // old unlock lists are ignored (0002 R4)
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

/** A level that is not built yet: shown with a sign post, "Kommer snart" when she goes in (0002 R1). */
export const isComingSoon = (node) => node.kind === "level" && !node.playable

/** Shown with a padlock on the map. Since 0002 only the boss can be locked (all levels are open). */
export function isLocked(world, state, node) {
  return node.kind === "boss" && keys(state) < world.keysToBoss
}

/** Why she may not go *into* `node`: "comingSoon" | "bossLocked" | null. Walking is never blocked. */
export function enterReason(world, state) {
  return (node) => (isComingSoon(node) ? "comingSoon" : isLocked(world, state, node) ? "bossLocked" : null)
}

/**
 * → { state, keyAwarded }. `unlocked` stays in saved data (always empty, never read) so that 0001 code,
 * which requires the field, can still read 0002 saves after a rollback.
 */
export function clearLevel(world, state, levelId) {
  const levelTask = { ...state.levelTask }
  delete levelTask[levelId]
  if (state.cleared.includes(levelId)) return { state: { ...state, levelTask }, keyAwarded: false }
  return { state: { ...state, cleared: [...state.cleared, levelId], levelTask }, keyAwarded: true }
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
