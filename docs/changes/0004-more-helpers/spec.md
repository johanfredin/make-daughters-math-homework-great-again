---
id: 0004-more-helpers
stage: spec
status: approved
intent: docs/changes/0004-more-helpers/intent.md
approved_by: Johan Fredin (delegated in chat 2026-10-08: "you are allowed to approve all changes"; recorded by Claude)
approved_at: 2026-10-08T20:35:44+02:00
---

# Spec: more helpers ("Dela upp det" for + − · / with decimals and whole numbers)

## Summary
Today 46 sheet tasks offer "Dela upp det" (only decimal · whole). **51 more calculation tasks** on the
sheets have none:
- `+`/`−` with decimals
- `·`/`/` by 10, 100 or 1 000
- decimal · decimal
- decimal / whole
- whole-number calculations
- negative numbers
- chains like `0,7 + 0,7 + 0,7`

This change gives every one of them a breakdown. Each one builds on the idea she already knows: count
in tiondelar/hundradelar, then pick the right number. No step tells her to "move the comma n steps".

## Requirements
- **R1 Coverage.** Every `number` task whose text is a calculation with decimals and/or whole numbers
  (`+ − · /`, two or more numbers, negatives included) offers "Dela upp det".
  - Out of scope: fraction tasks and the three fraction-and-decimal mixes on Repetition 1
    (`1/2 + 0,57`, `3,4 − 3/4`, `7/10 + 4/5`), plus rounding, word, place-value and choice tasks.
- **R2 Strategies** (each ends in a number or a choice step; the existing breakdown UI is reused):

| Kind | Example | Steps |
|---|---|---|
| decimal ± decimal/whole | `7,65 + 0,2` | 1. "Hur många hundradelar är 7,65?" → 765. 2. "… är 0,2?" → 20. 3. "765 + 20 = ? hundradelar" → 785. 4. choose 7,85 (column picture). Unit = the smallest needed (tiondelar or hundradelar). |
| whole ± whole | `137 + 9`, `102 − 3`, `122 + 90` | Over a ten: 1. "137 + 3 = ?" → 140 (to the next ten). 2. "140 + 6 = ?" → 146. Otherwise split off the ones: 1. "120 + 90 = ?" → 210. 2. "210 + 2 = ?" → 212. |
| with negatives | `−7 − 2`, `4 − 9` | 1. choose the direction on the number line: *höger* (right) / *vänster* (left). 2. "Börja på −7 och gå 2 steg åt vänster. Var hamnar du?" ("Start at −7 and go 2 steps left. Where do you end up?") → −9 |
| chains (3+ numbers) | `0,7 + 0,7 + 0,7`, `3 − 8 − 2` | One step per part, left to right ("0,7 + 0,7 = ?" → 1,4; "1,4 + 0,7 = ?" → 2,1). The help depends on the operator and the sign. |
| · or / by 10/100/1 000 | `100 · 0,76`, `45,3 / 10` | 1. choose "Blir svaret större eller mindre än 0,76?" ("Is the answer bigger or smaller than 0,76?") 2. choose the number in a column picture, with a dashed "from" row showing where the digits start. |
| decimal · decimal | `0,7 · 0,5`, `0,7 · 0,02` | 1. "7 · 5 = ?" → 35. 2. choose "tiondelar gånger tiondelar blir …" ("tenths times tenths make …") → hundradelar (or tusendelar for tiondelar · hundradelar). 3. choose the number (column picture). |
| decimal / whole | `1,2 / 6`, `0,15 / 3` | 1. "Hur många tiondelar är 1,2?" → 12. 2. "12 tiondelar / 6 = ? tiondelar" → 2. 3. choose 0,2. |
| whole · whole | `6 · 90`, `40 · 200` | 1. "6 · 9 = ?" → 54. 2. choose the number with the zeros put back (`54 / 540 / 5 400`). Help: "90 har en nolla. Sätt dit lika många nollor efter 54." ("90 has one zero. Put the same number of zeros after 54.") |
| whole / whole | `6 000 / 200`, `2 400 / 6` | Equal zeros: 1. choose "Stryk lika många nollor i båda" ("Cross out the same number of zeros in both") → `60 / 2`. 2. "60 / 2 = ?" → 30. Otherwise in hundratal (hundreds): 1. "Hur många hundratal är 2 400?" → 24. 2. "24 hundratal / 6 = ? hundratal" → 4. 3. choose 400. |
| whole / decimal | `20 / 0,5` | 1. choose "Gör talet du delar med till ett heltal" ("Make the number you divide by a whole number") → `200 / 5`. Help: multiply both by 10, the answer stays the same. 2. "200 / 5 = ?" → 40. |

- **R3 Same rules as 0002:**
  - every step's answer is checked exactly
  - no help line contains its step's answer
  - choice options are distinct, contain the answer once, and come in size order
  - the last step equals the task's answer
- **R4 Thousandths.** Column pictures and options go down to tusendelar (thousandths) where the sheet
  does: `0,7 · 0,02 = 0,014`, `45,7 / 100 = 0,457`, `19 / 1 000 = 0,019`.
- **R5 Existing breakdowns are unchanged:** decimal · whole for one-non-zero-digit decimals and halves.

## Acceptance criteria
- **AC1 (R1)** A test lists every in-scope calculation task on the 7 sheets. Each one has a breakdown
  (46 + 51 − 3 fraction mixes = 94 tasks).
- **AC2 (R2)** The named examples above give exactly the step answers listed.
- **AC3 (R3, R4)** A property test runs over all 94 breakdowns and checks:
  - the last step equals the answer
  - no help line reveals its step's answer
  - options are valid and in size order
  - column pictures have one row per option
- **AC4** Browser (iPad landscape with touch, plus desktop): play at least one breakdown of each kind.
- **AC5** `verify.sh` passes and no existing test is weakened.

## Design
- **New `site/js/tasks/strategies.js`:**
  - Parses a sheet expression into numbers and operators, using `decimal.js` for exact maths.
  - Chooses a strategy and returns `{ strategy, expr, answer, steps, summary }`. That is the same shape
    as today, so `level.js` and `screens.js` need no change apart from the column picture.
- **`fixed.js`:** `canBreakdown` / `breakdown` delegate to `strategies.js`, which uses the existing
  decimal · whole breakdown when it fits.
- **`units.js`** (from `breakdown.js`): `unitsChoice` gains thousandths, with plain options (no
  picture) or a column picture down to −3.
- **`place-value.js`:** `columnRange` / `columnCells` take a lowest column (default −2, down to −3).
- **`text-sv.js`:** new strings for each step, with help lines that never contain the step's answer.

## Policy concerns flagged
1. **Whole-number tricks:** "bridge to the next ten" and "put the zeros back" are standard school
   methods. Counting zeros for *whole* numbers is concrete (appending zeros), unlike moving a decimal
   comma.
2. **Fraction mixes** are left without a breakdown. That could be a follow-up, e.g. "1/2 = 0,5 first".

## Decisions log
- **2026-10-08 Owner (intent):** helpers for + − · / with decimal/decimal, whole/decimal and
  whole/whole; build on "split it up".
- **2026-10-08 Owner (earlier, standing):** "you are allowed to approve all changes". Claude approves
  this change's artifacts under that delegation.
- **2026-10-08 Claude:** strategies chosen per kind as in R2. They reuse the units/column-picture
  ideas from 0002 and the size check for ×/÷ 10/100/1 000.

## Open questions
None blocking.
