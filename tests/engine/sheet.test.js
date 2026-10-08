// 0003 AC3: the sheet-file rules, one broken sheet per rule.
import { test } from "node:test"
import assert from "node:assert/strict"
import { validateSheet, groupOf, sectionTasks } from "../../site/js/engine/sheet.js"

const t = (id, extra = {}) => ({ id, kind: "number", text: "1 + 1", answer: "2", ...extra })
const good = () => ({
  sections: [["1a", "1b"], ["2a", "2b", "2c"]],
  tasks: [t("1a"), t("1b"), t("2a"), t("2b"), t("2c")],
})
const fails = (mutate, pattern) => {
  const s = good()
  mutate(s)
  const errors = validateSheet(s)
  assert.ok(errors.some((e) => pattern.test(e)), `expected ${pattern}, got ${JSON.stringify(errors)}`)
}

test("a well-formed sheet is valid", () => {
  assert.deepEqual(validateSheet(good()), [])
})

test("groupOf: a/b/c and max/min tasks belong to their sheet item", () => {
  assert.equal(groupOf("12b"), "12")
  assert.equal(groupOf("4max"), "4")
  assert.equal(groupOf("15"), "15")
})

test("rule: an a/b/c group must not be split across sections", () => {
  fails((s) => (s.sections = [["1a", "1b", "2a"], ["2b", "2c"]]), /group 2 is split/)
})

test("rule: ids are unique", () => {
  fails((s) => (s.tasks[1].id = "1a"), /duplicate id/)
})

test("rule: every task is in exactly one section", () => {
  fails((s) => s.sections[1].pop(), /task 2c is in no section/)
  fails((s) => s.sections[1].push("1a"), /in two sections/)
  fails((s) => s.sections[0].push("9z"), /unknown task 9z/)
})

test("rule: sections follow the sheet's order", () => {
  fails((s) => (s.sections = [["2a", "2b", "2c"], ["1a", "1b"]]), /sheet's task order/)
})

test("rule: kinds and their fields", () => {
  fails((s) => (s.tasks[0].kind = "essay"), /unknown kind/)
  fails((s) => (s.tasks[0].answer = "abc"), /answer is not a number/)
  fails((s) => (s.tasks[0] = { id: "1a", kind: "choice", prompt: "?", options: ["1"], answer: 0 }), /at least 2 options/)
  fails((s) => (s.tasks[0] = { id: "1a", kind: "choice", prompt: "?", options: ["1", "2"], answer: 2 }), /option index/)
  fails((s) => (s.tasks[0] = t("1a", { kind: "fraction", den: 1 })), /den > 1/)
  fails((s) => (s.tasks[0] = { id: "1a", kind: "numberline", answer: "0,3", from: "0" }), /number line needs/)
})

test("sectionTasks returns a section's tasks in order", () => {
  assert.deepEqual(sectionTasks(good(), 1).map((x) => x.id), ["2a", "2b", "2c"])
})
