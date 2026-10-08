// On-screen number pad (R14): answering never opens the phone keyboard. A physical keyboard works too.
import { T } from "./text-sv.js"
import { MINUS } from "./number-format.js"

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", MINUS, "0", ","]
const MAX_LEN = 12

/**
 * Builds the pad inside `container`. onSubmit(text) is called on OK / Enter.
 * Returns { clear(), destroy() }.
 */
export function createNumpad(container, display, onSubmit) {
  let value = ""
  const render = () => {
    display.textContent = value || " "
  }
  const press = (key) => {
    if (key === "erase") value = value.slice(0, -1)
    else if (key === "ok") {
      if (value.trim() !== "") onSubmit(value)
      return
    } else if (value.length < MAX_LEN) value += key
    render()
  }

  container.replaceChildren()
  container.classList.add("numpad")
  for (const key of KEYS) {
    const b = document.createElement("button")
    b.type = "button"
    b.className = "key"
    b.textContent = key
    b.addEventListener("click", () => press(key))
    container.append(b)
  }
  const erase = document.createElement("button")
  erase.type = "button"
  erase.className = "key key-erase"
  erase.textContent = "⌫"
  erase.setAttribute("aria-label", T.numpad.erase)
  erase.addEventListener("click", () => press("erase"))
  const ok = document.createElement("button")
  ok.type = "button"
  ok.className = "key key-ok"
  ok.textContent = T.numpad.ok
  ok.addEventListener("click", () => press("ok"))
  container.append(erase, ok)

  const onKey = (e) => {
    if (e.target.closest?.("input, textarea")) return
    if (/^[0-9]$/.test(e.key)) press(e.key)
    else if (e.key === "," || e.key === ".") press(",")
    else if (e.key === "-" || e.key === MINUS) press(MINUS)
    else if (e.key === "Backspace") press("erase")
    else if (e.key === "Enter") press("ok")
    else return
    e.preventDefault()
  }
  window.addEventListener("keydown", onKey)
  render()

  return {
    clear() {
      value = ""
      render()
    },
    destroy() {
      window.removeEventListener("keydown", onKey)
    },
  }
}
