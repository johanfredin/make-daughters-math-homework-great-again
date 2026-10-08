// Sound effects (0003 R10): small 8-bit-style sounds synthesised with the Web Audio API — no audio
// files, no dependencies. iPad Safari only allows audio after a user gesture, so the audio context is
// created on the first tap or key press. If Web Audio is missing, every sound is silently skipped.

export function createSound(initiallyOn) {
  let ctx = null
  let on = initiallyOn

  const unlock = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      ctx = new AC()
    }
    if (ctx.state === "suspended") ctx.resume()
  }
  // Browsers only count the *end* of a touch (and clicks/keys) as a user gesture that may start audio.
  for (const type of ["pointerup", "touchend", "click", "keydown"]) window.addEventListener(type, unlock, { passive: true })

  /** One note: frequency (Hz), start offset and duration (s); optional slide to another frequency. */
  function note(freq, at, dur, { type = "square", vol = 0.06, slideTo = null } = {}) {
    const t = ctx.currentTime + at
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  const ready = () => on && ctx && ctx.state === "running"

  return {
    get on() {
      return on
    },
    setOn(value) {
      on = Boolean(value)
      if (on) unlock()
    },
    /** A right answer: a bright two-note "pling". */
    correct() {
      if (!ready()) return
      note(784, 0, 0.09)
      note(1175, 0.08, 0.16)
    },
    /** The cat pounces and the enemy flees: a rising swoosh. */
    win() {
      if (!ready()) return
      note(220, 0, 0.25, { type: "triangle", vol: 0.08, slideTo: 880 })
    },
    /** A key: a short fanfare. */
    key() {
      if (!ready()) return
      ;[523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.11, 0.18, { vol: 0.07 }))
      note(1047, 0.48, 0.4, { type: "triangle", vol: 0.07 })
    },
    /** A wrong answer: one soft, low, friendly blip (never a harsh buzzer). */
    wrong() {
      if (!ready()) return
      note(262, 0, 0.12, { type: "sine", vol: 0.05, slideTo: 220 })
    },
  }
}
