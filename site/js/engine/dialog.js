// Typewriter text for 16-bit-style dialog boxes (R13). A tap shows the whole line at once;
// with prefers-reduced-motion the text appears immediately (R17). DOM module.

const MS_PER_CHAR = 28

export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Type `text` into `el`. Returns a promise that resolves when the whole line is shown. */
export function typeText(el, text) {
  el.textContent = text
  if (reducedMotion() || text.length === 0) return Promise.resolve()
  return new Promise((resolve) => {
    let shown = 0
    let timer = null
    const finish = () => {
      clearInterval(timer)
      el.textContent = text
      el.removeEventListener("pointerdown", finish)
      resolve()
    }
    el.textContent = ""
    el.addEventListener("pointerdown", finish)
    timer = setInterval(() => {
      shown++
      el.textContent = text.slice(0, shown)
      if (shown >= text.length) finish()
    }, MS_PER_CHAR)
  })
}
