// Pure place-value helpers for the column picture (0002 amendment, 0004). No DOM.
// Positions: 3 = tusental, 2 = hundratal, 1 = tiotal, 0 = ental, -1 = tiondelar, -2 = hundradelar, -3 = tusendelar.

/**
 * Columns from the leftmost one the digits reach (rows may end left of ental: maxEnd) down to minPos.
 * e.g. ("24") → [1, 0, -1, -2]; ("76", 1) → [2, 1, 0, -1, -2]; ("14", 0, -3) → [1, 0, -1, -2, -3]
 */
export function columnRange(digits, maxEnd = 0, minPos = -2) {
  const cols = []
  for (let pos = digits.length - 1 + Math.max(0, maxEnd); pos >= minPos; pos--) cols.push(pos)
  return cols
}

/**
 * The text in each box when `digits` (e.g. "8") is written so its last digit lands in column `endPos`.
 * Placeholder zeros: between the ones column and the first digit (8 hundredths reads 0,08, not 0,_8),
 * and between the last digit and the ones column (76 ending in tiotal reads 760). Other boxes stay empty.
 * → array aligned with columnRange(digits, maxEnd, minPos).
 */
export function columnCells(digits, endPos, maxEnd = 0, minPos = -2) {
  const first = endPos + digits.length - 1 // column of the first digit
  return columnRange(digits, maxEnd, minPos).map((pos) => {
    if (pos <= first && pos >= endPos) return digits[first - pos]
    if (pos > first && pos <= 0) return "0"
    if (pos < endPos && pos >= 0) return "0"
    return ""
  })
}
