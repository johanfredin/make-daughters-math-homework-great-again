// Saved progress (R8, R16): pure state helpers plus a thin, never-throwing storage adapter.
// Keys earned = levels cleared: a level's key comes once 2/3 of its tasks are solved (0003 R7).
// Storage is passed in (localStorage in the browser).
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
    solved: {}, // levelId → ids of solved sheet tasks (0003)
    sound: true,
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
    (obj.name === null || (typeof obj.name === "string" && obj.name.length <= MAX_NAME)) &&
    // optional since 0003, so 0001/0002 saves stay valid
    (obj.solved === undefined ||
      (obj.solved && typeof obj.solved === "object" && !Array.isArray(obj.solved) &&
        Object.entries(obj.solved).every(([id, list]) => levelIds.has(id) && isStringArray(list)))) &&
    (obj.sound === undefined || typeof obj.sound === "boolean")
  if (!ok) return null
  const { version, worldId, nodeId, visited, cleared, levelTask, fur, name } = obj
  const solved = obj.solved ?? {}
  const sound = obj.sound ?? true
  return { version, worldId, nodeId, visited, cleared, unlocked: [], levelTask, fur, name, solved, sound } // old unlock lists are ignored (0002 R4)
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

/** Solved tasks needed for a level's key: ⌈2/3 · total⌉ (0003 R7). */
export const keyThreshold = (total) => Math.ceil((2 * total) / 3)

export const solvedIds = (state, levelId) => state.solved[levelId] ?? []

export function markSolved(state, levelId, ids) {
  const before = solvedIds(state, levelId)
  const added = ids.filter((id) => !before.includes(id))
  if (added.length === 0) return state
  return { ...state, solved: { ...state.solved, [levelId]: [...before, ...added] } }
}

/**
 * → { state, keyAwarded }: the key comes once, when the solved count reaches the threshold.
 * `unlocked` and `levelTask` stay in saved data (never read) so 0001/0002 code can still read 0003 saves.
 */
export function awardKeyIfEarned(state, levelId, total) {
  if (state.cleared.includes(levelId) || solvedIds(state, levelId).length < keyThreshold(total)) return { state, keyAwarded: false }
  return { state: { ...state, cleared: [...state.cleared, levelId] }, keyAwarded: true }
}

export const withSound = (state, on) => ({ ...state, sound: Boolean(on) })

export function moveTo(state, nodeId) {
  const visited = state.visited.includes(nodeId) ? state.visited : [...state.visited, nodeId]
  return { ...state, nodeId, visited }
}

export function withCat(state, { name, fur }) {
  const trimmed = typeof name === "string" ? name.trim().slice(0, MAX_NAME) : ""
  const safeFur = Number.isInteger(fur) && fur >= 0 && fur < FUR_COUNT ? fur : 0
  return { ...state, name: trimmed || null, fur: safeFur }
}
