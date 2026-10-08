# AGENTS.md

Context for every coding-agent session in this repo (Claude Code reads it via `CLAUDE.md`).
Keep it short, factual and current. When an agent makes the same mistake twice, add a line under *Known pitfalls*.

## Project
**Mattematiskt äventyr** (working title): a browser game that turns a 7th-grader's math homework and
test material into a playful journey, so practising feels like playing, not like homework.

- The player is the owner's daughter (7th grade, Swedish school). She finds math hard and does not
  like it. Her weak spots are multiplication and division, which makes the new topics hard.
- **Everything the player sees is in Swedish.** Code, comments, commits and docs are in English.
- Re-usable: every new homework set or test becomes a new **world**. The engine stays the same.

## Game concept
- **World map** in the style of *Super Mario Bros 3*: worlds made of levels connected by paths.
- **One world per chapter or test.** World 1 = `sources/kap1/` (decimals, fractions, rounding, negative numbers).
- **One level per homework sheet** (each image in `sources/<chapter>/`).
  - A level has a *small* number of tasks: about 5–8, never the whole sheet.
  - Tasks are of the *same type* as the sheet, with fresh numbers (`12 + 11` may become `13 + 9`).
- **Keys:** clearing a level gives a key. All keys in a world unlock the **final boss**.
  - The boss is a last mixed challenge.
  - Beating it shows a summary of everything she cleared in the world.
- **Helper camps** (like the animal buddies in *Donkey Kong Country*): optional stops on the map.
  - They give visual, step-by-step help with multiplication, division, addition and subtraction,
    and with what the world needs (e.g. decimals, fractions).
  - They are always available, with no penalty for using them.
- Tone:
  - Encouraging and never punishing: no timers by default and no "game over".
  - Mistakes give a hint and another try.
  - Short sessions should feel complete.

## Stack (proposed — to be confirmed in the spec of change 0001)
- **Static site, no backend.** Plain HTML + CSS + vanilla JavaScript (ES modules).
  - No framework and no build step, so the deployed files are the source files.
- **DOM for UI and tasks:** text, buttons and number input stay crisp, accessible and touch-friendly.
- **SVG / `<canvas>` for the world map and animations.**
- **Touch first:** must work well on a tablet or phone, as well as with a mouse and keyboard.
- **Progress** is saved in `localStorage` on her device. No accounts and no server.
- **Hosting:** GitHub Pages from this public repo, serving `site/`. She just opens a link; there is no
  file to send around. Change 0001 sets up the deploy.
- **Tests:** Node's built-in test runner (`node --test`), no npm dependencies, for pure logic:
  task generators, answer checking, progress and unlock rules, and world data validation.
  - Browser end-to-end tests (e.g. Playwright) only if a spec justifies the dependency.

## Commands
| Purpose | Command |
|---------|---------|
| Verify everything (use this) | `./scripts/verify.sh` |
| Test | `node --test tests/` |
| Run locally | `python3 -m http.server -d site 8000` → http://localhost:8000 (ES modules need http://, not file://) |
| Start a change | `./scripts/new-change.sh "short title"` |
| Approve an artifact (human) | `./scripts/approve.sh <id> <intent\|spec\|plan>` |

`scripts/verify.sh` is the single source of truth for "is this change done". Extend it as the stack grows.

## Architecture (target — refined by change specs)
```
site/                  deployed as-is (static hosting root)
  index.html
  css/
  js/
    engine/            generic game: world map, level runner, helper camps, keys, boss, progress
    tasks/             task generators + answer checkers, one module per task type (pure, testable)
    ui/                Swedish UI text, components (number pad, fraction visual, number line)
  worlds/
    index.json         list of worlds in journey order
    <world-id>/world.json   levels → task specs (type + parameters), boss config, helper camps
sources/<chapter>/     raw homework photos + inventory.md (input only, NEVER deployed)
tests/                 node --test, mirrors site/js/ (e.g. tests/tasks/decimal-multiply.test.js)
docs/                  SDLC artifacts (changes, lessons, templates)
```
- **Engine vs content:**
  - Adding a new world should only need a new `site/worlds/<id>/world.json`, plus new task types if
    the chapter brings new kinds of problems.
  - No world-specific code in the engine.
- **Task generators:** pure functions `(params, rng) → { prompt, answer, ... }`.
  - The random number generator is seeded, so tests can be deterministic.
  - Generated numbers must stay "nice": the answer must be exact in decimals, with no
    floating-point noise (`0.1 + 0.2`). Do decimal math on scaled integers.

## Conventions
- Small, focused commits whose message references the change id, e.g. `[0003] add rounding task type`.
- **Swedish math notation in the UI:**
  - Decimal comma: `0,75`.
  - Multiplication dot `·` (not `*` or `x`).
  - Division as a fraction or `/`.
  - Thousands separated by a space: `23 460`.
  - Accept both `,` and `.` when she types an answer.
- Kid-facing copy follows the `kid-math-pedagogy` skill.
- No secrets in the repo, no tracking or analytics, no third-party scripts at runtime unless a spec
  approves it.
- The photos in `sources/` are input for content design, not game assets. They may be public in the
  repo, but are not copied into `site/`.
- The owner makes commits himself for now. Claude stages and proposes a commit message, but does not
  run `git commit` unless asked.

## SDLC workflow (AI-native)
Every non-trivial change goes through `docs/changes/<id>/`, in its own worktree `.worktrees/<id>/`
on branch `change/<id>`:

1. `intent.md` — owner writes it, or `/intent <id> <idea>` — **human approves**.
2. `spec.md`   — `/spec <id>` — **human approves**.
3. `plan.md`   — `/plan-change <id>` — **human approves**.
4. Build       — `/build <id>` — implement the approved plan only.
5. Verify      — `/verify <id>` — independent verifier subagent; loop until `./scripts/verify.sh` passes.
6. Review      — `/review-change <id>` — reviewer subagent against `REVIEW.md`; human merges.
7. Lessons     — `/lesson <slug> <what happened>` — feed mistakes back into this file and the skills.

For new homework: `/new-world <sources/chapter-dir>` creates `sources/<chapter>/inventory.md` and a
draft intent for the new world.

Rules for agents:
- **Never** set `status: approved` in any artifact on your own. Only humans approve
  (`./scripts/approve.sh`), or the owner delegates it explicitly in chat (see `CLAUDE.md`).
- Do not start a stage unless the previous artifact is `status: approved`.
- Do not implement anything not in the approved plan. If the plan is wrong, stop and propose an amendment.
- Never weaken, skip or delete tests to make them pass. Fix the code, or stop and explain.
- Do not edit `.claude/settings.json`, `.claude/hooks/`, `REVIEW.md`, `scripts/approve.sh` or the
  photos in `sources/`. They are protected by a hook.
- Before claiming done, run `./scripts/verify.sh` and include its result.

## Known pitfalls
- (none yet)
