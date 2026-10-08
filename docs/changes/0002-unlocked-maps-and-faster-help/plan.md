---
id: 0002-unlocked-maps-and-faster-help
stage: plan
status: approved
spec: docs/changes/0002-unlocked-maps-and-faster-help/spec.md
approved_by: Johan Fredin (delegated in chat 2026-10-08: "i approve the plan"; recorded by Claude)
approved_at: 2026-10-08T16:40:10+02:00
---

# Plan: unlocked maps and faster help

## Files to change
| File | Change | Requirement |
|------|--------|-------------|
| `site/js/engine/progress.js` | Remove `isUnlocked`. `isLocked` → level: `!playable`, boss: too few keys. Rename `blockedReason` → `enterReason`. `clearLevel` no longer adds to `unlocked`. The `unlocked` field stays in the save as an **unread, always-empty** array, and `validate` still accepts any old contents. Keeping the field means a rollback to 0001 code can still read 0002 saves (see *Risks*). | R1, R3, R4 |
| `site/js/engine/world.js` | `tryMove(world, from, angle)` → `{move}` or `{bump}`, with no block callback. | R2 |
| `site/worlds/kap1/world.json` | Drop `"startUnlocked": true`. | R1 |
| `site/js/main.js` | `onDirection` only moves or bumps. `onEnter` uses `enterReason` (Kommer snart / Lyan är låst). The map view passes `isComingSoon` and `isLocked` separately. | R1–R3 |
| `site/js/engine/scene.js` | Unbuilt levels: grey stone with a small sign post, no padlock. The padlock is only on the den. | R1 |
| `site/js/engine/sprites.js` | Add a 7×8 `SIGN` sprite (sign post). | R1 |
| `site/js/engine/level.js` | Remove `OFFER_BREAKDOWN_AFTER`. `withTask` sets `breakdownOffered = hasBreakdown(task)`. `answerTask` keeps it. | R5 |
| `site/js/main.js` | Wrong-answer feedback no longer appends "Vill du dela upp det…" (the button is already there). | R5, R6 |
| `site/js/tasks/breakdown.js` | `unitsStrategy` replaces `noCommaStrategy`. Step 3 is a `choose` with `options` from `shift(answer, ±1)`, sorted ascending, plus `bar`. `strategy: "units"`. | R7, R7b, R8, R9 |
| `site/js/ui/screens.js` | `breakdownPanel` renders `step.bar` (10 boxes; 10×10 for hundredths). `choose` steps can have a visual or a bar. | R8 |
| `site/css/game.css` | `.unit-bar` styles (CSS only, no inline styles). | R8 |
| `site/js/ui/text-sv.js` | Add the units strings and the bar labels. Delete `noCommaPrompt/Help`, `countDecimals*`, `putBack*` and `level.offerBreakdown`. | R7, R10 |

**Changed tests: each existing test whose behaviour the approved spec deliberately changes.** These
are not weakened tests; each one is replaced by a test of the new behaviour:

| Test file | 0001 test | Replaced by (reason) |
|---|---|---|
| `tests/engine/progress.test.js` | "AC3: a fresh game has 6 of 7 levels locked" | "0002 AC1: no level is locked by order; 6 unbuilt levels are coming soon; the den is locked". R1 removes order-locking. |
| `tests/engine/progress.test.js` | "blockedReason: …" | "enterReason: coming soon / boss locked / null". R2 renames it and moves it from walking to entering. |
| `tests/engine/progress.test.js` | "AC5: … unlocks the next level; replay gives no second key" | Same test without the `unlocked` assertion; the key-once assertions stay. The unlock chain is removed by R1. |
| `tests/engine/world.test.js` | "AC4: tryMove — walk, blocked by a locked node, bump" | "0002 AC2: tryMove walks onto unbuilt levels and the den; bump with no path". R2. |
| `tests/engine/level.test.js` | "AC6: two wrong answers offer the breakdown…" | "0002 AC5: the breakdown is offered before any answer; finishing it clears the task". R5. |
| `tests/engine/level.test.js` | "the breakdown cannot be opened before it is offered" | Kept for a task type *without* a breakdown (already in "a task type without breakdown()…"). The decimal case is now always offered (R5). |
| `tests/tasks/breakdown.test.js` | "AC8: 0,04 · 6 uses the without-the-comma strategy"; "slots 4–6 work without the comma" | "0002 AC7: units strategy for 0,3 · 20 and 0,04 · 6", plus a slot-6 case. R7 replaces the strategy. |

The 1000-task property test in `breakdown.test.js` stays and is extended (AC7). The split, hint,
parser, generator and save-robustness tests are untouched.

**New tests**
- `tests/engine/progress.test.js`:
  - an old 0001 save with `unlocked` loads with keys and position kept and `reset: false` (AC4)
  - `freshState` and saves keep `unlocked: []`, and `clearLevel` never adds to it
- `tests/tasks/breakdown.test.js`:
  - per slot × 1000: step 2 is one table fact, the 3 options are distinct and contain the answer
    exactly once, and the options are sorted
- `tests/ui/text-sv.test.js`: no string contains "steg åt vänster" or "decimaler har" (AC8)

## Work order
Each step ends with `./scripts/verify.sh` green and a commit `[0002-unlocked-maps-and-faster-help] …`.

1. **Progress and movement.** Write the new and replaced progress and world tests first, then change
   `progress.js`, `world.js` and `world.json`.
2. **Map UI.**
   - Update `main.js` (`onDirection` / `onEnter`).
   - Add the sign sprite and the unbuilt-level drawing in `scene.js`.
   - Browser check: walk start → right onto level 1 (Kommer snart on Enter) → up to level 2 → enter.
3. **Help always on.**
   - Write the level tests first, then change `level.js`.
   - Remove the "Vill du dela upp det" suffix in `main.js` and the unused string.
4. **Units strategy.**
   - Write the breakdown tests first, then add `unitsStrategy`.
   - Swap the strings in `text-sv.js`, plus the AC8 test.
5. **Size bar.** Add the `breakdownPanel` bar and its CSS.
   - Browser check of step 3 on iPad landscape and portrait.
6. **Hand-off.**
   - Run `/verify` (iPad 1180×820 + 820×1180 with touch, desktop 1024×768) and `/review-change`.
   - Write `review.md`.
   - The 0001 save-compatibility check is run in the browser by seeding a v1 save with `unlocked`.

## Tests (proof)
| AC | Proof |
|----|-------|
| AC1 | progress test (no level is locked by order, 6 coming soon, den locked); browser screenshot |
| AC2 | world test (`tryMove` onto an unbuilt level; path start → rakna → multiplikation); browser walk |
| AC3 | world test (move onto the den); progress `enterReason` = bossLocked; browser |
| AC4 | progress test with an exact 0001 save; browser with a seeded save |
| AC5 | level test (offered at start, and in camp practice); browser |
| AC6 | 0001 hint tests unchanged (`decimal-multiply.test.js`) |
| AC7 | breakdown tests (named cases + 6 slots × 1000 property test) |
| AC8 | text-sv test |
| AC9 | browser: step-3 bar visible; camp "Ett till exempel" shows units steps |

## Risks and rollback
- **Her save on the iPad.** If `validate` rejected old saves, she would lose her key.
  - Mitigation: the AC4 test uses the exact 0001 shape, plus a browser check with a seeded save.
- **A three-way choice invites guessing.**
  - A wrong choice shows the size hint, and 3 wrong reveal the answer (unchanged rule).
  - The owner can ask for typed input later.
- **Map readability.** Without locks, it is less clear which stones are playable.
  - Unbuilt levels get the grey stone and sign post. Playable ones keep the number and the pulse ring.
- **Rollback:** revert the merge; Pages redeploys 0001.
  - Saves stay compatible both ways. The 0001 validator requires an `unlocked` array, so 0002 keeps
    writing `unlocked: []` and never reads it.
  - This differs slightly from the spec's design note ("drops it from the returned state"). It still
    meets R4, and it makes rollback safe.

## Verification
```bash
./scripts/verify.sh
python3 -m http.server -d site 8000      # http://localhost:8000
```
Browser checklist (iPad sizes with touch, desktop with keys):
1. **Fresh game:**
   - no padlocks on levels; 6 sign posts; the den is locked with "0/7"
   - walk right onto stone 1, then Enter → "Kommer snart"
   - walk up to stone 2 → enter
2. **Level:** "Dela upp det" is visible at task 1 before any answer.
   - On a `0,d` or `0,0d` task: the steps are tenths/hundredths → table fact → choice.
   - The bar is shown in step 3.
3. **Den:** walk to it → Enter → "Lyan är låst…".
4. **Old save:** seed `localStorage["mattespel.v1"]` with a 0001-style save, then reload. "Fortsätt"
   keeps 1 key with no reset message.

After merge: push `main` (with the owner's go-ahead). The Pages workflow redeploys.
