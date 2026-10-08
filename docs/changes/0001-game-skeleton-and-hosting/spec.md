---
id: 0001-game-skeleton-and-hosting
stage: spec
status: approved
intent: docs/changes/0001-game-skeleton-and-hosting/intent.md
approved_by: Johan Fredin (delegated in chat 2026-10-08: "i approve the spec 0001"; recorded by Claude, with the owner's summary edits folded into R6/R13/AC4/AC11)
approved_at: 2026-10-08T15:16:57+02:00
---

# Spec: game skeleton and hosting

## Summary
A playable proof of concept, hosted on GitHub Pages, that shows the look and feel of the game.

**Look and feel**
- A 16-bit, *Super Mario Bros 3*-style world map for World 1.
- An original cast of forest cats, inspired by *Warrior Cats* but not copied from it.

**What she can do**
- **Walk the map.**
Either with the keyboard when on desktop or invisible on screen controls (think roblox on the ipad)
- **Play one level:** multiplying decimals, based on `sources/kap1/multiply-decimals.png`.
- **Earn a key.**
- **Visit one helper camp:** multiplication. There, a mentor cat walks her through problems like those on the level
 e.g `1,5 · 5` one step at a time, without giving away the answer.
- The same step-by-step breakdown is offered inside the level when she gets stuck.

**Engine foundations**
- World data in JSON.
- Seeded task generators.
- Exact decimal maths.
- Swedish number formatting and answer parsing.
- Saved progress.
- A test suite.

The remaining six levels of World 1, the other camps and the boss are change 0002.

## Requirements

### Hosting and stack
- **R1 Static site.**
  - The game lives in `site/`: plain HTML, CSS and JavaScript (ES modules).
  - No framework, no build step, no runtime third-party requests.
  - All internal URLs are relative, so it works under the Pages sub-path
    `/make-daughters-math-homework-great-again/` and on `localhost`.
- **R2 Deploy.**
  - A GitHub Actions workflow publishes `site/` to GitHub Pages on every push to `main`. It can also
    be run by hand.
  - It deploys only after `./scripts/verify.sh` passes in the same workflow.
- **R3 CSP.**
  - `index.html` sets a Content-Security-Policy meta tag:
    `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'`.
  - No inline scripts or styles.

### World map
- **R4 Rendering.**
  - The map is drawn on a `<canvas>` at a fixed low resolution (320×180), scaled up by whole numbers
    with `image-rendering: pixelated`, and letterboxed to fit any screen in portrait or landscape.
  - All art is original pixel art defined in code: palette plus pixel rows. There are no image files
    from third parties.
- **R5 Map content.** The data comes from `site/worlds/kap1/world.json`:
  - nodes for the 7 levels of World 1 (names from `sources/kap1/inventory.md`)
  - 1 helper camp
  - 1 boss lair
  - paths between them
  - In this change, only level "Multiplikation med decimaltal" and the camp are playable. The other 6
    levels show a lock and "Kommer snart" ("Coming soon") when tapped. The boss lair shows
    "Nycklar: n/7" ("Keys: n/7").
- **R6 Movement** (owner edit: "keyboard when on desktop or invisible on screen controls, think
  Roblox on the iPad").
  - **SMB3-style movement along paths.** Pushing a direction makes the cat walk along the path that
    best matches it (within 45°) to the next node, frame by frame.
    - If no path matches, the cat does a small bump and stays.
    - A locked node blocks the path: the cat stays, and "Kommer snart" is shown.
  - **Desktop:** the arrow keys or WASD give the direction; Enter or Space enters the current node.
  - **Touch: invisible thumbstick.**
    - Touching anywhere in the left half of the screen shows a faint thumbstick under the thumb.
      Dragging from that point gives the direction; releasing hides it.
    - A round, semi-transparent "Gå in" ("Enter") button, at least 64 px, sits bottom-right. It is
      shown only on touch devices.
    - No other controls are drawn on screen.
  - Reachable nodes: the camp (always), unlocked levels, and nodes already visited.
  - Choosing the direction is a pure function, `neighbourInDirection(world, nodeId, angle)`, so it
    can be tested.

### Level
- **R7 Level runner.**
  - A level is a sequence of 6 tasks from its task specs in `world.json`, shown in a DOM layer over
    the scene.
  - Each task is a "foe" (a rat or fox in pixel art) facing the player cat.
  - **Right answer:** the cat pounces, the foe runs off, and a progress pip fills.
  - **Wrong answer:** no damage and no lost lives. The game shows encouragement and a hint aimed at
    the task (R11).
  - **After the 2nd wrong try:** the game offers "Dela upp det" ("Break it down", R10), which opens the
    breakdown dialog for that very task. After she completes the breakdown, the task counts as
    cleared.
- **R8 Key and unlock.**
  - Clearing all 6 tasks awards the level's key, with a celebration. She then returns to the map.
  - The next level node is unlocked. In this change, that means it is marked unlocked in the data even
    though it is still "Kommer snart".
  - Replaying a cleared level gives no second key.

### Tasks and maths
- **R9 Task type `decimal-multiply`.**
  - Generates `a · b`, where `a` is a whole number and the other factor is a decimal (either order).
  - Parameters: ranges for the whole number, the number of decimals in the decimal (1–2), and whether
    the decimal is `< 1` or `≥ 1`.
  - The answer is exact: all maths uses scaled integers, never floating point.
  - With a seed, the generator is deterministic.
  - The level difficulty ramps up: tasks 1–2 are easier than the sheet (one decimal, whole number
    2–9), and tasks 5–6 match the sheet (e.g. `40 · 0,02`, `500 · 0,9`).
- **R10 Breakdown ("Dela upp det").** For a multiplication `decimal · whole`, a pure function returns
  an ordered list of steps using one of two strategies:
  - **Split strategy** (the decimal is `≥ 1` and not a whole number), e.g. `1,5 · 5`:
    1. Split `1,5` into `1 + 0,5`. She picks the split from 3 offered options.
    2. `1 · 5 = ?`
    3. `0,5 · 5 = ?`, with the hint "0,5 är en halv – vad är hälften av 5?" ("0,5 is a half – what is
       half of 5?").
    4. `5 + 2,5 = ?`
  - **Without-the-comma strategy** (the decimal is `< 1`), e.g. `0,04 · 6`:
    1. "Räkna utan kommat: 4 · 6 = ?" ("Calculate without the comma: 4 · 6 = ?")
    2. "Hur många decimaler hade 0,04?" ("How many decimals did 0,04 have?")
    3. "Sätt tillbaka kommat: 2 steg åt vänster i 24 → ?" ("Put the comma back: 2 places to the left
       in 24 → ?")
  - Each step has:
    - its own expected answer
    - one short helper line in Swedish that says *how* to think, never the result
    - a visual: place-value boxes (ental | tiondelar | hundradelar, i.e. ones | tenths | hundredths)
      showing the numbers
  - She cannot type past a step. A wrong answer in a step gets a gentler hint. After 3 wrong tries,
    the step shows its answer with an explanation and moves on.
  - The final step shows the whole calculation assembled.
- **R11 Hints.** The answer checker spots typical mistakes and returns a matching Swedish hint:
  - **Comma in the wrong place:** the digits are right but she is off by a factor of 10, 100 or 1000.
    Hint: "Kolla var kommat ska stå" ("Check where the comma goes").
  - **Added instead of multiplied:** "Det ska vara gånger, inte plus" ("It should be times, not plus").
  - **Anything else:** a generic encouraging line, picked at random from a short list.
- **R12 Swedish numbers.**
  - Formatting:
    - decimal comma
    - a space as the thousands separator (`1 000`)
    - `·` for multiplication
    - a real minus sign `−`
  - Answer parsing accepts:
    - `,` or `.`
    - spaces between digits
    - a leading `,` (`,5`)
    - trailing zeros (`2,50`)
    - `−` or `-`
  - Anything that is not a number gets the reply "Skriv ett tal" ("Write a number"), and that try is
    not counted.

### Helper camp
- **R13 Helper camp "Multiplikationslägret"** (the multiplication camp):
  - A mentor cat, Salvia, greets her in a 16-bit-style dialog box. Text appears letter by letter;
    a tap skips to the end of the line.
  - She can choose:
    - "Visa mig hur" ("Show me how"): the breakdown for `1,5 · 5`, with the split strategy.
    - "Ett till exempel" ("Another example"): a task generated from a random slot of the
      playable level's task specs. It uses whichever strategy R10 picks for it, so the examples look
      like the level (owner edit).
    - "Öva" ("Practise"): 3 practice tasks from the same level specs. No key, no penalty.
  - She can leave at any time with "Tillbaka till kartan" ("Back to the map").

### Input and UI
- **R14 Number pad.**
  - Tasks are answered with an on-screen pad: `7 8 9 / 4 5 6 / 1 2 3 / − 0 , / ⌫ OK`.
  - Buttons are at least 48×48 CSS px.
  - A physical keyboard works too (digits, `,`, `.`, `-`, Backspace, Enter).
  - The phone's own keyboard never opens.
- **R15 Swedish UI.**
  - Every string the player sees comes from one module, `site/js/ui/text-sv.js`.
  - None of those strings contains English UI words (e.g. "level", "boss", "score", "game over").
- **R16 Progress.**
  - Saved to `localStorage` under `mattespel.v1` after every cleared task. It holds the current node,
    the keys earned and the cleared levels.
  - When loaded, the data is checked. If it is invalid, broken or from an unknown version, it is
    replaced by a fresh state and a friendly message is shown. It never crashes.
  - If `localStorage` is unavailable, the game still works for the session.
- **R17 Touch and access.**
  - Works on a phone and a tablet, in portrait and landscape, without pinch-zoom.
  - Nothing relies on hover.
  - Respects `prefers-reduced-motion`: no walking animation, and no letter-by-letter text.
  - Task and dialog text uses a readable font of at least 20 px, so pixel styling never makes the
    maths hard to read.
- **R18 Start screen.**
  - A title screen with the game name and "Spela" ("Play"). If saved progress exists, it also offers
    "Fortsätt" ("Continue") and "Börja om" ("Start over"); "Börja om" asks for confirmation.
  - Here she can pick her cat's fur colour from 4 options and type a name. The name is kept only in
    `localStorage`.

### Engineering
- **R19 Engine and content separation.**
  - `site/js/engine/` contains no World 1 specifics. Names, nodes, coordinates and task specs all come
    from `world.json`.
  - `site/worlds/index.json` lists the worlds.
- **R20 Testable modules.**
  - Modules under `site/js/tasks/`, `site/js/engine/` (except rendering and DOM) and
    `site/js/ui/text-sv.js` do not touch `window` or `document` when imported.
  - Node imports them directly in the tests.
- **R21 Verify.** `./scripts/verify.sh` additionally:
  - validates every `world.json` against the rules in R5 and R19 (a node test)
  - checks that every relative `import` under `site/js` resolves to a file
  - fails if `site/` contains files from `sources/`

## Acceptance criteria

### Hosting
- **AC1 (R1, R2)**
  - Given a push to `main` with verify passing, when the workflow runs, then the game loads at
    `https://johanfredin.github.io/make-daughters-math-homework-great-again/`.
  - Given a failing verify, nothing is deployed.
- **AC2 (R1, R3)** Given the site is served, when it loads, then:
  - the browser makes no request outside its own origin
  - there are no CSP violations in the console

### Map and movement
- **AC3 (R4, R5)** Given a new game, when the map shows, then it has:
  - 7 level nodes, with 6 of them locked
  - the camp
  - a locked boss lair showing "Nycklar: 0/7"
  - It fits a 375×667 portrait and a 1024×768 landscape viewport with no scrollbars.
- **AC4 (R6)** Given the cat is on the start node:
  - When she pushes the direction of the camp (arrow key, or thumbstick drag on touch), the cat walks
    to it. Enter, or the "Gå in" button, opens the camp.
  - Pushing toward a locked level shows "Kommer snart" and the cat does not move.
  - Pushing a direction with no path makes the cat bump and stay.
  - On desktop, no thumbstick or "Gå in" button is drawn.
  - Unit tests: `neighbourInDirection` picks the right neighbour for the 8 main angles on the World 1
    map, and returns none when there is no path within 45°.

### Level and keys
- **AC5 (R7, R8)**
  - Given level "Multiplikation med decimaltal", when she answers all 6 tasks correctly, then:
    - a key is awarded
    - the map shows "Nycklar: 1/7"
    - the next level is marked unlocked in the progress data
  - Replaying the level leaves the count at 1/7.
- **AC6 (R7, R10)**
  - Given a task, when she answers wrong twice, then "Dela upp det" is offered.
  - Completing the breakdown clears the task.

### Tasks and maths
- **AC7 (R9)**
  - Given seeds 1–1000 for each slot in the level, every generated task:
    - has an answer equal to an independently computed exact product
    - formats with no floating-point noise
    - stays within its declared ranges
  - The same seed gives the same task.
- **AC8 (R10)**
  - `breakdown(1,5 · 5)` returns the split strategy with step answers `1 + 0,5`, `5`, `2,5`, `7,5`.
  - `breakdown(0,04 · 6)` returns the without-the-comma strategy with `24`, `2`, `0,24`.
  - For 1000 generated tasks, the last step's answer equals the task's answer, and no helper line
    contains its step's answer.
- **AC9 (R11)**
  - For `0,3 · 20`: the answer `60` or `0,6` gives the comma hint, `20,3` gives the "times, not plus"
    hint, and `6` is accepted as correct.
- **AC10 (R12)**
  - Each of `2,5`, `2.5`, `2,50` and ` 2,5 ` is accepted as 2,5.
  - `,5` is accepted as 0,5.
  - `-3` and `−3` are accepted as −3.
  - `abc` and the empty string are rejected without counting as a try.
  - `formatNumber(1000.5)` returns `1 000,5`.

### Camp, input and UI
- **AC11 (R13)**
  - Given the camp, when she picks "Visa mig hur", then the 4-step breakdown of `1,5 · 5` plays.
  - "Ett till exempel" and "Öva" use tasks generated from the level's own task specs.
  - "Öva" gives 3 tasks and no key.
- **AC12 (R14, R17)**
  - Given a touch device:
    - every button is at least 48 px
    - answering a task never opens the system keyboard
    - nothing needs hover
  - On a desktop, the keyboard alone can finish a level.
- **AC13 (R15)**
  - A test checks that all strings in `text-sv.js` are non-empty, and that none matches an English UI
    word blocklist.
  - A grep finds no player-facing string literals outside `text-sv.js` in `site/js/`.
- **AC14 (R16)**
  - Given corrupt JSON, wrong types, or `version: 99` in `mattespel.v1`, when the game loads, then it
    starts fresh with a message.
  - Given `localStorage` throws, the game is still playable.
- **AC15 (R18)** Given saved progress, the start screen shows "Fortsätt" and "Börja om". "Börja om"
  asks for confirmation and then clears the progress.

### Engineering
- **AC16 (R19, R20, R21)**
  - `./scripts/verify.sh` passes.
  - Importing every non-render module in Node does not throw.
  - Deleting a node's required field in `world.json` makes verify fail.

## Design

### Files
```
.github/workflows/pages.yml     verify → upload site/ → deploy (actions/configure-pages,
                                upload-pages-artifact, deploy-pages)
site/index.html                 one page; screens are DOM sections; one <canvas id="scene">
site/css/game.css               layout, pixel borders, number pad, dialog boxes, reduced-motion rules
site/js/main.js                 boot: load worlds, load progress, start screen
site/js/engine/
  rng.js                        mulberry32 seeded RNG
  decimal.js                    exact decimals as {n, scale}; mul, add, cmp, from/to string
  progress.js                   load/validate/save, unlock rules (pure + a thin storage adapter)
  world.js                      validate world.json, reachable nodes, paths
  level.js                      level state machine: task → tries → hint → breakdown → cleared
  scene.js                      canvas renderer (map, sprites, walk tween) — DOM/canvas, not unit tested
  sprites.js                    original pixel art: palettes + pixel-row strings (cats, foes, tiles)
  dialog.js                     typewriter dialog box (DOM)
site/js/tasks/
  decimal-multiply.js           generator + checker + mistake classifier
  breakdown.js                  breakdown(a, b) → steps
site/js/ui/
  text-sv.js                    all Swedish strings
  number-format.js              formatNumber / parseAnswer (Swedish)
  numpad.js                     on-screen number pad (DOM)
  screens.js                    start, map overlay, level, camp screens (DOM)
site/worlds/index.json
site/worlds/kap1/world.json
tests/…                         mirrors site/js
```

### Data model (`world.json`, abridged)
```json
{ "id": "kap1", "name": "Decimalskogen", "keysToBoss": 7,
  "nodes": [
    { "id": "start", "kind": "start", "x": 24, "y": 140 },
    { "id": "multiplikation", "kind": "level", "name": "Multiplikation med decimaltal",
      "source": "sources/kap1/multiply-decimals.png", "playable": true,
      "tasks": [ { "type": "decimal-multiply", "whole": [2, 9], "decimals": 1, "lt1": true }, … 6 total ] },
    { "id": "camp-mult", "kind": "camp", "name": "Multiplikationslägret", "camp": "multiplication" },
    { "id": "boss", "kind": "boss", "name": "Rävens lya" } ],
  "paths": [ ["start", "multiplikation"], … ] }
```
- **Coordinates** are in map pixels (320×180).
- **Unlocking:** the first level node is unlocked from the start; every other level node unlocks when
  the previous level in `nodes` order is cleared.

### Exact decimals
- A number is stored as `{ n, scale }`, meaning `n / 10^scale`. `n` is a safe integer; all ranges here
  are tiny.
- **Multiply:** multiply the `n` values and add the scales.
- **Formatting:** printed from `n` and `scale`, then normalised (trailing zeros dropped).
- Parsing and comparing go through the same type, so `0.1 + 0.2` never happens.

### Level flow
```
task → [answer]
   correct    → pounce animation → next
   wrong 1    → hint (classifier)
   wrong 2    → hint + "Dela upp det" button
   breakdown  → done → cleared
```
- After 6 tasks: key and celebration, then save and return to the map.
- Progress is saved after each task, so leaving halfway resumes at the same task index (with new
  numbers).

### Art direction
- **Palette:** a 32-colour, SNES-like palette — forest greens, warm browns, dusk sky.
- **Map tiles (16×16):** grass, path, trees, river, a rock den for the boss, a tent or fern bower for
  the camp. Level nodes are numbered stones.
- **Cats:** 16×16 sprites with 2 walking frames in 4 directions. The fur colour is swapped through the
  palette.
- **Foes:** a rat and a fox, 16×16.
- **Mentor (Salvia):** an old grey cat with a herb leaf.
- **Names:** all original. No *Warrior Cats* names, clans or places.

### Errors
- If world data fails to load, the game shows "Något gick fel när spelet laddades. Ladda om sidan."
  ("Something went wrong while loading the game. Reload the page."). Details go to the console only.

## Player-facing content (Swedish)
- **Game title (working):** "Kattklanens matteäventyr".
- **World 1:** "Decimalskogen".
- **Level nodes** (from `sources/kap1/inventory.md`):
  1. Räkna med decimaltal
  2. Multiplikation med decimaltal *(playable)*
  3. Blandad form och bråkform
  4. Hur räknar du? 1
  5. Hur räknar du? 2
  6. Repetition 1
  7. Repetition 2

  The order follows the inventory. The playable level is placed second, so in this change it starts
  unlocked as an exception: the flag `"startUnlocked": true` in its node.
- **Camp:** "Multiplikationslägret", with mentor "Salvia".
- **Boss lair:** "Rävens lya".
- **Sample lines** (all of them live in `text-sv.js`):

  | Swedish (shown in game) | English (for reading only) |
  |---|---|
  | "Hej, lärling! Ska vi knäcka gångertal med decimaler tillsammans?" | "Hi, apprentice! Shall we crack decimal multiplication together?" |
  | "Nästan! Kolla var kommat ska stå." | "Almost! Check where the comma goes." |
  | "Det ska vara gånger, inte plus." | "It should be times, not plus." |
  | "Snyggt!" / "Klockrent!" / "Där satt den!" | "Nice!" / "Spot on!" / "Nailed it!" |
  | "Du fick en nyckel! 🔑" | "You got a key! 🔑" |
  | "Vill du dela upp det i mindre steg?" | "Do you want to break it into smaller steps?" |

  Final wording is reviewed against the `kid-math-pedagogy` skill.
- **Level tasks** (`decimal-multiply`, 6 slots):

  | Slot | Whole number | Decimal | Example |
  |---|---|---|---|
  | 1 | 2–9 | one decimal, < 1 | `3 · 0,7` |
  | 2 | 2–9 | one decimal, ≥ 1 | `1,5 · 4` |
  | 3 | 2–9 | two decimals, < 1 | `6 · 0,04` |
  | 4 | 10–90 (tens) | one decimal | `0,3 · 20` |
  | 5 | 10–90 (tens) | two decimals | `40 · 0,02` |
  | 6 | 100–500 (hundreds) | one decimal | `500 · 0,9` |

  This matches `sources/kap1/multiply-decimals.png` (e.g. `25 · 0,01`, `0,3 · 200`).
  - **Breakdown for slots 4–6:** the without-the-comma strategy covers them (e.g. `0,3 · 20` →
    `3 · 20 = 60` → 1 decimal → `6`). The split strategy is used only when the decimal is ≥ 1.

## Alternatives considered
- **Phaser or another game framework:** a stronger engine for platformer action, but an extra ~1 MB
  dependency, a framework to learn, and a weaker fit for crisp DOM text and number input. The map and
  scenes here are simple enough for a hand-written canvas. We can revisit if later changes need real
  physics.
- **All-canvas UI, including tasks:** gives a uniform pixel look, but loses crisp text, accessibility
  and easy touch layout. Rejected: maths readability comes first.
- **Pages from a `/docs` folder or a `gh-pages` branch:** `docs/` is already used for SDLC artifacts,
  and a branch needs a manual push step. An Actions workflow gates deployment on verify.
- **Floating point with rounding:** risks off-by-epsilon judging (`0,1 · 3`). Scaled integers are exact
  and simple at these sizes.
- **Pixel web font (e.g. vendored "Press Start 2P", OFL):** looks nice, but is hard to read for maths,
  and it is uncertain whether it covers å/ä/ö. It could be used for titles only, in a later change.

## Policy concerns flagged
1. **GitHub Pages setup (owner):** the repo must be public with Pages source set to "GitHub Actions"
   (Settings → Pages). The workflow uses official `actions/*` actions pinned to major versions; that is
   the only third-party code, and it runs in CI only (security-baseline rule 6).
2. **Her name (security-baseline rule 1):** the name she types stays in `localStorage` on her device
   only. Suggest she uses a nickname. Nothing is sent anywhere.
3. **Warrior Cats IP:** characters, names and places are original. Only the theme (forest cats,
   apprentices, mentors) is borrowed. Please confirm you are happy with "Kattklanens matteäventyr" as
   a title, since "klan" nods to the books without copying them.
4. **Pedagogy:** after 3 wrong tries a breakdown step reveals its answer, so she never gets stuck.
   Owner to confirm this is preferred over "keep trying".
5. **Answer forms:** trailing zeros (`2,50`) are accepted. Later rounding tasks will need stricter
   checking per task type.

## Decisions log
- **2026-10-08 Claude:** proof-of-concept scope = full map visible, 1 playable level, 1 camp. The
  intent asks for "the game world… look and feel" plus the problem-breakdown idea; the other levels,
  camps and the boss are change 0002.
- **2026-10-08 Claude:** the playable level is multiplication with decimals, because it matches the
  intent's `1,5 · 5` example and her weak spot.
- **2026-10-08 Claude:** the hosting target is GitHub Pages. The owner said the repo can be public
  (chat, 2026-10-08).
- **2026-10-08 Claude:** a fixed 320×180 internal resolution: 16:9, scales by whole numbers to common
  screens, and is SNES-like.
- **2026-10-08 Claude:** no sound in this change.
- **2026-10-08 Owner (spec edit):**
  - Map movement uses the keyboard on desktop and an invisible Roblox-style thumbstick on the iPad,
    replacing tap-on-a-node (R6, AC4).
  - Camp examples are like the level's tasks (R13, AC11).
  - Claude folded these summary edits into the requirements when recording the approval.
- **2026-10-08:** the main touch device is assumed to be an iPad (from the owner's Roblox reference).
  Letterboxing is enough for portrait in this change.
- **2026-10-08 Owner (approved spec as-is):** the policy concerns stand with their proposed
  defaults: the title "Kattklanens matteäventyr", choosing name and colour included, and a step
  revealing its answer after 3 tries.

## Open questions
1. Game title and cat names: do you or she want to rename them later? This is easy to change in
   `text-sv.js`.
