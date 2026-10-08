---
id: 0003-numbers-from-files
stage: plan
status: approved
spec: docs/changes/0003-numbers-from-files/spec.md
approved_by: Johan Fredin (delegated in chat 2026-10-08: "You are free to review and approve your own changes for this intent."; recorded by Claude)
approved_at: 2026-10-08T17:41:43+02:00
---

# Plan: numbers from files

## Files to change
| File | Change | Req |
|------|--------|-----|
| `site/js/engine/rational.js` (new) | Exact fractions `{num, den}`: parse from a decimal or fraction string, add/sub/mul/div, eq, from `decimal.js` values. | R3 |
| `site/worlds/kap1/sheets/*.json` (7 new) | The tasks transcribed from the 7 photos, in sheet order with sheet labels, plus `sections`. | R1, R2, R5 |
| `site/worlds/kap1/world.json` | Every level `playable` with `sheet` and `theme`; `tasks` specs removed; the camp keeps its demo, and `practiceFrom` points at the multiplication level. | R1, R9 |
| `site/js/engine/sheet.js` (new) | `validateSheet(json)`: schema, ids unique, sections cover every task exactly once, a/b/c groups not split. | R1, R5 |
| `site/js/tasks/fixed.js` (new) | `check(task, input)` per kind (number, fraction, choice, estimate, numberline) with the comma hint. `breakdown(task)` when the text is `decimal · whole`. | R2, R4 |
| `site/js/tasks/decimal-multiply.js` | Remove `generate`/`taskFrom` randomness. Keep `demoTask` + `breakdown` for the camp. | R4 |
| `site/js/tasks/index.js` | Register `fixed`. | R2 |
| `site/js/engine/level.js` | Run a section's unsolved tasks in order; `skip`; solved ids; camp practice from file tasks with a breakdown. | R5, R6 |
| `site/js/engine/progress.js` | Optional `solved: {levelId: [ids]}`; `markSolved`; `keyThreshold` = ⌈2/3·n⌉; `awardKeyIfEarned`; old saves still valid. | R6–R8 |
| `site/js/ui/screens.js`, `site/css/game.css` | Section list, "Hoppa över" button, choice/fraction/number-line views, sound toggle. | R2, R5, R6, R10 |
| `site/js/ui/text-sv.js` | New strings (sections, skip, key progress, kinds, sound). | all |
| `site/js/engine/scene.js` | Theme palettes for the level scene and map stones. | R9 |
| `site/js/engine/sound.js` (new) | Web Audio synth: correct, win, key, wrong; mute; unlock on the first gesture. | R10 |
| `site/js/main.js` | Load sheets; section flow; skip; solved and keys; sounds and sparkles; toggle. | all |
| `tests/engine/rational.test.js`, `tests/engine/sheet.test.js`, `tests/tasks/fixed.test.js`, `tests/tasks/sheets-oracle.test.js` (new) | Rationals; sheet schema; answer checks per kind; **independent oracle over every arithmetic task in all 7 sheets**. | R1–R3 |
| `tests/engine/level.test.js`, `tests/engine/progress.test.js` | Sections, skip, unsolved-only, the 2/3 key rule, old-save compatibility. | R5–R8 |
| `tests/tasks/decimal-multiply.test.js`, `tests/tasks/fixtures.js`, `tests/engine/rng.test.js` | **Removed** with the generator (owner: generated numbers "was a bad idea"; testing the randomiser has "no point"). The breakdown tests in `breakdown.test.js` stay. | R4 |
| `tests/engine/world.test.js`, `tests/site/worlds.test.js` | Updated for: every level playable, sheet references, themes. | R1, R9 |
| `.claude/skills/security-baseline/SKILL.md`, `AGENTS.md` | Rule 3 and the conventions: exact homework tasks are allowed (owner, 2026-10-08); "same vintage" generation is replaced by "exact sheet tasks". | Policy 1 |

## Work order
1. `rational.js` and its tests.
2. Transcribe the 7 sheets (from the photos; zoomed crops where needed), plus `sheet.js` validation
   and the oracle test. Fix any transcription errors the oracle finds.
3. `fixed.js` with per-kind checks and the breakdown for `decimal · whole`, and its tests.
4. `progress.js` (solved, threshold, awarding) and `level.js` (sections, skip), with their tests.
   Remove the generator and its tests.
5. UI: the section list, skip, the kind views, and wiring in `main.js`; then the camp. Browser check.
6. Themes, sound, sparkles, and the sound toggle. Browser check.
7. Docs (`AGENTS.md`, `security-baseline`), `verify.sh`, then one verifier + one reviewer in
   parallel, limited to iPad landscape with touch and desktop.

## Tests (proof)
| AC | Proof |
|----|-------|
| AC1 | `sheets-oracle.test.js` (every arithmetic answer), the task count per sheet, number-line values |
| AC2 | `fixed.test.js` (each kind); browser |
| AC3 | `level.test.js` / `progress.test.js` (threshold, skip, unsolved-only, key once); browser |
| AC4 | `progress.test.js` with a 0002 save |
| AC5 | browser (themes, sound toggle saved, no sound when off) |
| AC6 | `verify.sh`; the diff shows only generator and rng tests removed |

## Risks and rollback
- **Transcription errors:** the oracle catches arithmetic tasks. Word problems and choices are
  proofread against the photos.
- **iPad audio:** the context starts on the first gesture; if it fails, sound is simply off.
- **Rollback:** revert the merge. Old code ignores the `solved` field, and level ids are unchanged.
