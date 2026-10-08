---
id: 0001-game-skeleton-and-hosting
stage: review
verdict: MERGE            # after the fixes below; reviewer's original verdict was MERGE AFTER FIXES
reviewed_at: 2026-10-08T16:20:00+02:00
---

# Review: game skeleton and hosting

## Verification

**`./scripts/verify.sh` → `VERIFY: PASS`:** 70 tests, 0 failing, 0 skipped. This was run after all fixes, at
commit 7234a44.

**Verifier subagent** (fresh context, at 727664f): `VERDICT: FAIL`.
- **AC12 failed:** the panel's back button was 44 px. This is fixed in 587e4db.
- **Every other criterion passed** with evidence:
  - It played full runs in headless Chrome: desktop 1024×768 with the keyboard, and iPad 1180×820 and
    820×1180 with touch.
  - It cross-checked 30 000 generated tasks with BigInt and found 0 mismatches and no float noise.
  - It saw no console errors, no CSP violations, and only same-origin requests.
- **Interference:** it noticed my edits for the fixes landing while it ran. It verified the committed
  HEAD from a clean `git archive` copy, so its results are for 727664f.

**Re-check after the fixes** (Claude, headless Chrome at 1180×820, commit 7234a44):
- The back button is 48 px.
- Enter on a focused "Dela upp det" opens the breakdown.
- The place-value labels are 16 px.
- All six tasks follow the sheet's patterns.
- The key celebration shows, and the den shows "1/7".

## Acceptance criteria coverage
| Criterion | Test | Status |
|-----------|------|--------|
| AC1 | `.github/workflows/pages.yml` (`deploy` needs `verify`) | Structure only. Live deploy is checked after merge (owner). |
| AC2 | `tests/site/structure.test.js` (CSP, no inline/external), browser network and console | Pass |
| AC3 | `tests/engine/world.test.js`, `tests/engine/progress.test.js`, browser at iPad + desktop | Pass |
| AC4 | `tests/engine/world.test.js` (8 angles, no path, tryMove), browser keyboard + touch stick | Pass |
| AC5 | `tests/engine/level.test.js`, `tests/engine/progress.test.js`, browser full level + replay | Pass |
| AC6 | `tests/engine/level.test.js`, browser | Pass |
| AC7 | `tests/tasks/decimal-multiply.test.js` (6×1000 seeds, oracle, sheet pattern, one table fact) | Pass |
| AC8 | `tests/tasks/breakdown.test.js` | Pass |
| AC9 | `tests/tasks/decimal-multiply.test.js` | Pass |
| AC10 | `tests/ui/number-format.test.js` | Pass |
| AC11 | `tests/engine/level.test.js` (practice, examples, demo), browser | Pass |
| AC12 | `tests/site/structure.test.js` (every button rule ≥ 48 px, Gå in ≥ 64 px), browser | Pass after fix |
| AC13 | `tests/ui/text-sv.test.js`, `tests/site/structure.test.js` (mutation-checked) | Pass |
| AC14 | `tests/engine/progress.test.js`, browser with a corrupt save | Pass |
| AC15 | `tests/engine/progress.test.js`, browser | Pass |
| AC16 | verify.sh, clean-import test, world mutation tests | Pass |

## Findings

Reviewer subagent: verdict **MERGE AFTER FIXES**, at 727664f.

| Severity | Pass | Where | Problem | Resolution |
|---|---|---|---|---|
| blocker | spec | `site/css/game.css` `.btn-small` | Back button 44 px; AC12 requires ≥ 48 | Fixed in 587e4db (48 px). The CSS test now covers every button rule. |
| major | player-exp. | `world.json` slot 4 | 25/45 × any `0,d` gives carrying tasks (`45 · 0,7`) that the sheet never has, breaking the owner's "never harder" rule | Fixed in 587e4db: 25/45 dropped, spec table amended. A test asserts every task is one times-table fact plus moving the comma (mutation-checked). |
| major | player-exp. | `game.css` place-value `th` 11 px, "Steg" 16 px | Too small to read on the iPad (R17) | Fixed in 587e4db: 16 px bold and 20 px. |
| major | maintainability | `engine/level.js` | Engine was tied to the decimal-only breakdown, so a new task type would crash on "Dela upp det" | Fixed in 587e4db: `breakdown` is an optional task-type export, offered only when present (test with a type without one). The generic step checker moved to `tasks/steps.js`. The camp demo now carries its task type. |
| minor | correctness | `main.js` | The last revealed step said "Vi tar nästa steg" ("We'll take the next step") | Fixed in 7234a44 (`revealLast`) |
| minor | correctness | `main.js` | Reset notice shown after a deliberate "Börja om" | Fixed in 7234a44 |
| minor | spec | map den | R5: "n/7" not shown at the den | Fixed in 7234a44: label under the den |
| minor | spec | AGENTS.md/CLAUDE.md | Commit/push rules changed on this branch outside the plan | The owner decided this in chat. It is recorded in the spec decisions log. |
| minor | tests | structure test | The AC12 CSS check only covered `.key` | Fixed in 587e4db |
| minor | tests | fixtures | Slot-4 test encoded the too-hard pattern | Fixed with slot 4 |
| minor | player-exp. | `input.js` | Thumbstick could not steer without lifting the thumb | Fixed in 7234a44: re-push on an 8-way sector change |
| minor | player-exp. | `numpad.js` | Enter on a focused "Dela upp det" did nothing | Fixed in 7234a44 (also reported by the verifier) |
| minor | player-exp. | `main.js` | Earning a key was a plain text panel (R8 "celebration") | Fixed in 7234a44: the key floats with sparkles (none with reduced motion) |
| minor | maintainability | `scene.js` | `foe` in world.json was ignored | Fixed in 7234a44: the sprite comes from data, and validation lists the known foes |
| minor | maintainability | `text-sv.js` | One greeting for every camp | Fixed in 7234a44: greetings keyed by `camp`, with a default |
| nit | spec | start screen | R18: "Spela" is hidden when a save exists | Accepted, recorded in the decisions log |
| nit | spec | `scene.js` | R4: fractional scaling below 2× | Accepted, recorded in the decisions log |
| nit | player-exp. | `text-sv.js` | "nollorna" wording | Fixed in 7234a44 |
| nit | player-exp. | `dialog.js` | Tap only skipped on the text line | Fixed in 7234a44: anywhere on the box |
| nit | security | `pages.yml` | Pages/OIDC permissions were workflow-wide | Fixed in 7234a44: deploy job only |
| nit | maintainability | dead code | `foeFled` and `allSprites` unused | `foeFled` removed; `allSprites` now used by a sprite test |
| nit | maintainability | `game.css` | Phone media rules after phones were dropped | Kept. They are harmless, and removing them is effort the owner asked not to spend. |

Verifier minors:
- Breakdown factor order: fixed, it now keeps the task's order.
- "= ?" wrapping alone: fixed with non-breaking spaces.

## Deviations from plan
- **The breakdown is a task-type export** (`tasks/steps.js` added) instead of being imported directly by
  `level.js`. This came from the review.
- **Slot 4 of the task table** was amended after approval, under the owner's "never harder" rule.
- **Phones were dropped** as a target device (owner, during build). The browser checks were moved to iPad
  sizes.
- **`AGENTS.md` gained *Known pitfalls*,** and the commit/push rules were changed by the owner in chat.

## How to try it
```bash
cd .worktrees/0001-game-skeleton-and-hosting
python3 -m http.server -d site 8000      # http://localhost:8000
# iPad on the same Wi-Fi: add --bind 0.0.0.0 and open http://<computer-ip>:8000
```
1. Start with "Spela", pick a fur colour and a name, then "Ut i skogen!" ("Into the forest!").
2. On the map, walk up to the tent (Multiplikationslägret) and try "Visa mig hur", which breaks down
   `1,5 · 5`.
3. Walk right to stone **2** ("Multiplikation med decimaltal") and play the 6 tasks. Answer one wrong
   twice to see the hints and "Dela upp det".
4. After the key, the map shows "Nycklar: 1/7", a flag on stone 2, and "1/7" at the den.

After merge:
- Set Settings → Pages → Source = "GitHub Actions" (one time).
- Push `main`.
- Open https://johanfredin.github.io/make-daughters-math-homework-great-again/.
