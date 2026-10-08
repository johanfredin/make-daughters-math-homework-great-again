// Breakdown steps, shared by every task type that offers "Dela upp det":
//   { kind: "number", prompt, help, answer: dec, visual: [dec…] }            she types the answer
//   { kind: "choose", prompt, help, options: [string], answerIndex, visual } she picks an option
import { eq } from "../engine/decimal.js"
import { parseAnswer } from "../ui/number-format.js"

/** "correct" | "wrong" | "invalid" (not a number; does not count as a try). */
export function checkStep(step, input) {
  if (step.kind === "choose") return input === step.answerIndex ? "correct" : "wrong"
  const given = parseAnswer(String(input))
  if (given === null) return "invalid"
  return eq(given, step.answer) ? "correct" : "wrong"
}
