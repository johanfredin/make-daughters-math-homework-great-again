---
id: 0004-more-helpers
stage: review
verdict: MERGE            # after fixing both reports' findings; approved under the owner's standing delegation
reviewed_at: 2026-10-08T21:30:00+02:00
---

# Review: more helpers

## Verification
`./scripts/verify.sh` → **VERIFY: PASS**, 117 tests, 0 failing.

**Verifier:** `VERDICT: FAIL`, for one layout defect only; it is now fixed.
- **Maths:** an independent exact-fraction check of all 96 breakdowns found every step correct.
  - Every last step equals the task answer.
  - Every choice step has exactly one right option.
- **Browser:** every kind was played to the end on iPad 1180×820 (touch) and desktop 1024×768: 64 tasks.
- **Weakened tests:** none.
- **The defect:** the 7-column pictures (`1,4 · 1 000`, `100 · 1,245`) overflowed the 1024 px panel.
  - Fix: smaller boxes for 7+ columns.
  - Re-measured: the panel is 457/457 and the rows end at x = 1008 of 1024.

**Reviewer:** **MERGE AFTER FIXES**. It found every final and step answer correct.

## Acceptance criteria coverage
| Criterion | Test | Status |
|-----------|------|--------|
| AC1 | `strategies.test.js` coverage: 96 calculation tasks, none missing | Pass |
| AC2 | `strategies.test.js` named examples (the `137 + 9` row amended in the spec) | Pass |
| AC3 | `strategies.test.js` property test (now including text answers, mutation-checked), column names | Pass |
| AC4 | browser, every kind, both sizes | Pass after the layout fix |
| AC5 | verify.sh; the two widened 0003 tests still pin the 46 decimal · whole tasks to the 0002 strategies | Pass |

## Findings
| Severity | Source | Problem | Resolution |
|---|---|---|---|
| blocker | reviewer | The help for "Tiondelar gånger tiondelar blir …" named the answer (hundradel/tusendel) | The help now names neither: "Dela en tiondel i tio lika stora bitar…" ("Split a tenth into ten equal pieces…") |
| blocker | reviewer | `137 + 9`: the spec's step 1 differed from the built "how far to 140?" step | Spec amended to match the built step (the better one), recorded in the decisions log |
| major | reviewer | The leak test only compared numbers | Now also checks text answers (units, directions, Större/Mindre, expressions); planting "vänster" (left) in the direction help made it fail |
| major (AC4) | verifier | 7-column pictures overflowed at 1024×768 | Smaller boxes for 7+ columns; re-measured |
| minor | reviewer | The scale help counted boxes ("two boxes further left"), close to "move the comma" | It now names columns: "· 100 gör talet hundra gånger större: tiondelar blir tiotal." ("· 100 makes the number a hundred times bigger: tenths become tens.") |
| minor | reviewer | No name for column 4 (`14 000`) | Added "tiotusental"; a test checks every column has a name |
| minor | reviewer | The walk help pointed the wrong way for `−7 + 7` | One help per direction |
| nit | reviewer | The direction help stated the rule that answered the step; the Större/Mindre help said "mer eller mindre" | Rephrased so neither names the answer (the new leak test enforces this) |
| nit | reviewer, verifier | Chain help mentioned hundradelar on tiondelar-only chains; the from-row was 3 px off; an unused import; a misnamed variable | Fixed |
| other | owner | Headless test browsers played the game's sounds on the owner's speakers | The driver now runs muted; a pitfall line in AGENTS.md and a note in the verifier instructions |

## Deviations from plan
- Spec AC1 count: 94 corrected to 96 (an arithmetic slip).
- Spec `137 + 9` row amended (above).

## How to try it
```bash
cd .worktrees/0004-more-helpers && python3 -m http.server -d site 8000
```
"Dela upp det" (Break it down) is on every calculation, for example:
- Räkna 1a `0,7 + 0,5`
- Räkna 12b `1,4 · 1 000`
- Repetition 1 13a `137 + 9`
- Repetition 2 4a `−7 − 2`, 9b `6 000 / 200`, 10a `20 / 0,5`
