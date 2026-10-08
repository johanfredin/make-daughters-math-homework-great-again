// Map controls (R6): arrow keys / WASD + Enter/Space on desktop; an invisible thumbstick (left half of
// the screen) and a "Gå in" button on touch devices, like Roblox on the iPad. DOM module.

const DEAD_ZONE = 12
const STICK_RADIUS = 40

const KEY_ANGLES = {
  ArrowRight: 0, d: 0, D: 0,
  ArrowDown: Math.PI / 2, s: Math.PI / 2, S: Math.PI / 2,
  ArrowLeft: Math.PI, a: Math.PI, A: Math.PI,
  ArrowUp: -Math.PI / 2, w: -Math.PI / 2, W: -Math.PI / 2,
}

/**
 * root: element covering the game; stick/knob: thumbstick elements; enterButton: the "Gå in" button.
 * handlers: { enabled(): bool, onDirection(angle), onEnter() }.
 * Each press (key, or the stick entering a direction) walks one stone. Returns { isTouchDevice, reset() }.
 */
export function createInput({ root, stick, knob, enterButton }, handlers) {
  let stickAngle = null
  let stickPointer = null
  let origin = null

  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches
  enterButton.hidden = !isTouchDevice

  window.addEventListener("keydown", (e) => {
    if (!handlers.enabled() || e.target.closest?.("input, textarea")) return
    if (e.key in KEY_ANGLES) {
      e.preventDefault()
      if (!e.repeat) handlers.onDirection(KEY_ANGLES[e.key]) // one stone per press
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (!e.repeat) handlers.onEnter()
    }
  })

  const hideStick = () => {
    stickPointer = null
    stickAngle = null
    stick.hidden = true
  }

  root.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch" || !handlers.enabled() || stickPointer !== null) return
    if (e.target.closest("button")) return
    const rect = root.getBoundingClientRect()
    if (e.clientX - rect.left > rect.width / 2) return
    e.preventDefault()
    stickPointer = e.pointerId
    origin = { x: e.clientX, y: e.clientY }
    stick.style.left = `${e.clientX - rect.left}px`
    stick.style.top = `${e.clientY - rect.top}px`
    knob.style.transform = "translate(-50%, -50%)"
    stick.hidden = false
    root.setPointerCapture?.(e.pointerId)
  })
  root.addEventListener("pointermove", (e) => {
    if (e.pointerId !== stickPointer) return
    e.preventDefault()
    const dx = e.clientX - origin.x
    const dy = e.clientY - origin.y
    const dist = Math.hypot(dx, dy)
    const k = dist > STICK_RADIUS ? STICK_RADIUS / dist : 1
    knob.style.transform = `translate(calc(-50% + ${dx * k}px), calc(-50% + ${dy * k}px))`
    const before = stickAngle
    stickAngle = dist > DEAD_ZONE ? Math.atan2(dy, dx) : null
    // Push again when the stick enters a new 8-way sector, so she can steer without lifting her thumb.
    const sector = (a) => (a === null ? null : Math.round(a / (Math.PI / 4)))
    if (stickAngle !== null && sector(stickAngle) !== sector(before)) handlers.onDirection(stickAngle)
  })
  for (const type of ["pointerup", "pointercancel"]) {
    root.addEventListener(type, (e) => e.pointerId === stickPointer && hideStick())
  }

  enterButton.addEventListener("click", () => handlers.enabled() && handlers.onEnter())

  return {
    isTouchDevice,
    reset: hideStick,
  }
}
