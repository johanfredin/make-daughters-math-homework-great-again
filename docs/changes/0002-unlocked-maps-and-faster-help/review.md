---
id: 0002-unlocked-maps-and-faster-help
stage: review
verdict: MERGE            # after two review rounds; owner decisions recorded in the spec's decisions log
reviewed_at: 2026-10-08T17:06:40+02:00
---

# Review: unlocked maps and faster help

## Verification

`./scripts/verify.sh` → **VERIFY: PASS**, 86 tests, 0 failing, 0 skipped, at commit f88e672.

| Round | Verifier | Reviewer |
|---|---|---|
| 1, at 69d9629 | **FAIL.** All of AC1–AC9 passed, but the step-3 options and the hundredths help did not match the spec, and no decision was recorded. | **MERGE AFTER FIXES.** Two spec blockers (step-3 options, hundredths help); majors on hundredths pedagogy, missing option asserts, and the unplanned stop-on-every-stone. |
| Owner decisions, chat, 2026-10-08 | | Hundredths step 3 = column picture. Options = likely mistakes, ≤ 2 decimals. Walking = stop on every stone + remember a push made during a walk. Recorded in the spec's decisions log and the plan's *Amendment*. |
| 2, at c8e4a4d and f88e672 | **PASS at f88e672.** AC1–AC10, 18 000 tasks checked independently (0 errors), all 201 possible column-picture counts checked, browser checks at iPad 1180×820 / 820×1180 (touch) and desktop 1024×768. | **MERGE AFTER FIXES.** Missing placeholder zero (`0,□8`) for one-digit hundredths counts; R12 had no proof. Both fixed in f88e672. |

## Acceptance criteria coverage
| Criterion | Test | Status |
|-----------|------|--------|
| AC1 | `progress.test` "0002 AC1"; browser fresh map | Pass |
| AC2 | `world.test` "0002 AC2/AC3"; browser walk + "Kommer snart" | Pass |
| AC3 | `world.test`, `progress.test` enterReason; browser den message | Pass |
| AC4 | `progress.test` "0002 AC4" (exact 0001 save); browser with a seeded save | Pass |
| AC5 | `level.test` "0002 AC5" (level + camp practice); browser on every task | Pass |
| AC6 | `decimal-multiply.test.js` unchanged | Pass |
| AC7 (amended R7) | `breakdown.test` (exact options and answerIndex, 6 slots × 6000 property test), `place-value.test` | Pass |
| AC8 | `text-sv.test` "0002 AC8" | Pass |
| AC9 | browser: tenths bar; units in "Ett till exempel"; "Visa mig hur" still split | Pass |
| AC10 (R12) | `walk-queue.test` (4 tests); browser: queued push done, holding stops at the next stone | Pass |

## Findings
| Severity | Pass | Problem | Resolution |
|---|---|---|---|
| blocker | spec | Step-3 options did not follow R7. My rule could produce `0,0007`, harder than the sheet. | Owner chose likely-mistake options with ≤ 2 decimals. Fixed in c8e4a4d; tested (exact options, ≤ 2 decimals). |
| blocker | spec | Hundredths help differed from R7 without a recorded reason. | Owner chose the column picture; help "Sista siffran i 24 ska stå där". c8e4a4d. |
| major | player-exp. | Hundredths step 3 could only be solved by counting decimals, the method that confused her. | Column picture: only the right row has the count's last digit in the highlighted hundredths box. c8e4a4d + f88e672. |
| major | player-exp. | Placeholder zero missing: `0,□8` for one-digit counts. | Pure `site/js/ui/place-value.js` with tests for 8/24/60/810; the verifier checked all 201 counts. f88e672. |
| major | spec | Stop-on-every-stone was not in the plan; pushes made during a walk were lost. | Owner chose "stop + remember push" (R12, AC10). Pure, tested `engine/walk-queue.js`. c8e4a4d + f88e672. |
| major | tests | Named cases did not assert the option lists. | Exact options and answerIndex for 0,3 · 20, 0,04 · 6, 20 · 0,03, 500 · 0,9. |
| minor | correctness | The split fallback referred to a deleted string. | Split only for halves (`decimal.fracPart`), tested. |
| minor | player-exp. | Help and bar state the answer when it is 1 (`0,5 · 2`). | Accepted as scaffolding (decisions log). |
| minor | spec | The spec body still described the superseded design. | R7/R8 marked as superseded; content table updated to as-built; AC10 added. |
| minor | process | The amendment was committed after the spec and plan approvals. | The amendment records the owner's own chat choices verbatim (decisions log). The owner then asked to merge and push when the review was done. |
| nit | various | Units checks ran inside the step loop; the plan said "underneath" instead of "to the right"; one-digit help wording; reaching into `{n, scale}`. | All fixed. |

Accepted, not changed:
- Answer position per unit is fixed (tenths: middle, hundredths: first). This follows from the owner's choice.
- When the count has one digit, the hundredths help names a digit that is also the ×100 option. It never names the answer.

## Deviations from plan
- **Amendment after review** (owner decisions): column picture, likely-mistake options, and R12 (walking).
- **New files:** `site/js/ui/place-value.js` and `site/js/engine/walk-queue.js`. Both are pure and tested.
- **Save format:** saves keep an always-empty `unlocked` array for rollback safety, as set out in the plan's *Risks*.

## How to try it
Live at https://johanfredin.github.io/make-daughters-math-homework-great-again/ after the merge. Locally:
```bash
cd .worktrees/0002-unlocked-maps-and-faster-help && python3 -m http.server -d site 8000
```
1. The map is open. Walk right onto grey stone 1 ("Kommer snart"), then up to stone 2.
2. "Dela upp det" is there on the first task.
3. Tasks like `0,3 · 20` are counted in tiondelar (tenths) with the "10 tiondelar = 1 hel" bar.
4. Tasks like `6 · 0,04` are counted in hundradelar (hundredths), and step 3 shows the column picture.
