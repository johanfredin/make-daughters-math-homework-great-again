// DOM views: start, cat setup, task, breakdown, camp menu, messages (R7, R10, R13, R18).
// Built with createElement/textContent only (security-baseline rule 4). All text comes from text-sv.js.
import { T } from "./text-sv.js"
import { createNumpad } from "./numpad.js"
import { toPlain } from "../engine/decimal.js"
import { typeText } from "../engine/dialog.js"
import { columnRange, columnCells } from "./place-value.js"
import { FUR_COUNT, MAX_NAME } from "../engine/progress.js"

/** Tiny element helper: h("button", { className: "big", onclick }, "text", child…) */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v)
    else if (k === "className") el.className = v
    else if (k === "dataset") Object.assign(el.dataset, v)
    else if (k in el && typeof v !== "string") el[k] = v
    else el.setAttribute(k, v === true ? "" : v)
  }
  el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false))
  return el
}

const button = (text, onclick, className = "btn") => h("button", { type: "button", className, onclick }, text)

let activeNumpad = null
function mount(container, ...children) {
  activeNumpad?.destroy()
  activeNumpad = null
  container.replaceChildren(...children.flat(2).filter((c) => c !== null && c !== undefined && c !== false))
  container.hidden = false
  container.scrollTop = 0
}

// ---- Overlay screens (start, setup, confirm, error) ----

export function startScreen(overlay, { hasSave, onPlay, onContinue, onRestart }) {
  const actions = hasSave
    ? [button(T.start.continue, onContinue, "btn btn-primary"), button(T.start.restart, onRestart)]
    : [button(T.start.play, onPlay, "btn btn-primary")]
  mount(overlay, h("div", { className: "card title-card" }, h("h1", {}, T.start.title), h("p", { className: "subtitle" }, T.start.subtitle), h("div", { className: "actions" }, actions)))
  overlay.querySelector(".btn-primary").focus()
}

export function confirmScreen(overlay, { text, onYes, onNo }) {
  mount(overlay, h("div", { className: "card" }, h("p", { className: "lead" }, text), h("div", { className: "actions" }, button(T.start.confirmYes, onYes, "btn btn-danger"), button(T.start.confirmNo, onNo))))
}

export function setupScreen(overlay, { fur, name, onDone }) {
  let chosen = fur
  const swatches = Array.from({ length: FUR_COUNT }, (_, i) =>
    h(
      "button",
      { type: "button", className: `swatch fur-${i}`, "aria-pressed": String(i === chosen), onclick: () => select(i) },
      h("span", { className: "swatch-dot" }),
      h("span", {}, T.start.furNames[i]),
    ),
  )
  const select = (i) => {
    chosen = i
    swatches.forEach((s, j) => s.setAttribute("aria-pressed", String(j === i)))
  }
  const input = h("input", { type: "text", id: "cat-name", maxlength: String(MAX_NAME), autocomplete: "off", placeholder: T.start.namePlaceholder, value: name })
  const form = h(
    "form",
    { className: "card", onsubmit: (e) => (e.preventDefault(), onDone(input.value, chosen)) },
    h("h2", {}, T.start.chooseFur),
    h("div", { className: "swatches" }, swatches),
    h("label", { for: "cat-name" }, T.start.nameLabel),
    input,
    h("div", { className: "actions" }, h("button", { type: "submit", className: "btn btn-primary" }, T.start.go)),
  )
  mount(overlay, form)
}

export function errorScreen(overlay, text) {
  mount(overlay, h("div", { className: "card" }, h("p", { className: "lead" }, text)))
}

// ---- Panel views ----

function header(title, onBack, backText) {
  return h("div", { className: "panel-head" }, h("h2", {}, title), button(backText, onBack, "btn btn-small"))
}

function pips(done, total) {
  return h("div", { className: "pips", "aria-hidden": "true" }, Array.from({ length: total }, (_, i) => h("span", { className: i < done ? "pip on" : "pip" })))
}

function answerArea(onSubmit) {
  const display = h("output", { className: "answer", "aria-live": "polite", "aria-label": T.level.answerLabel })
  const pad = h("div")
  activeNumpad = createNumpad(pad, display, onSubmit)
  return [display, pad]
}

/**
 * Math text with stacked fractions: "3/5 + 4/5", "2 3/7 − 1 5/7". Fractions are written without spaces
 * around "/" in the sheet files; division has spaces ("45,3 / 10") and stays inline.
 */
export function mathText(text) {
  const out = []
  const re = /(\d+)\/(\d+)/g
  let last = 0
  for (let m; (m = re.exec(text)); ) {
    let before = text.slice(last, m.index)
    const mixed = /\d $/.test(before) // "2 2/3": the whole number sits right next to the fraction
    if (mixed) before = before.slice(0, -1)
    if (before) out.push(before)
    out.push(h("span", { className: mixed ? "frac frac-mixed" : "frac" }, h("span", { className: "frac-top" }, m[1]), h("span", { className: "frac-bottom" }, m[2])))
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** A number line from `from` to `to` (decimal strings) in steps of 0,01, with one arrow. SVG, no inline styles. */
function numberLine(task) {
  const NS = "http://www.w3.org/2000/svg"
  const svg = (tag, attrs, text) => {
    const el = document.createElementNS(NS, tag)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
    if (text !== undefined) el.textContent = text
    return el
  }
  const toHundredths = (s) => Math.round(Number(s.replace(",", ".")) * 100)
  const lo = toHundredths(task.from)
  const hi = toHundredths(task.to)
  const W = 560
  const x = (v) => 20 + ((v - lo) / (hi - lo)) * (W - 40)
  const root = svg("svg", { viewBox: `0 0 ${W} 110`, class: "numberline", role: "img", "aria-label": T.kinds.numberlineLabel })
  root.append(svg("line", { x1: 10, y1: 70, x2: W - 6, y2: 70, class: "nl-axis" }))
  for (let v = lo; v <= hi; v++) {
    const big = v % 10 === 0
    const mid = v % 5 === 0
    root.append(svg("line", { x1: x(v), y1: big ? 60 : mid ? 63 : 65, x2: x(v), y2: 70, class: "nl-tick" }))
    if (big) root.append(svg("text", { x: x(v), y: 92, class: "nl-label" }, v === 0 ? "0" : (v / 100).toFixed(1).replace(".", ",")))
  }
  const ax = x(toHundredths(task.answer))
  root.append(svg("path", { d: `M ${ax} 56 L ${ax - 6} 44 L ${ax + 6} 44 Z`, class: "nl-arrow" }))
  root.append(svg("line", { x1: ax, y1: 16, x2: ax, y2: 46, class: "nl-arrow-line" }))
  root.append(svg("text", { x: ax, y: 12, class: "nl-letter" }, task.arrow))
  return root
}

/** The question area for a sheet task, by kind (0003 R2). */
function taskQuestion(task) {
  const prompt = task.prompt ? h("p", { className: "task-prompt" }, task.prompt) : null
  if (task.kind === "numberline") return [prompt, numberLine(task), h("p", { className: "question" }, T.kinds.numberline(task.arrow))]
  if (task.kind === "choice") return [prompt, task.text ? h("p", { className: "question" }, mathText(task.text)) : null]
  if (task.kind === "estimate") return [prompt, h("p", { className: "question" }, mathText(T.kinds.estimate(task.text)))]
  if (task.kind === "fraction") {
    const asked = h("span", { className: "frac" }, h("span", { className: "frac-top" }, "?"), h("span", { className: "frac-bottom" }, String(task.den)))
    return [prompt, h("p", { className: "question" }, mathText(task.text), " = ", asked)]
  }
  // "= ?" only after a calculation; words, place values and rounding show the plain number (the prompt asks)
  const isCalculation = / [+\u2212·/] /.test(task.text)
  return [prompt, h("p", { className: "question" }, mathText(isCalculation ? T.level.question(task.text) : task.text))]
}

/**
 * view: { title, label, done, total, task, feedback, offerBreakdown, backText,
 *         onSubmit(text), onChoose(index), onSkip, onBreakdown, onBack }
 */
export function taskPanel(panel, v) {
  const task = v.task
  mount(
    panel,
    header(v.title, v.onBack, v.backText),
    h("div", { className: "progress" }, h("span", {}, v.label), pips(v.done, v.total)),
    taskQuestion(task),
    h("p", { className: "feedback", role: "status" }, v.feedback || " "),
    v.offerBreakdown ? button(T.level.breakdownButton, v.onBreakdown, "btn btn-help") : null,
  )
  if (task.kind === "choice") {
    panel.append(h("div", { className: "options" }, task.options.map((o, i) => button(mathText(o), () => v.onChoose(i), "btn btn-option"))))
  } else {
    if (task.kind === "fraction") panel.append(h("p", { className: "task-prompt" }, T.kinds.fraction))
    const [display, pad] = answerArea(v.onSubmit)
    panel.append(display, pad)
  }
  if (v.onSkip) panel.append(h("div", { className: "actions" }, button(T.sections.skip, v.onSkip, "btn btn-small btn-skip")))
}

/** view: { title, intro, sections: [{ label, progress, done }], keyText, onPick(i), onBack } */
export function sectionsPanel(panel, v) {
  mount(
    panel,
    header(v.title, v.onBack, T.level.backToMap),
    v.intro ? h("div", { className: "dialog" }, h("p", { className: "dialog-text" }, mathText(v.intro))) : null,
    h("p", { className: "key-progress" }, v.keyText),
    h("h3", { className: "sections-title" }, T.sections.title),
    h(
      "div",
      { className: "actions stack" },
      v.sections.map((s, i) => button([h("span", {}, s.label), h("span", { className: "section-progress" }, s.progress)], () => v.onPick(i), s.done ? "btn btn-section done" : "btn btn-section")),
    ),
  )
}

/** Place-value boxes for the given numbers (never the step's answer). */
function placeValue(numbers) {
  const parts = numbers.map((n) => {
    const [whole, frac = ""] = toPlain(n).replace("-", "").split(".")
    return { whole, frac }
  })
  const hi = Math.max(0, ...parts.map((p) => p.whole.length - 1))
  const lo = -Math.max(0, ...parts.map((p) => p.frac.length))
  const cols = []
  for (let pos = hi; pos >= lo; pos--) cols.push(pos)
  const digitAt = ({ whole, frac }, pos) => (pos >= 0 ? whole[whole.length - 1 - pos] : frac[-pos - 1]) ?? ""
  const headRow = h("tr", {}, cols.flatMap((pos) => [h("th", { scope: "col" }, T.breakdown.placeNames[pos] ?? ""), pos === 0 && lo < 0 ? h("th", { className: "comma" }) : null]))
  const rows = parts.map((p) =>
    h("tr", {}, cols.flatMap((pos) => [h("td", {}, digitAt(p, pos)), pos === 0 && lo < 0 ? h("td", { className: "comma" }, ",") : null])),
  )
  return h("table", { className: "place-value" }, h("thead", {}, headRow), h("tbody", {}, rows))
}

/** "10 tiondelar = 1 hel": 10 boxes in a row (0002 R8, tenths only). */
function unitBar(unitKey) {
  return h(
    "figure",
    { className: "unit-bar" },
    h("div", { className: "unit-cells", "aria-hidden": "true" }, Array.from({ length: 10 }, () => h("span"))),
    h("figcaption", {}, T.breakdown.bar[unitKey]),
  )
}

/**
 * Column picture for hundredths (0002 amendment): one row of place-value boxes per option, holding the
 * count's digits (e.g. "24") so they end in the option's column. The hundredths box is highlighted.
 * columns: { digits, ends: [pos per option] } with pos -2 = hundradelar, -1 = tiondelar, 0 = ental.
 */
/**
 * Column picture: one row of place-value boxes per option, holding the same digits so they end in
 * the option's column. columns: { digits, ends, target?, minPos?, from?: { end, label } } — `target`
 * is highlighted; `from` is a dashed starting row (· or / by 10, 100, 1 000).
 */
function columnRow(c, endPos, maxEnd) {
  const cols = columnRange(c.digits, maxEnd, c.minPos ?? -2)
  const values = columnCells(c.digits, endPos, maxEnd, c.minPos ?? -2) // tested in tests/ui/place-value.test.js
  return cols.flatMap((pos, i) => [
    h("span", { className: pos === c.target ? "pv-cell pv-target" : "pv-cell" }, values[i]),
    pos === 0 ? h("span", { className: "pv-comma" }, ",") : null,
  ])
}

function columnOption(c, endPos, maxEnd, label, onclick) {
  return h("button", { type: "button", className: "btn btn-option btn-columns", onclick }, h("span", { className: "pv-row", "aria-hidden": "true" }, columnRow(c, endPos, maxEnd)), h("span", { className: "pv-label" }, label))
}

function columnFrom(c, maxEnd) {
  return h("div", { className: "btn-columns pv-from" }, h("span", { className: "pv-row", "aria-hidden": "true" }, columnRow(c, c.from.end, maxEnd)), h("span", { className: "pv-label" }, c.from.label))
}

function columnHeader(c, maxEnd) {
  const cols = columnRange(c.digits, maxEnd, c.minPos ?? -2)
  return h(
    "div",
    { className: "pv-row pv-head", "aria-hidden": "true" },
    cols.flatMap((pos) => [h("span", { className: pos === c.target ? "pv-cell pv-target" : "pv-cell" }, T.breakdown.placeNames[pos]), pos === 0 ? h("span", { className: "pv-comma" }) : null]),
  )
}

/**
 * view: { title, expr, stepText, step, feedback, backText, onSubmit(input), onChoose(index), onBack }
 * step: a breakdown step (prompt, help, visual, kind, options)
 */
export function breakdownPanel(panel, v) {
  const { step } = v
  mount(
    panel,
    header(v.title, v.onBack, v.backText),
    h("p", { className: "expr" }, v.expr),
    h("p", { className: "step-of" }, v.stepText),
    h("p", { className: "feedback", role: "status" }, v.feedback || " "),
    h("div", { className: "dialog" }, h("p", { className: "dialog-text" }, step.help)),
    step.visual.length ? placeValue(step.visual) : null,
    step.bar ? unitBar(step.bar) : null,
    h("p", { className: "question" }, step.prompt),
  )
  if (step.kind === "choose" && step.columns) {
    const c = step.columns
    const maxEnd = Math.max(...c.ends, c.from?.end ?? -2)
    panel.append(
      h("div", { className: "options" }, columnHeader(c, maxEnd), c.from ? columnFrom(c, maxEnd) : null, step.options.map((o, i) => columnOption(c, c.ends[i], maxEnd, o, () => v.onChoose(i)))),
    )
  } else if (step.kind === "choose") {
    panel.append(h("div", { className: "options" }, step.options.map((o, i) => button(o, () => v.onChoose(i), "btn btn-option"))))
  } else {
    const [display, pad] = answerArea(v.onSubmit)
    panel.append(display, pad)
  }
}

/** view: { name, mentor, greeting, onShowMe, onAnother, onPractice, onBack } */
export function campPanel(panel, v) {
  const text = h("p", { className: "dialog-text" })
  mount(
    panel,
    header(v.name, v.onBack, T.camp.backToMap),
    h("div", { className: "dialog" }, h("p", { className: "speaker" }, v.mentor), text),
    h("div", { className: "actions stack" }, button(T.camp.showMe, v.onShowMe, "btn btn-primary"), button(T.camp.another, v.onAnother), button(T.camp.practice, v.onPractice)),
  )
  typeText(text, v.greeting)
}

/** view: { title, text, buttonText, onButton } */
export function messagePanel(panel, v) {
  mount(panel, h("div", { className: "message" }, h("h2", {}, v.title), h("p", { className: "lead" }, v.text), button(v.buttonText, v.onButton, "btn btn-primary")))
  panel.querySelector(".btn-primary").focus()
}

export function hide(el) {
  activeNumpad?.destroy()
  activeNumpad = null
  el.hidden = true
  el.replaceChildren()
}
