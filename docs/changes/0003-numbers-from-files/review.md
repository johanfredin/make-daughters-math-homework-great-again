---
id: 0003-numbers-from-files
stage: review
verdict: MERGE            # after fixing both reports' findings; approved under the owner's delegation for this intent
reviewed_at: 2026-10-08T18:20:00+02:00
---

# Review: numbers from files

## Verification
`./scripts/verify.sh` → **VERIFY: PASS**, 102 tests, 0 failing.

**Verifier** (fresh context): `VERDICT: FAIL`, with two test-only blockers, both fixed below. Otherwise
everything checked out:
- **Transcription:** all 170 tasks on all 7 sheets were compared with the photos, not a sample, and
  every one matches.
  - Number-line values were measured on a zoomed crop: 0,03 / 0,18 / 0,35 / 0,76 / 0,82 / 1,04.
  - One deliberate fix to the textbook: in Hur räknar 1, task 8, "få" is a printing error for "då".
- **Browser** (iPad 1180×820 touch, desktop 1024×768), all working:
  - the section list and full sections
  - skip, and the skipped task coming back
  - the key at 4/5 on Blandad form
  - the number line, choices, estimate and fractions
  - the sound toggle surviving a reload
- **Audio:** headless Chrome would not start it from synthetic touches. The code unlocks it on the
  end of a real touch, click or key press. **Check this on the iPad.**

**Reviewer:** **MERGE AFTER FIXES**. It recomputed every answer on the 7 sheets and found none wrong.
It confirmed the key rule (⌈2/3⌉), that old saves keep their keys, and that rollback is safe.

## Acceptance criteria coverage
| Criterion | Test | Status |
|-----------|------|--------|
| AC1 | `sheets-oracle.test.js`: 170 tasks, independent BigInt oracle (mutation-checked), number-line values | Pass |
| AC2 | `fixed.test.js` (every kind); browser | Pass |
| AC3 | `level.test.js` (sections, skip, unsolved-only, ⌈2/3⌉ key once); `sheet.test.js` (section and group rules); browser | Pass |
| AC4 | `progress.test.js` (0001/0002 save keeps its key; new fields default) | Pass |
| AC5 | `world.test.js` (7 distinct themes); browser (themes, sound toggle persisted) | Pass; sound to be heard on the iPad |
| AC6 | verify.sh. Removed only: generator tests, fixtures, rng test (plan), plus one property-test check (plan amendment) | Pass |

## Findings
| Severity | Source | Problem | Resolution |
|---|---|---|---|
| blocker | both | Assertions dropped from the level tests: invalid status, the R10 wrong statuses, invalid input in a step, and "Dela upp det" still offered after a wrong answer | Restored with the new API |
| blocker / minor | both | The "whole factor has one non-zero digit" check was removed without a note | Recorded in the plan amendment with the sheet tasks that break it; the stale comment is fixed |
| major / blocker | both | No `sheet.test.js`: the section/group rules were untested | Added: one broken sheet per rule (8 tests) |
| minor | reviewer | Comma hint on place-value and rounding tasks ("5" for 500 in 587) | No comma hint for tasks with a prompt; tested |
| minor | reviewer | Endless generic hints on tasks with no "Dela upp det" | After 3 misses: "Du kan hoppa över den och ta den sen." ("You can skip it and come back to it later.") |
| minor | reviewer | The key was only celebrated at the end of the section | "Du fick en nyckel!" ("You got a key!") plus a fanfare on the task where it is earned; the animation still plays at the end of the section |
| nit | reviewer | Loose spacing in mixed numbers ("2 2/3") | Fixed |
| nit | reviewer | Dead strings | Removed |
| nit | reviewer | Sparkles are in `scene.js`, not `effects.js` | Recorded in the plan amendment |

Follow-up suggested by the reviewer, not in this change:
- "Dela upp det" for division and ÷10/100/1000, since division is her weak spot.
- About 14 division tasks currently only get hints plus "Hoppa över".

## Deviations from plan
- **Fewer tasks get "Dela upp det":** only decimal · whole tasks whose decimal fits the existing
  strategies (46 tasks). Tasks like `12,75 · 10` would get a misleading help line.
- **Sparkles** are in `scene.js`, not a separate `effects.js`.
- **Tests:** `sheet.test.js` was added after review, and one property-test check was removed (see
  the plan amendment).

## How to try it
```bash
cd .worktrees/0003-numbers-from-files && python3 -m http.server -d site 8000
```
- Every stone on the map is a level. Each shows sections, with "Lösta: x/y – z ger nyckeln" ("Solved:
  x/y – z gets the key").
- Try Blandad form: 5 tasks; solving 4 gives the key.
- Turn sound on or off with "Ljud på/av" in the top bar. On the iPad, sound starts after the first tap.
