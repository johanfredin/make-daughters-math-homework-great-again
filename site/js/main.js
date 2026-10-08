// Boot and game controller: loads the world and progress, owns the mode (start / map / level / camp)
// and wires the pure engine modules to the scene and the DOM views.
import { validateWorld, nodeById, tryMove } from "./engine/world.js"
import * as P from "./engine/progress.js"
import * as L from "./engine/level.js"
import * as W from "./engine/walk-queue.js"
import { mulberry32, randomSeed } from "./engine/rng.js"
import { createScene } from "./engine/scene.js"
import { createInput } from "./engine/input.js"
import { reducedMotion } from "./engine/dialog.js"
import { FUR } from "./engine/sprites.js"
import { T, oneOf } from "./ui/text-sv.js"
import { formatNumber } from "./ui/number-format.js"
import * as V from "./ui/screens.js"

const $ = (id) => document.getElementById(id)
const el = {
  game: $("game"),
  stage: $("stage"),
  canvas: $("scene"),
  hud: $("hud"),
  hudName: $("hud-name"),
  hudNode: $("hud-node"),
  hudKeys: $("hud-keys"),
  toast: $("toast"),
  stick: $("stick"),
  knob: $("knob"),
  enter: $("enter-btn"),
  panel: $("panel"),
  overlay: $("overlay"),
}

const WALK_SPEED = 70 // map pixels per second
const POUNCE_MS = 650

/** localStorage, or a stand-in that always throws (private mode); progress.js copes with both. */
function safeStorage() {
  try {
    const s = window.localStorage
    s.getItem("probe")
    return s
  } catch {
    const fail = () => {
      throw new Error("storage unavailable")
    }
    return { getItem: fail, setItem: fail, removeItem: fail }
  }
}

const app = {
  mode: "start",
  world: null,
  state: null,
  storage: safeStorage(),
  rng: mulberry32(randomSeed()),
  cat: { x: 0, y: 0, dir: "down", frame: 0, bump: 0 },
  walk: null,
  walkQ: W.idle(), // one push = one stone; a push during a walk is remembered (0002 R12)
  bumpUntil: 0,
  level: null,
  levelNode: null,
  campNode: null,
  anim: null,
  resetNotice: false,
  helpShown: false,
}

// ---------- Helpers ----------

const save = () => P.save(app.storage, app.state)
const fur = () => FUR[app.state?.fur ?? 0]
const currentNode = () => nodeById(app.world, app.state.nodeId)

let toastTimer = null
function toast(text, ms = 2600) {
  el.toast.textContent = text
  el.toast.hidden = false
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (el.toast.hidden = true), ms)
}

function setMode(mode) {
  app.mode = mode
  app.walkQ = W.idle()
  el.toast.hidden = true
  el.game.dataset.mode = mode
  const withPanel = mode === "level" || mode === "camp"
  el.game.classList.toggle("with-panel", withPanel)
  el.hud.hidden = mode !== "map"
  el.enter.hidden = mode !== "map" || !input.isTouchDevice
  if (!withPanel) V.hide(el.panel)
  if (mode !== "start") V.hide(el.overlay)
  input.reset()
  requestAnimationFrame(fitScene)
}

function updateHud() {
  const node = currentNode()
  el.hudName.textContent = app.state.name ?? T.start.defaultName
  el.hudNode.textContent = node.kind === "start" ? app.world.name : node.name
  el.hudKeys.textContent = T.map.keys(P.keys(app.state), app.world.keysToBoss)
}

function placeCatOn(node) {
  app.cat.x = node.x
  app.cat.y = node.y
}

// ---------- Map ----------

function onDirection(angle) {
  if (app.mode !== "map") return
  const pushed = W.push(app.walkQ, angle)
  app.walkQ = pushed.q
  if (pushed.go === null) return // walking: done on arrival
  const r = tryMove(app.world, app.state.nodeId, pushed.go)
  if (r.move) {
    app.walkQ = W.started(app.walkQ)
    startWalk(r.move)
  } else app.bumpUntil = performance.now() + 250
}

function startWalk(toId) {
  const from = currentNode()
  const to = nodeById(app.world, toId)
  const dx = to.x - from.x
  const dy = to.y - from.y
  app.cat.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up"
  app.walk = { from, to, dist: Math.hypot(dx, dy), traveled: 0 }
  if (reducedMotion()) arrive()
}

function arrive() {
  const { to } = app.walk
  app.walk = null
  placeCatOn(to)
  app.cat.frame = 0
  app.state = P.moveTo(app.state, to.id)
  save()
  updateHud()
  // The cat stops on every stone: one push = one stone (0002 R12). Since nothing blocks the path any
  // more, walking on while the stick or key is held would carry her past the level she wanted.
  const next = W.arrived(app.walkQ)
  app.walkQ = next.q
  if (next.go !== null) onDirection(next.go)
}

function onEnter() {
  if (app.mode !== "map" || app.walk) return
  const node = currentNode()
  const reason = P.enterReason(app.world, app.state)(node)
  if (reason === "comingSoon") toast(T.map.comingSoon)
  else if (reason === "bossLocked") toast(T.map.bossLocked(P.keys(app.state), app.world.keysToBoss))
  else if (node.kind === "level") enterLevel(node)
  else if (node.kind === "camp") enterCamp(node)
}

function toMap() {
  app.level = null
  app.anim = null
  setMode("map")
  placeCatOn(currentNode())
  updateHud()
  if (app.resetNotice) {
    toast(T.map.progressReset, 4000)
    app.resetNotice = false
  } else if (!app.helpShown) {
    toast(input.isTouchDevice ? T.map.helpTouch : T.map.helpKeys, 4000)
    app.helpShown = true
  }
}

// ---------- Level (and camp practice) ----------

function enterLevel(node) {
  app.levelNode = node
  app.level = L.startLevel(node.tasks, app.rng, { startIndex: app.state.levelTask[node.id] ?? 0 })
  if (app.level.done) app.level = L.startLevel(node.tasks, app.rng)
  setMode("level")
  app.anim = { foeX: 230, foeVisible: true, start: 0, kind: "idle" }
  showTask("")
}

function leaveLevel() {
  if (app.level?.practice) showCampMenu()
  else toMap()
}

function showTask(feedback) {
  const lv = app.level
  V.taskPanel(el.panel, {
    title: lv.practice ? app.campNode.name : app.levelNode.name,
    done: lv.index,
    total: lv.total,
    progressText: T.level.taskOf(lv.index + 1, lv.total),
    question: T.level.question(lv.task.text),
    feedback,
    offerBreakdown: lv.breakdownOffered,
    backText: lv.practice ? T.camp.backToCamp : T.level.backToMap,
    onSubmit: submitAnswer,
    onBreakdown: openLevelBreakdown,
    onBack: leaveLevel,
  })
}

const HINTS = { comma: () => T.level.hintComma, plus: () => T.level.hintPlus, generic: () => oneOf(T.level.hintGeneric) }

function submitAnswer(text) {
  const r = L.answerTask(app.level, text)
  app.level = r.lv
  if (r.result.status === "invalid") return showTask(T.level.invalid)
  if (r.result.status === "wrong") {
    const hint = HINTS[r.result.hint]()
    return showTask(hint) // the "Dela upp det" button is always there (0002 R5)
  }
  taskCleared()
}

function taskCleared() {
  pounce()
  if (!app.level.practice) {
    app.state = P.setTaskIndex(app.state, app.levelNode.id, app.level.index)
    save()
  }
  if (app.level.done) finishLevel()
  else showTask(oneOf(T.level.praise))
}

function finishLevel() {
  if (app.level.practice) {
    return V.messagePanel(el.panel, { title: oneOf(T.level.praise), text: T.camp.practiceDone, buttonText: T.camp.backToCamp, onButton: showCampMenu })
  }
  const r = L.reward(app.world, app.state, app.level, app.levelNode.id)
  app.state = r.state
  save()
  if (r.keyAwarded) app.anim = { kind: "key", start: performance.now() }
  V.messagePanel(el.panel, {
    title: T.level.levelDone,
    text: r.keyAwarded ? T.level.keyEarned : T.level.alreadyHaveKey,
    buttonText: T.level.backToMap,
    onButton: toMap,
  })
}

function openLevelBreakdown() {
  app.level = L.openBreakdown(app.level)
  const data = app.level.breakdown.data
  runBreakdown({
    data,
    current: () => app.level.breakdown,
    answer: (input) => {
      const r = L.answerStep(app.level, input)
      app.level = r.lv
      return r.result
    },
    onFinished: () => taskCleared(),
    onBack: leaveLevel,
    backText: app.level.practice ? T.camp.backToCamp : T.level.backToMap,
  })
}

// ---------- Breakdown view (level and camp) ----------

/**
 * data: breakdown; current(): the run (step index) while unfinished; answer(input) → result.
 */
function runBreakdown({ data, current, answer, onFinished, onBack, backText, intro = "" }) {
  const show = (feedback) => {
    const run = current()
    const step = data.steps[run.step]
    V.breakdownPanel(el.panel, {
      title: T.breakdown.title,
      expr: `${data.expr} = ?`,
      stepText: T.breakdown.stepOf(run.step + 1, data.steps.length),
      step,
      feedback,
      backText,
      onSubmit: handle,
      onChoose: handle,
      onBack,
    })
  }
  const handle = (input) => {
    const result = answer(input)
    const revealed = result.status === "revealed" ? stepAnswerText(result.revealedStep) : null
    if (result.finished) {
      return V.messagePanel(el.panel, {
        title: T.breakdown.doneTitle,
        text: revealed ? `${T.breakdown.revealLast(revealed)} ${data.summary}` : data.summary,
        buttonText: T.breakdown.finish,
        onButton: onFinished,
      })
    }
    if (result.status === "invalid") return show(T.level.invalid)
    if (result.status === "wrong") return show(T.breakdown.stepWrong)
    show(revealed ? T.breakdown.reveal(revealed) : oneOf(T.level.praise))
  }
  show(intro)
}

const stepAnswerText = (step) => (step.kind === "choose" ? step.options[step.answerIndex] : formatNumber(step.answer))

// ---------- Camp ----------

function enterCamp(node) {
  app.campNode = node
  setMode("camp")
  app.anim = null
  showCampMenu()
}

function showCampMenu() {
  if (app.mode !== "camp") setMode("camp")
  const node = app.campNode
  const practiceLevel = nodeById(app.world, node.practiceFrom)
  const standalone = (data, intro) => {
    let run = L.startBreakdown(data)
    runBreakdown({
      data,
      intro,
      current: () => run,
      answer: (input) => {
        const r = L.answerBreakdown(run, input)
        run = r.run
        return r.result
      },
      onFinished: showCampMenu,
      onBack: showCampMenu,
      backText: T.camp.backToCamp,
    })
  }
  V.campPanel(el.panel, {
    name: node.name,
    mentor: node.mentor,
    greeting: T.camp.greetings[node.camp] ?? T.camp.greetingDefault,
    onBack: toMap,
    onShowMe: () => {
      const { breakdown } = L.campDemo(node)
      standalone(breakdown, T.camp.showMeIntro(breakdown.expr))
    },
    onAnother: () => {
      const ex = L.campExample(practiceLevel, app.rng)
      standalone(ex.breakdown, T.camp.anotherIntro(ex.task.text))
    },
    onPractice: () => {
      app.level = L.campPractice(practiceLevel, app.rng)
      showTask(T.camp.practiceIntro)
    },
  })
}

// ---------- Animation ----------

function pounce() {
  if (reducedMotion() || app.mode !== "level") return
  app.anim = { kind: "pounce", start: performance.now() }
}

function levelView(now) {
  const foeKind = app.levelNode?.foe ?? "rat"
  const base = { fur: fur(), catX: 40, catY: 83, catFrame: Math.floor(now / 500) % 2, foe: { kind: foeKind, x: 230, y: 83, visible: true, flip: false }, key: null, time: now }
  const a = app.anim
  if (a?.kind === "key") {
    // celebration (R8): the key floats above the cat; no foe left
    const bob = reducedMotion() ? 0 : Math.round(Math.sin((now - a.start) / 250) * 4)
    return { ...base, foe: { ...base.foe, visible: false }, key: { x: 40, y: 40 + bob, sparkle: !reducedMotion() } }
  }
  if (!a || a.kind !== "pounce") return base
  const t = (now - a.start) / POUNCE_MS
  if (t >= 1.6) {
    app.anim = null
    return base
  }
  if (t < 0.5) {
    // leap toward the foe in an arc
    const p = t * 2
    base.catX = 40 + 140 * p
    base.catY = 83 - 30 * Math.sin(Math.PI * p)
  } else if (t < 1) {
    // trot back
    base.catX = 180 - 140 * ((t - 0.5) * 2)
  }
  if (t >= 0.4 && t < 1) {
    // the foe turns and runs off to the right
    base.foe.x = 230 + (t - 0.4) * 400
    base.foe.flip = true
  } else if (t >= 1) {
    // the next foe walks in
    base.foe.x = 330 - ((t - 1) / 0.6) * 100
  }
  return base
}

let last = performance.now()
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (app.walk) {
    const w = app.walk
    w.traveled = Math.min(w.dist, w.traveled + WALK_SPEED * dt)
    const t = w.dist === 0 ? 1 : w.traveled / w.dist
    app.cat.x = w.from.x + (w.to.x - w.from.x) * t
    app.cat.y = w.from.y + (w.to.y - w.from.y) * t
    app.cat.frame = Math.floor(w.traveled / 6) % 2
    if (t >= 1) arrive()
  }
  app.cat.bump = now < app.bumpUntil ? Math.round(Math.sin(now / 25) * 2) : 0
  if (app.world) {
    if (app.mode === "level") scene.drawLevel(levelView(now))
    else if (app.mode === "camp") scene.drawCamp({ fur: fur(), catFrame: Math.floor(now / 600) % 2, time: now })
    else
      scene.drawMap({
        world: app.world,
        isLocked: (n) => P.isLocked(app.world, app.state, n),
        isComingSoon: P.isComingSoon,
        isCleared: (n) => app.state.cleared.includes(n.id),
        cat: app.cat,
        bossLabel: `${P.keys(app.state)}/${app.world.keysToBoss}`,
        fur: fur(),
        time: now,
        reducedMotion: reducedMotion(),
      })
  }
  requestAnimationFrame(frame)
}

function fitScene() {
  scene.fit(el.stage.clientWidth, el.stage.clientHeight)
}

// ---------- Start ----------

function showStart() {
  setMode("start")
  V.startScreen(el.overlay, {
    hasSave: P.hasSave(app.storage),
    onPlay: showSetup,
    onContinue: toMap,
    onRestart: () =>
      V.confirmScreen(el.overlay, {
        text: T.start.confirmRestart,
        onYes: () => {
          app.resetNotice = false
          P.clear(app.storage)
          app.state = P.freshState(app.world)
          placeCatOn(currentNode())
          showSetup()
        },
        onNo: showStart,
      }),
  })
}

function showSetup() {
  V.setupScreen(el.overlay, {
    fur: app.state.fur,
    name: app.state.name ?? "",
    onDone: (name, furIndex) => {
      app.state = P.withCat(app.state, { name, fur: furIndex })
      save()
      toMap()
    },
  })
}

// ---------- Boot ----------

const scene = createScene(el.canvas)
const input = createInput({ root: el.game, stick: el.stick, knob: el.knob, enterButton: el.enter }, { enabled: () => app.mode === "map", onDirection, onEnter })
el.enter.textContent = T.map.enter
el.canvas.setAttribute("aria-label", T.map.mapLabel)
new ResizeObserver(fitScene).observe(el.stage)

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res.json()
}

async function boot() {
  try {
    const indexUrl = new URL("../worlds/index.json", import.meta.url)
    const index = await fetchJson(indexUrl)
    const world = await fetchJson(new URL(index.worlds[0].path, indexUrl))
    const errors = validateWorld(world)
    if (errors.length) throw new Error(`invalid world: ${errors.join("; ")}`)
    app.world = world
  } catch (e) {
    console.error(e)
    setMode("error")
    V.errorScreen(el.overlay, T.map.loadError)
    return
  }
  const { state, reset } = P.load(app.storage, app.world)
  app.state = state
  app.resetNotice = reset
  placeCatOn(currentNode())
  showStart()
  requestAnimationFrame(frame)
}

boot()
