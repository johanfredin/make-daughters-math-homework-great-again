---
id: 0004-more-helpers
stage: plan
status: approved
spec: docs/changes/0004-more-helpers/spec.md
approved_by: Johan Fredin (delegated in chat 2026-10-08: "you are allowed to approve all changes"; recorded by Claude)
approved_at: 2026-10-08T20:36:02+02:00
---

# Plan: more helpers

## Files to change
| File | Change | Req |
|------|--------|-----|
| `site/js/tasks/strategies.js` (new) | Parse sheet expressions (`decimal.js` values, negatives, chains); one builder per strategy from the spec's R2 table; `strategyFor(text)` returns a breakdown or null. | R1–R4 |
| `site/js/tasks/units.js` (new, from `breakdown.js`) | `unitWord`, `unitsChoice(count, unitKey)` for tenths/hundredths/thousandths, `breakdownOf`. | R2, R4 |
| `site/js/tasks/breakdown.js` | Use `units.js` (behaviour unchanged). | R5 |
| `site/js/tasks/fixed.js` | `canBreakdown` / `breakdown` → existing decimal · whole first, else `strategyFor`. | R1, R5 |
| `site/js/ui/place-value.js` | `columnRange` / `columnCells` gain `minPos` (default −2), so the picture can go down to tusendelar. | R4 |
| `site/js/ui/screens.js`, `site/css/game.css` | Column picture: `minPos`, optional `target`, and a dashed `from` row. | R2, R4 |
| `site/js/ui/text-sv.js` | Strings for every new step. | R2 |
| `tests/tasks/strategies.test.js` (new) | Named examples (AC2); coverage over all sheets (AC1); property test over all breakdowns (AC3). | AC1–AC3 |
| `tests/ui/place-value.test.js` | Thousandths and left-of-ental cases. | R4 |
| `CLAUDE.md` | Record the owner's standing approval delegation and the verification budget. | — |

## Work order
1. `units.js` refactor and `place-value.js` `minPos`, with tests. Existing tests stay green.
2. `strategies.js`, one strategy at a time, with named tests first; wire into `fixed.js`.
3. Coverage and property tests over all sheets; fix whatever they find.
4. UI (`from` row, target, thousandths); browser check of one breakdown per kind.
5. One verifier + one reviewer in parallel (iPad landscape + desktop); `review.md`.

## Tests (proof)
| AC | Proof |
|----|-------|
| AC1 | `strategies.test.js` coverage (96 tasks) |
| AC2 | `strategies.test.js` named examples |
| AC3 | `strategies.test.js` property test |
| AC4 | browser |
| AC5 | verify.sh; the diff shows no removed or loosened asserts |

## Risks and rollback
- **Help lines that leak answers:** caught by the property test.
- **Odd strategy picks for unusual expressions:** coverage is tested on the real sheets, and
  `strategyFor` returns null for anything it does not handle.
- **Rollback:** revert the merge. The change is UI help only; no data or save format changes.
