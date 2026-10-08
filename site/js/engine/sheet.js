// Homework sheet files (0003): validation of site/worlds/<world>/sheets/<level>.json. Pure, no DOM.
//   { intro?, sections: [[id…]…], tasks: [{ id, kind, label?, prompt?, text?, answer, … }] }
import { parseRational } from "./rational.js"

export const KINDS = new Set(["number", "fraction", "choice", "estimate", "numberline"])

/** The sheet item a task belongs to ("12b" → "12", "4max" → "4"); a/b/c groups stay in one section. */
export const groupOf = (id) => /^\d+/.exec(id)?.[0] ?? id

/** → list of problems; empty means valid. */
export function validateSheet(sheet) {
  const errors = []
  const err = (m) => errors.push(m)
  if (!sheet || !Array.isArray(sheet.tasks) || sheet.tasks.length === 0) return ["sheet has no tasks"]
  if (!Array.isArray(sheet.sections) || sheet.sections.length === 0) return ["sheet has no sections"]
  const ids = new Set()
  for (const t of sheet.tasks) {
    const at = `task ${t?.id}`
    if (typeof t?.id !== "string" || !t.id) err("task without id")
    else if (ids.has(t.id)) err(`${at}: duplicate id`)
    else ids.add(t.id)
    if (!KINDS.has(t?.kind)) err(`${at}: unknown kind "${t?.kind}"`)
    if (t?.kind === "choice") {
      if (!Array.isArray(t.options) || t.options.length < 2) err(`${at}: a choice needs at least 2 options`)
      else if (!Number.isInteger(t.answer) || t.answer < 0 || t.answer >= t.options.length) err(`${at}: answer must be an option index`)
      if (typeof t.prompt !== "string" || !t.prompt) err(`${at}: a choice needs a prompt`)
    } else {
      if (parseRational(String(t?.answer ?? "")) === null) err(`${at}: answer is not a number`)
      if (t?.kind !== "numberline" && (typeof t?.text !== "string" || !t.text)) err(`${at}: text missing`)
    }
    if (t?.kind === "fraction" && !(Number.isInteger(t.den) && t.den > 1)) err(`${at}: a fraction needs den > 1`)
    if (t?.kind === "numberline" && (parseRational(t.from ?? "") === null || parseRational(t.to ?? "") === null || !t.arrow)) err(`${at}: a number line needs from, to and arrow`)
  }
  const seen = new Map()
  sheet.sections.forEach((section, i) => {
    if (!Array.isArray(section) || section.length === 0) return err(`section ${i + 1} is empty`)
    for (const id of section) {
      if (!ids.has(id)) err(`section ${i + 1}: unknown task ${id}`)
      if (seen.has(id)) err(`task ${id} is in two sections`)
      seen.set(id, i)
    }
  })
  for (const id of ids) if (!seen.has(id)) err(`task ${id} is in no section`)
  const groupSection = new Map()
  for (const [id, i] of seen) {
    const g = groupOf(id)
    if (groupSection.has(g) && groupSection.get(g) !== i) err(`group ${g} is split across sections`)
    groupSection.set(g, i)
  }
  const order = sheet.tasks.map((t) => t.id)
  const sectionOrder = sheet.sections.flat()
  if (order.join() !== sectionOrder.join()) err("sections must follow the sheet's task order")
  return errors
}

/** Tasks of section `i`, in order. */
export function sectionTasks(sheet, i) {
  const byId = new Map(sheet.tasks.map((t) => [t.id, t]))
  return sheet.sections[i].map((id) => byId.get(id))
}
