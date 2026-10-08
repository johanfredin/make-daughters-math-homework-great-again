---
name: kid-math-pedagogy
description: Rules for anything the player sees – Swedish language and math notation, tone, difficulty, hints, helper camps, touch UX – for a 13-year-old who finds math hard and dislikes it. Use when writing specs, task generators, UI text, helper-camp content or reviewing player-facing changes.
user-invocable: false
---

# Kid math pedagogy & Swedish UI

The player is in 7th grade (årskurs 7) in a Swedish school.
- She finds math hard and does not enjoy it.
- Her gaps are in **multiplication and division** (including tables), so decimal tasks feel impossible.
- Goal, in order: she **wants to keep playing**, she **succeeds often**, and she **learns the method**.

## Language
- All player-facing text is in **Swedish**: natural, short and friendly, the way you would talk to a
  13-year-old. Not textbook prose, not childish.
- Use the textbook's own terms so the game and the test match:
  - *decimalform*, *bråkform*, *blandad form*
  - *täljare*, *nämnare*
  - *avrunda till heltal / tiotal / hundradelar*
  - *överslagsräkning*
  - *tiondel*, *hundradel*, *tusendel*
  - *produkt*, *kvot*, *summa*, *differens*
- Avoid English loanwords in the UI (no "level", "boss" or "score" on screen). Use for example:
  - "bana" for a level
  - "slutboss" or "Draken" for the boss
  - "nyckel" for a key
  - "hjälplägret" for a helper camp
  - "poäng" for points

## Swedish math notation (must match her worksheets)
- Decimal comma: `0,75`.
- Multiplication: `·` (middle dot).
- Division: a stacked fraction or `/`; never `÷`.
- Thousands separated by a thin or normal space: `23 460`, `1 000`.
- Negative numbers use a real minus sign `−`, not a hyphen.
- Mixed numbers are shown stacked: 1 ¾ with a real stacked fraction, not "1 3/4".
- Answer input accepts:
  - `,` or `.` as the decimal separator
  - spaces in numbers
  - leading or trailing zeros (`,5` = `0,5` = `0,50`), unless the task is *about* zeros or rounding
- An answer that is right but in a different form (e.g. `7/4` versus `1 3/4`) gets a friendly nudge
  toward the form the task asks for, never "Fel".

## Tone and mechanics
- **Never punishing:**
  - No game over and no losing progress.
  - No timers by default (an optional challenge mode is fine).
  - No red crosses as the main feedback.
- **On a wrong answer:**
  1. A gentle message ("Nästan!", "Prova igen").
  2. Then a hint that targets the likely mistake (e.g. a misplaced decimal comma).
  3. After 2–3 tries, show a worked solution step by step, then give her a *similar* new task to try.
- **On a right answer:** quick, varied praise and visible progress (a coin, a step on the map).
  Celebrate keys and the boss properly.
- **Short sessions:**
  - A level takes about 3–6 minutes and has 5–8 tasks.
  - Progress is saved after every task.
- **Same vintage as the sheet** (owner rule). The numbers differ from the sheet, but the difficulty
  matches it:
  - **Never harder.** Use no more digits, decimals or carrying than the sheet shows.
  - **At most slightly easier.** An easier opener is fine, but it must be a pattern that appears on
    the sheet.
  - Derive each task spec's ranges from concrete examples on the sheet, and cite them in the spec.
    Tests assert the generated numbers stay inside those patterns.
- **Mix in tables:** sneak in quick table facts (e.g. 7 · 8) where a decimal task depends on them, so
  her weak spot gets practice without feeling like drill.

## Helper camps
- Use visuals, not walls of text. Good tools:
  - area models / grids for multiplication
  - sharing into groups for division
  - place-value charts (tiotal / ental / tiondelar / hundradelar) for moving the decimal comma
  - number lines
  - fraction pies or bars, matching the worksheet pictures
- Interactive, step by step: she taps "Nästa steg" to move on, and can replay.
- Each camp ends with 2–3 practice tasks that give *no* penalty and *no* key.
- Must-have camps:
  - multiplikation (incl. tabellerna)
  - division
  - addition & subtraktion med decimaltal
  - any topic-specific camp a world needs

## Generated tasks
- Same *type* and *difficulty* as the source sheet; fresh numbers.
- Answers must be exact and "nice". Do decimal math on scaled integers, never floats.
- Multiple-choice tasks (e.g. "Hur räknar du?") have plausible wrong options built from typical
  mistakes: inverted division, wrong operation, unit not converted.
- Word problems use everyday Swedish contexts: kronor, kg, liter, mil, sport, food.
  Use varied names, and none of the names from her class.

## Touch & layout
- iPad (touch) and desktop first; works in portrait and landscape. Phones are not a target.
- Tap targets ≥ 44 px. Nothing relies on hover.
- Use a custom on-screen number pad (0–9, `,`, `−`, ⌫, OK) so the phone keyboard never covers the task.
- Large, readable numbers. Good contrast. Respect `prefers-reduced-motion`.
