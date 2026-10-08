---
id: 0001-game-skeleton-and-hosting
stage: plan
status: approved
spec: docs/changes/0001-game-skeleton-and-hosting/spec.md
approved_by: Johan Fredin (delegated in chat 2026-10-08: "i approve the plan"; recorded by Claude)
approved_at: 2026-10-08T15:24:54+02:00
---

# Plan: game skeleton and hosting

**Starting point.** The repo has no game code yet. The only executable piece is
`scripts/verify.sh:17-23`: it runs `node --test` on `tests/**/*.test.{js,mjs}`, and prints "no tests
yet" when there are none. There is no `.github/` directory.

## Files to change
| File | Change | Requirement |
|------|--------|-------------|
| `site/js/engine/rng.js` | new: `mulberry32(seed)`, `int(rng, lo, hi)`, `pick(rng, arr)` | R9 |
| `site/js/engine/decimal.js` | new: `{n, scale}` type; `dec(str\|int)`, `mul`, `add`, `eq`, `cmp`, `normalise`, `shift(x, k)` (×10^k) | R9, R10 |
| `site/js/ui/number-format.js` | new: `formatNumber(dec)`, `formatExpr(a, op, b)`, `parseAnswer(str) → dec \| null` | R12 |
| `site/js/ui/text-sv.js` | new: every player-facing string, grouped (`start`, `map`, `level`, `camp`, `hints`, `praise`, `errors`) | R15 |
| `site/js/tasks/decimal-multiply.js` | new: `generate(spec, rng)`, `check(task, input)` → `{status: correct\|wrong\|invalid, hint}`, mistake classifier | R9, R11 |
| `site/js/tasks/breakdown.js` | new: `breakdown(decimalFactor, wholeFactor)` → `{strategy, steps:[{prompt, answer, help, visual, options?}]}` | R10 |
| `site/js/tasks/index.js` | new: task-type registry `{ "decimal-multiply": module }` | R19 |
| `site/js/engine/world.js` | new: `validateWorld(json)` → error list; `isReachable`, `neighbourInDirection(world, nodeId, angle, progress)` | R5, R6, R19 |
| `site/js/engine/progress.js` | new: `freshState()`, `validate(obj)`, `load(storage)`, `save(storage, state)`, `clearLevel(state, world, levelId)`, `unlockedLevels` | R8, R16 |
| `site/js/engine/level.js` | new: pure level state machine (`start`, `answer`, `openBreakdown`, `answerStep`), no DOM | R7, R8, R10 |
| `site/js/engine/input.js` | new: keyboard + invisible thumbstick → direction angle and "enter" events (DOM) | R6, R17 |
| `site/js/engine/scene.js` | new: canvas renderer, integer scaling, letterboxing, map tiles, nodes, path walk tween, level scene (cat vs foe), pounce animation | R4, R7 |
| `site/js/engine/sprites.js` | new: SNES-like palette, original 16×16 pixel art as row strings (tiles, cats × 2 frames × 4 directions, rat, fox, Salvia, key, lock) | R4 |
| `site/js/engine/dialog.js` | new: typewriter dialog box (skips on tap; instant when reduced motion) | R13, R17 |
| `site/js/ui/numpad.js` | new: on-screen pad + physical-keyboard mapping | R14 |
| `site/js/ui/screens.js` | new: start screen, map overlay (key counter, "Kommer snart" toast), level screen, breakdown dialog, camp screen | R7, R10, R13, R18 |
| `site/js/main.js` | new: boot, fetch `worlds/index.json` + world, load progress, error screen | R1, R16 |
| `site/index.html` | new: CSP meta, sections, `<canvas id="scene">`, module script `js/main.js` (relative) | R1, R3 |
| `site/css/game.css` | new: layout, pixel borders, numpad ≥ 48 px, "Gå in" ≥ 64 px, `touch-action: none` on the scene, reduced-motion rules, ≥ 20 px task text | R14, R17 |
| `site/worlds/index.json`, `site/worlds/kap1/world.json` | new: World 1 data (7 levels, camp, boss, paths, coordinates, 6 task slots) | R5, R19 |
| `tests/engine/*.test.js`, `tests/tasks/*.test.js`, `tests/ui/*.test.js` | new: unit tests (see *Tests*) | all |
| `tests/site/structure.test.js` | new: imports resolve, non-render modules import cleanly in Node, no player-facing literals outside `text-sv.js`, no `sources/` files or inline scripts/styles in `site/` | R3, R15, R20, R21 |
| `tests/site/worlds.test.js` | new: every `site/worlds/*/world.json` passes `validateWorld` | R21 |
| `scripts/verify.sh` | edit: add a `node --check` syntax pass over `site/js/**/*.js` before the tests | R21 |
| `.github/workflows/pages.yml` | new: job `verify` (checkout, setup-node 22, `./scripts/verify.sh`), then job `deploy` (`needs: verify`; configure-pages, upload-pages-artifact `path: site`, deploy-pages); triggers `push: main` + `workflow_dispatch` | R2 |
| `README.md`, `AGENTS.md` | edit: the stack is no longer "proposed"; add the live URL and the "Run locally" command | — |

Mapping notes:
- **Not unit tested:** DOM and canvas modules (`scene`, `sprites`, `input`, `dialog`, `numpad`,
  `screens`, `main`). They are kept thin, and they call the pure modules for all decisions.
- **Testable vs. not:** a module is testable unless it is one of these DOM/canvas modules.

## Work order
Each step ends with `./scripts/verify.sh` green, and a proposed commit `[0001-game-skeleton-and-hosting] <what>`.

1. **Foundations.**
   - Write the tests first: `tests/engine/rng.test.js`, `tests/engine/decimal.test.js`,
     `tests/ui/number-format.test.js` (AC10). Then add `rng.js`, `decimal.js` and `number-format.js`.
   - Add the `node --check` pass to `verify.sh`.
2. **Swedish text.** Add `text-sv.js` and `tests/ui/text-sv.test.js`: non-empty strings and the
   English-word blocklist (AC13, first half).
3. **Task generator.** Tests first, `tests/tasks/decimal-multiply.test.js` (AC7, AC9), then
   `decimal-multiply.js` and `tasks/index.js`.
   - The tests use 1000 seeds per slot spec, taken from a fixture identical to the 6 slots in the spec.
     For each slot they assert the sheet pattern: the whole-number set, and that the decimal factor has
     exactly one non-zero digit (or is `1,5` / `2,5` in slot 3). This keeps tasks "same vintage, not
     harder".
   - The independent oracle: the integer product of digit strings, with the comma placed by hand.
     It does not use `decimal.js`.
4. **Breakdown.** Tests first, `tests/tasks/breakdown.test.js` (AC8), then `breakdown.js`.
   - The split step offers 3 options: the right split, plus two plausible wrong ones, e.g.
     `1 + 5` and `0,1 + 0,5`.
5. **World data.**
   - Add `world.json`, `index.json` and `world.js`.
   - Add the tests in `tests/engine/world.test.js`:
     - validation errors, e.g. a missing `id`, `kind` or coordinates (AC16)
     - `neighbourInDirection` at the 8 main angles plus a no-path case on the real World 1 map (AC4)
     - the map counts in AC3
   - Add `tests/site/worlds.test.js`.
6. **Progress.** Tests first, `tests/engine/progress.test.js`, then `progress.js`. The tests cover:
   - corrupt JSON, wrong types, `version: 99`, and storage that throws (AC14)
   - key awarded once, and the next level unlocked (AC5)
   - `startUnlocked`
7. **Level state machine.** Tests first, `tests/engine/level.test.js`, then `level.js`. The tests
   cover:
   - 6 correct answers clear the level (AC5)
   - 2 wrong answers set `breakdownOffered` (AC6)
   - finishing the breakdown clears the task
   - invalid input does not count as a try
   - a step reveals its answer after 3 wrong tries (R10)
8. **Page shell.**
   - Add `index.html` (CSP), `game.css`, `main.js`, `numpad.js`, `dialog.js` and `screens.js`.
   - The start screen has: Spela, Fortsätt, Börja om with confirmation, 4 fur colours, and a name
     (AC15).
   - The level screen, the breakdown dialog and the camp screen are DOM only at first, before the art
     exists.
9. **Map and art.**
   - Add `sprites.js` and `scene.js`: the map, the walk tween, the bump, the lock toast, and the
     level scene with a foe and a pounce. Reduced motion skips the tweens.
   - Add `input.js`:
     - keyboard: arrows, WASD, Enter, Space
     - thumbstick: left half of the screen, 12 px dead zone, angle from the drag vector
     - "Gå in" button: shown only when `matchMedia('(pointer: coarse)')` matches
10. **Structure guard.** Add `tests/site/structure.test.js`:
    - imports resolve, and non-render modules import cleanly in Node (AC16)
    - no player-facing string literals outside `text-sv.js` (AC13, second half). The heuristic: a
      string literal containing å/ä/ö, or a capitalised multi-word phrase, is not allowed outside
      `text-sv.js`.
    - no `<script>` without `src`, no `style=` attribute, and no `sources/` files in `site/` (R3, R21)
11. **Deploy.** Add `.github/workflows/pages.yml`, and update `README.md` and `AGENTS.md`.
12. **Hand-off.**
    - Run `/verify` (the verifier plays it in a browser at 375×667 and 1024×768), then
      `/review-change`.
    - Write `review.md`.

## Tests (proof)
| AC | Proof |
|----|-------|
| AC1 | Workflow structure: `deploy` has `needs: verify`. **Manual:** after merge and push, the owner opens the Pages URL. |
| AC2 | `structure.test.js` (no absolute or external URLs in `site/`, CSP meta present). Verifier checks the browser console and network panel. |
| AC3 | `world.test.js`: 7 level nodes, 1 camp, 1 boss; 6 locked in a fresh state. Verifier checks screenshots at both viewports for no scrollbars. |
| AC4 | `world.test.js`: `neighbourInDirection`, plus locked-node blocking. Verifier: keyboard walk on desktop; thumbstick via touch emulation. |
| AC5 | `progress.test.js` + `level.test.js`: key once, next level unlocked, count `1/7`. |
| AC6 | `level.test.js`: breakdown offered after 2 wrong answers; finishing it clears the task. |
| AC7 | `decimal-multiply.test.js`: 6 slots × 1000 seeds, oracle comparison, ranges, determinism, no `e`/`000000` noise in formatted output. |
| AC8 | `breakdown.test.js`: both named examples, plus 1000 generated tasks (last step = answer; no help line contains its step's answer). |
| AC9 | `decimal-multiply.test.js`: the named `0,3 · 20` cases. |
| AC10 | `number-format.test.js`: every listed input, and `formatNumber`. |
| AC11 | `level.test.js` (camp practice mode: no key); camp examples come from the level specs (unit). Verifier plays "Visa mig hur". |
| AC12 | `game.css` sizes checked by the verifier in the browser; there is no `<input>` element on the task screen (structure test). Desktop keyboard-only run by the verifier. |
| AC13 | `text-sv.test.js` + `structure.test.js`. |
| AC14 | `progress.test.js`. |
| AC15 | `progress.test.js` (clear resets the state). Verifier exercises the start screen. |
| AC16 | `./scripts/verify.sh` + `structure.test.js` + `world.test.js` (removing a required field fails). |

## Risks and rollback
- **iPad Safari gestures fight the thumbstick** (scrolling, double-tap zoom, rubber-banding).
  - Mitigation: `touch-action: none` and `overscroll-behavior: none` on the game root, a
    `user-scalable=no` viewport, and `preventDefault` in pointer handlers.
  - The verifier tests with touch emulation. Owner check on the real iPad after deploy.
- **CSP `style-src 'self'` blocks inline style attributes.** Set dynamic sizes through CSSOM
  (`el.style.width = …`), which CSP allows, never through `setAttribute('style')`. Add this to *Known
  pitfalls* if it bites.
- **The pixel-art effort grows.** Keep sprites at 16×16 with simple shapes; the art can be polished
  in later changes. A plain-but-coherent look is acceptable for the PoC.
- **The heuristic string-literal check is noisy.** It can be tuned with an explicit allowlist array in
  the test. Do not weaken it by excluding whole files.
- **Pages misconfiguration** (Source not set to "GitHub Actions"): deploy fails, but nothing breaks.
  The owner fixes the setting and re-runs the workflow.
- **Rollback:** revert the merge commit. Pages redeploys the previous `site/`, or nothing on the first
  deploy. `localStorage` uses the versioned key `mattespel.v1`, so nothing persistent needs migrating.

## Verification
```bash
./scripts/verify.sh                                   # syntax + all unit/structure/world tests
python3 -m http.server -d site 8000                   # then open http://localhost:8000
```
Manual or verifier browser checklist:
- Fresh start → choose colour and name → map → walk to the camp by keyboard → "Visa mig hur" →
  back to the map.
- Walk to "Multiplikation med decimaltal" → clear 6 tasks, deliberately getting one wrong twice and
  using "Dela upp det" → key → "Nycklar: 1/7".
- Reload → "Fortsätt" keeps the progress. "Börja om" with confirmation resets it.
- Repeat the run at 375×667 with touch emulation: thumbstick, "Gå in", numpad. No scrollbars and no
  system keyboard.
- The console has no CSP errors, and the network panel shows only same-origin requests.

After merge:
- The owner sets Settings → Pages → Source = GitHub Actions.
- The workflow runs green.
- Open https://johanfredin.github.io/make-daughters-math-homework-great-again/ on the iPad.
