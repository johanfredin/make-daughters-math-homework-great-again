---
id: 0003-numbers-from-files
stage: spec
status: approved
intent: docs/changes/0003-numbers-from-files/intent.md
approved_by: Johan Fredin (delegated in chat 2026-10-08: "You are free to review and approve your own changes for this intent."; recorded by Claude)
approved_at: 2026-10-08T17:41:10+02:00
---

# Spec: numbers from files

## Summary
- **Every level plays the homework sheet's own tasks**, with the same numbers in the same order.
  They come from data files instead of being generated. All **7 sheets of kap1** become playable.
- **Sections:** each level is split into short sections ("Del 1", "Del 2", …).
- **Key rule:** the level's key is earned once **2/3 of its tasks** are solved. She can skip a task and
  come back to it later.
- **Themes:** each level gets its own colour theme.
- **Sound:** sound effects for a right answer, beating the enemy, and earning a key.

## Requirements

### Tasks from files
- **R1** Each level's tasks are listed in `site/worlds/kap1/sheets/<level-id>.json`, transcribed from
  `sources/kap1/<sheet>.png`, in sheet order, with the sheet's own labels (`1a`, `1b`, …).
  - Each task has an `id` (the sheet label), a `kind`, the shown text, and the correct answer.
- **R2 Task kinds,** enough for every task on the 7 sheets:

  | Kind | Shown | Answer | Used for |
  |---|---|---|---|
  | `number` | an expression or question, e.g. `0,7 + 0,5`, "Avrunda 7,9 till heltal" | a number (decimal or negative) | most tasks |
  | `fraction` | e.g. `3/5 + 4/5` as stacked fractions | a numerator over a shown denominator (`? / 5`) | sheet 3 (mixed form), sheet 7 tasks 6a–c |
  | `choice` | a question plus 2–4 options (A/B/C, or numbers) | one option | "Hur räknar du?" 1 and 2, largest/smallest, "Vilket svar är bäst?" |
  | `estimate` | "Beräkna med överslag" (estimate) + an expression | a range (accepted if within ±15 % of the exact value) | sheet 6 task 15 |
  | `numberline` | a number line from 0 to 1,1 with one marked arrow | the number at the arrow | sheet 7 task 12 |

- **R3 Answers are checked by tests**, not just trusted. For every `number`, `fraction` and `estimate`
  task whose text is an arithmetic expression, a test computes the answer independently with exact
  rationals and compares it with the file. A transcription error fails `verify.sh`.
- **R4 "Dela upp det" stays** where an existing strategy fits: decimal · whole number (units or split),
  via `decimal-multiply`'s breakdown. Other tasks show no button. The generated-task code and its
  tests are removed; the owner said generating similar numbers "was a bad idea".

### Sections and keys
- **R5 Sections.** A level's tasks are split into sections that follow the sheet's own numbering:
  about 6–8 tasks each, never splitting an `a/b/c` group.
  - Entering a level shows a section list: "Del 1: 1–4", with solved/total, e.g. "5/8 lösta".
  - A section plays its tasks in order.
- **R6 Solving and skipping.** A task counts as solved when she answers it correctly, directly or by
  finishing "Dela upp det".
  - "Hoppa över" (Skip) moves on without solving. Skipped and unsolved tasks can be played again by
    re-entering the section, which plays only its unsolved tasks.
  - Solved tasks are saved per level.
- **R7 Key.** The key is awarded once the number of solved tasks in a level is at least ⌈2/3 · total⌉.
  - The section list shows progress toward it: "Lösta: 18/40 – 27 ger nyckeln" ("Solved: 18/40 – 27
    gets the key").
  - The boss still needs 7 keys.
- **R8 Old saves keep working.**
  - Existing keys are kept: a level cleared in 0001/0002 keeps its key.
  - The new `solved` field is optional, so old saves validate, and old code ignores it if the change
    is rolled back.

### Look and sound
- **R9 Themes.** Each level has a `theme` in `world.json`:
  - skog (forest), strand (beach), snö (snow), höst (autumn), natt (night), öken (desert), grotta (cave).
  - The theme sets the level scene's sky, ground and tree colours, plus the stone colour on the map.
  - All palettes are drawn with the existing pixel art; no new image files.
- **R10 Sound effects**, synthesised with the Web Audio API (no audio files, no dependencies):
  - a short "pling" for a right answer
  - a pounce "swoosh" when the enemy flees
  - a fanfare for a key
  - a soft, non-punishing low blip for a wrong answer
  - A "Ljud på/av" (sound on/off) button in the top bar, saved on the device.
  - Audio starts on her first tap or keypress, as iPad Safari requires.
  - `prefers-reduced-motion` does not mute sound; sound has its own toggle.
- **R11 Effects for a right answer:** a burst of pixel sparkles over the enemy (skipped with reduced
  motion), in addition to the pounce.

## Acceptance criteria
- **AC1 (R1, R3)**
  - All 7 sheets are transcribed: 32 + 40 + 5 + 8 + 8 + 38 + 39 = **170 tasks**, each with its sheet
    label.
  - On sheets 6 and 7, each "largest and smallest" row becomes two `choice` tasks (`4 störst`,
    `4 minst`).
  - The oracle test agrees with every arithmetic answer.
  - The number-line answers are 0,03 / 0,18 / 0,35 / 0,76 / 0,82 / 1,04, read from a zoomed crop of
    the photo.
- **AC2 (R2)** Each kind renders and accepts its answer on iPad and desktop:
  - `fraction` takes the numerator
  - `choice` takes a tap
  - `estimate` accepts 140 for `71,5 + 28,8 + 42,5`
  - `numberline` accepts `0,35` for arrow c
- **AC3 (R5–R7)**
  - Solving ⌈2/3⌉ of a level gives the key once; skipping works; unsolved tasks come back.
  - The counts are right in the section list.
  - Unit tests cover the section split and the key rule.
- **AC4 (R8)** A 0002 save with a cleared `multiplikation` loads with 1 key and no reset message.
- **AC5 (R9–R11)** Each level shows its theme. Sounds play after the first interaction, the toggle
  persists, and nothing plays when sound is off.
- **AC6** `verify.sh` passes. Removed tests are only those for the removed generator.

## Design

**Data**
- `site/worlds/kap1/world.json` levels get `"sheet": "sheets/<id>.json"` and `"theme"`.
- `world.js` validation checks the sheet file's schema when loading, in `main.js` and in a test.
- Sheet file:
  ```json
  { "sections": [[ "1a", "1b", "2a", "2b" ], …],
    "tasks": [ { "id": "1a", "kind": "number", "text": "0,7 + 0,5", "answer": "1,2" }, … ] }
  ```

**Maths**
- `engine/rational.js`: exact `{num, den}` with BigInt-free safe integers (the sheets' sizes are small).
  It parses decimals and fractions.
- Answers are compared as rationals, so `1,5`, `15/10` and `3/2` are equal where a `fraction` or
  `number` task allows it.

**Tasks**
- `tasks/fixed.js`, one type for all file tasks: `check`, plus `breakdown` when the text is
  `decimal · whole` (delegating to `tasks/breakdown.js`).
- The hints are the same as today: the comma hint for ×10/100/1000 errors, plus a generic hint.

**Levels**
- `engine/level.js` runs a list of fixed tasks: one section, unsolved only, with skip.
- Rewards come from the solved count.
- `progress.js` adds `solved: {levelId: [ids]}`.
- `clearLevel` becomes `awardKeyIfEarned`.

**UI**
- `screens.js` adds:
  - a section list
  - a "Hoppa över" button
  - `choice`, `fraction` and `numberline` task views (DOM; the number line is an SVG drawn from data)
- The number pad needs no `/` key: fraction tasks ask only for the numerator over a shown
  denominator.

**Look and sound**
- `scene.js` takes a theme palette.
- `engine/sound.js` is a Web Audio synth with no assets.
- `engine/effects.js` holds the sparkle particles.

**Camp**
- The camp's "Ett till exempel" (another example) and "Öva" (practise) use the multiplication level's
  file tasks that have a breakdown.
- Its demo `1,5 · 5` stays.

## Policy concerns flagged
1. **Copyright / public site.**
   - Transcribing the worksheets puts the textbook's tasks, including word problems and names, on the
     public site. Until now, `security-baseline` rule 3 kept transcribed sheets out of `site/`.
   - The owner asked for exactly this, and said earlier that the repo can be public.
   - The rule will be updated to "exact homework tasks are allowed (owner, 2026-10-08)".
   - The owner may want to keep the repo or site private later.
2. **2/3 rule:** skipping lets her collect a key without the hardest third. That is what the owner
   asked for.
3. **Sound:** the default is **on**. The toggle sits in the top bar.

## Decisions log
- **2026-10-08 Owner (intent):** exact numbers, in order; sections; 2/3 of tasks for the key; themes;
  sound effects for winning and right answers.
- **2026-10-08 Owner:** Claude may review and approve its own changes for this intent.
- **2026-10-08 Claude:**
  - Each a/b/c group stays together in one section.
  - "Dela upp det" is only for decimal · whole for now; more strategies can come later.
  - `estimate` accepts ±15 %.
  - Number-line values were read from a zoomed crop.

## Open questions
None blocking.
