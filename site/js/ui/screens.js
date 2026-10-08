// DOM views: start, cat setup, task, breakdown, camp menu, messages (R7, R10, R13, R18).
// Built with createElement/textContent only (security-baseline rule 4). All text comes from text-sv.js.
import { T } from "./text-sv.js"
import { createNumpad } from "./numpad.js"
import { toPlain } from "../engine/decimal.js"
import { typeText } from "../engine/dialog.js"
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
  container.replaceChildren(...children.filter((c) => c !== null && c !== undefined && c !== false))
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

/** view: { title, done, total, progressText, question, feedback, offerBreakdown, backText, onSubmit, onBreakdown, onBack } */
export function taskPanel(panel, v) {
  mount(
    panel,
    header(v.title, v.onBack, v.backText),
    h("div", { className: "progress" }, h("span", {}, v.progressText), pips(v.done, v.total)),
    h("p", { className: "question" }, v.question),
    h("p", { className: "feedback", role: "status" }, v.feedback || " "),
    v.offerBreakdown ? button(T.level.breakdownButton, v.onBreakdown, "btn btn-help") : null,
  )
  const [display, pad] = answerArea(v.onSubmit)
  panel.append(display, pad)
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

/** "10 tiondelar = 1 hel": 10 boxes in a row, or 10×10 small boxes for hundredths (0002 R8). */
function unitBar(unitKey) {
  const cells = unitKey === "tenths" ? 10 : 100
  return h(
    "figure",
    { className: `unit-bar unit-bar-${unitKey}` },
    h("div", { className: "unit-cells", "aria-hidden": "true" }, Array.from({ length: cells }, () => h("span"))),
    h("figcaption", {}, T.breakdown.bar[unitKey]),
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
  if (step.kind === "choose") {
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
