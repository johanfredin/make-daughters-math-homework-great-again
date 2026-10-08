// Task-type registry: world.json task specs name a type; the engine looks it up here.
import * as decimalMultiply from "./decimal-multiply.js"

export const TASK_TYPES = {
  [decimalMultiply.TYPE]: decimalMultiply,
}

export function taskType(name) {
  const t = TASK_TYPES[name]
  if (!t) throw new Error(`unknown task type "${name}"`)
  return t
}
