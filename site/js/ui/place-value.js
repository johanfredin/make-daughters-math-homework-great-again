// Pure place-value helpers for the hundredths column picture (0002 amendment). No DOM.
// Positions: 1 = tiotal, 0 = ental, -1 = tiondelar, -2 = hundradelar.

/** Columns from the leftmost one the digits can reach down to hundredths, e.g. "24" → [1, 0, -1, -2]. */
export function columnRange(digits) {
  const cols = []
  for (let pos = digits.length - 1; pos >= -2; pos--) cols.push(pos)
  return cols
}

/**
 * The text in each box when `digits` (e.g. "8") is written so its last digit lands in column `endPos`.
 * Empty boxes between the ones column and the first digit get a placeholder 0, so 8 hundredths reads
 * 0,08 (not 0,_8). Boxes left of the ones column or right of the last digit stay empty.
 * → array aligned with columnRange(digits).
 */
export function columnCells(digits, endPos) {
  const first = endPos + digits.length - 1 // column of the first digit
  return columnRange(digits).map((pos) => {
    if (pos <= first && pos >= endPos) return digits[first - pos]
    if (pos > first && pos <= 0) return "0"
    return ""
  })
}
