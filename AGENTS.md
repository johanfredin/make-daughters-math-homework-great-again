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
  - The level plays the sheet's **exact tasks, in sheet order** (owner, 0003): transcribed into
    `site/worlds/<world>/sheets/<level>.json`. No generated "similar" numbers.
  - A level is split into short **sections** (about 6–8 tasks, a/b/c groups kept together).
  - Every computable answer is re-checked by an independent oracle test (`tests/tasks/sheets-oracle.test.js`).
- **Keys:** a level's key comes once **2/3 of its tasks** are solved; "Hoppa över" skips a task.
  All keys in a world unlock the **final boss**.
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

## Stack (set by change 0001)
- **Static site, no backend.** Plain HTML + CSS + vanilla JavaScript (ES modules).
  - No framework and no build step, so the deployed files are the source files.
- **DOM for UI and tasks:** text, buttons and number input stay crisp, accessible and touch-friendly.
- **SVG / `<canvas>` for the world map and animations.**
- **Touch first, iPad + desktop:** must work well on an iPad (touch) and on a computer (mouse + keyboard).
  Phones are not a target (owner, 2026-10-08): do not spend effort on phone layouts.
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
| Test | `node --test 'tests/**/*.test.js'` |
| Run locally | `python3 -m http.server -d site 8000` → http://localhost:8000 (ES modules need http://, not file://) |
| Live | https://johanfredin.github.io/make-daughters-math-homework-great-again/ (deployed by `.github/workflows/pages.yml` on push to `main`) |
| Start a change | `./scripts/new-change.sh "short title"` |
| Approve an artifact (human) | `./scripts/approve.sh <id> <intent\|spec\|plan>` |

`scripts/verify.sh` is the single source of truth for "is this change done". Extend it as the stack grows.

## Architecture
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
    <world-id>/world.json   levels (sheet file + theme), boss config, helper camps
    <world-id>/sheets/*.json  one homework sheet per level: sections + tasks with answers
sources/<chapter>/     raw homework photos + inventory.md (input only, NEVER deployed)
tests/                 node --test, mirrors site/js/ (e.g. tests/tasks/decimal-multiply.test.js)
docs/                  SDLC artifacts (changes, lessons, templates)
```
- **Engine vs content:**
  - Adding a new world should only need a new `site/worlds/<id>/world.json`, plus new task types if
    the chapter brings new kinds of problems.
  - No world-specific code in the engine.
- **Answers** are checked exactly (`engine/rational.js`), never with floats (`0.1 + 0.2`).
- **New homework:** put the photos in `sources/<chapter>/`, transcribe each sheet to a sheet file
  (zoom into the photo where needed), and let the oracle test catch transcription errors.

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
- The photos in `sources/` are never copied into `site/`. Their *tasks* are transcribed into sheet
  files on the public site (owner, 0003).
- Claude may commit on `change/<id>` branches. It pushes only after asking the owner and getting a
  yes, and never force-pushes. Merging is the owner's.

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
- `node --test tests/` fails on Node 22 (a directory is not a test file). Use a glob: `node --test 'tests/**/*.test.js'`, or just `./scripts/verify.sh`.
- The CSP blocks inline styles: set dynamic sizes with `el.style.x = …` (CSSOM), never `setAttribute("style", …)` or `style=` in HTML.
- Player-facing text outside `site/js/ui/text-sv.js` fails `tests/site/structure.test.js`, and so does Swedish text in a JS *string*. Comments are fine.
