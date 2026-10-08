---
id: 0002-unlocked-maps-and-faster-help
stage: spec
status: approved
intent: docs/changes/0002-unlocked-maps-and-faster-help/intent.md
approved_by: Johan Fredin
approved_at: 2026-10-08T16:37:35+02:00
---

# Spec: unlocked maps and faster help

## Summary
Three changes, based on how she actually played the first version:

1. **Open map.**
   - Every level is open from the start. Only the boss's den stays locked until she has all the keys.
   - Levels that aren't built yet no longer block the path. She can walk past them; going in says
     "Kommer snart" ("Coming soon").
2. **Help from the first second.**
   - "Dela upp det" ("Break it down") is on screen for every task, before any wrong answer.
   - Hints after a wrong answer stay as they are.
3. **A new way to explain decimals.** It replaces "count the decimals and move the comma n steps to
   the left", which confused her. The idea is "count in tenths and hundredths, then check that the
   answer is the right size": the decimal becomes a quantity of a unit she can count, and the comma
   placement is decided by how big the answer should be, not by counting steps.

## Requirements

### Map
- **R1 All levels open.**
  - Level nodes are never locked by order. There is no unlocking chain any more.
  - A playable level can be entered at once.
  - A level that isn't built yet (`"playable": false`) shows a "Kommer snart" sign instead of a lock.
    Going in shows "Kommer snart".
  - Code today: the chain lives in `progress.js:94-95` (`isUnlocked`) and `progress.js:110-118`
    (`clearLevel` unlocks the next level). The `startUnlocked` flag is in `world.json:14`.
- **R2 Nothing blocks walking.**
  - The cat may walk onto and past every node, including unbuilt levels and the boss's den.
  - Only *going in* is gated: an unbuilt level shows "Kommer snart"; the den with too few keys shows
    the existing "Lyan är låst…" ("The den is locked…") message.
  - Today `blockedReason` stops the walk (`progress.js:106`), so the playable level could only be
    reached through the camp.
- **R3 The boss stays locked** until she has `keysToBoss` keys, with the lock and the "n/7" label
  unchanged.
- **R4 Old saves keep working.**
  - A version-1 save from change 0001 still loads, with the same keys and the same position.
  - The `unlocked` field in old saves is accepted and ignored. Progress is not reset.

### Help
- **R5 "Dela upp det" is always there.**
  - For any task whose type offers a breakdown, the button shows from the start of the task.
  - It is no longer tied to two wrong answers (`level.js:13`, `level.js:36`).
  - Finishing the breakdown still clears the task (unchanged).
- **R6 Hints unchanged.** A wrong answer still shows the targeted hint: the comma hint, the "times,
  not plus" hint, or a generic one. Invalid input still doesn't count as a try.

### New explanation ("räkna i tiondelar och hundradelar": counting in tenths and hundredths)
- **R7 The units strategy** replaces the without-the-comma strategy (`breakdown.js:39`) for decimals
  below 1. Examples:

  | Task | Step 1 (number) | Step 2 (number) | Step 3 (choose) |
  |---|---|---|---|
  | `0,3 · 20` | "Hur många tiondelar är 0,3?" → **3** | "3 tiondelar · 20 = ? tiondelar" → **60** | "60 tiondelar, vilket tal är det?" options **0,6 / 6 / 60** → **6** |
  | `6 · 0,04` | "Hur många hundradelar är 0,04?" → **4** | "4 hundradelar · 6 = ? hundradelar" → **24** | "24 hundradelar, vilket tal är det?" options **0,024 / 0,24 / 2,4** → **0,24** |

  The step prompts in English:
  - Step 1: "How many tenths (hundredths) is 0,3?"
  - Step 2: "3 tenths · 20 = ? tenths"
  - Step 3: "60 tenths, which number is that?"

  Rules for the steps:
  - **Unit:** tenths for `0,d` and hundredths for `0,0d`.
  - **Step 2** is exactly one times-table fact (the sheet patterns guarantee this).
  - **Step 3 options:** the right answer plus the same digits with the comma one place to each side.
    They are shown in size order, so the correct one is not always in the same place.
  - **Step 3 help line** ("hur stort ska svaret vara?", how big should the answer be):
    - tenths: "10 tiondelar är 1 hel. Hur många hela blir 60 tiondelar?" ("10 tenths is 1 whole. How
      many wholes do 60 tenths make?")
    - hundredths: "100 hundradelar är 1 hel. Blir 24 hundradelar mer eller mindre än 1?" ("100
      hundredths is 1 whole. Are 24 hundredths more or less than 1?")
    - The help never contains the answer (AC8 of change 0001 still applies).
- **R7b Step 1 points at the place-value boxes.** Step 1's visual is the decimal in the place-value
  boxes (as in 0001). Its help names the column ("första rutan efter kommat", the first box after the
  comma) and asks which digit is there.
- **R8 Size picture in step 3.**
  - Next to the options, a bar of 10 boxes shows "10 tiondelar = 1 hel" ("10 tenths = 1 whole"), or
    "100 hundradelar = 1 hel" ("100 hundredths = 1 whole") as 10 boxes of 10.
  - It shows how many wholes fit, without giving the digits of the answer.
- **R9 The split strategy stays** for `1,5` / `2,5` (`1,5 · 5`: split into `1 + 0,5`, then the half).
  The owner's complaint was about moving the comma, not about the split.
- **R10 Old strings removed.** The strings for moving the comma (`text-sv.js:65-70`) are replaced by
  the units strings. Nothing on screen tells her to "move the comma n steps" any more.
- **R11 Camp.**
  - "Visa mig hur" ("Show me how") stays `1,5 · 5` (split strategy).
  - "Ett till exempel" ("Another example") picks from the level's slots, so the units strategy shows
    up there too.

## Acceptance criteria

### Map
- **AC1 (R1, R3)** Given a fresh game, then:
  - no level node has a lock
  - the 6 unbuilt levels show "Kommer snart"
  - the den has a lock and "0/7"
- **AC2 (R1, R2)** Given the cat on the start node, when she walks right, then:
  - the cat walks onto "Räkna med decimaltal" (unbuilt). Going in shows "Kommer snart".
  - From there she can walk up to "Multiplikation med decimaltal" and go in.
- **AC3 (R2, R3)** Given 0 keys:
  - the cat can walk to the den
  - going in shows "Lyan är låst. Du behöver 7 nycklar och har 0."
- **AC4 (R4)** Given a save from change 0001 with `unlocked: ["blandad-form"]` and 1 key, when the game
  loads, then:
  - it continues with 1 key at the same node
  - there is no reset message

### Help
- **AC5 (R5)** Given any task in the level or in camp practice, before any answer, then "Dela upp det"
  is visible and opens the breakdown.
- **AC6 (R6)** The 0001 hint tests still pass unchanged.

### New explanation
- **AC7 (R7)**
  - `breakdown(0,3 · 20)` gives the units strategy with answers `3`, `60`, `6` (choice).
  - `breakdown(0,04 · 6)` gives `4`, `24`, `0,24` (choice).
  - For 1000 generated tasks per slot:
    - the last step's answer equals the task's answer
    - step 2 is a single times-table fact (`d · n` with `d` 1–9, and `n` one digit followed by zeros)
    - the 3 options are distinct and contain the answer exactly once
    - no help line contains its step's answer
- **AC8 (R10)** No string in `text-sv.js` mentions moving the comma "steg åt vänster" (steps to the left)
  or counting decimals. Checked by a test.
- **AC9 (R8, R11)** In the browser, the step-3 bar is visible. "Ett till exempel" in the camp can show a
  units breakdown.

All 0001 acceptance criteria that this change doesn't alter still hold: verify.sh passes and the
structure tests pass.

## Design

**`progress.js`**
- `isUnlocked` is removed.
- `isLocked(node)` becomes:
  - level → `!node.playable`, shown as "Kommer snart" rather than a lock
  - boss → `keys < keysToBoss`
- `blockedReason` is renamed `enterReason(node)` and used only by `onEnter`.
- `clearLevel` stops writing `unlocked`.
- `validate` still accepts `unlocked` for old saves and drops it from the returned state. The
  version stays 1.

**`world.js`**
- `tryMove` no longer takes a block callback. It returns `{ move }` or `{ bump }`.
- `startUnlocked` is removed from `world.json` and is ignored if present.

**`main.js`**
- `onEnter` asks `enterReason` and shows "Kommer snart" or "Lyan är låst…".
- `onDirection` only moves or bumps.

**`scene.js`** draws unbuilt levels as a grey stone with a small sign post instead of the padlock. The
padlock is kept only for the den.

**`level.js`**
- `breakdownOffered` is true from `withTask` whenever `hasBreakdown(task)`.
- `OFFER_BREAKDOWN_AFTER` is removed.
- `answerTask` keeps its `offerBreakdown` result for the UI, now always true when one is available.

**`breakdown.js`**
- `unitsStrategy(d, w)` replaces `noCommaStrategy`.
- The unit is `10^-decimals(d)`: tenths or hundredths.
- The choice options come from `shift(answer, ±1)`, sorted ascending; `answerIndex` is wherever the
  answer lands.
- Step 3 has `visual: []` plus `bar: { unit: "tiondelar" | "hundradelar" }` for R8.
- `strategy` is `"units"`.

**`screens.js`**
- `breakdownPanel` renders `step.bar` as the 10-box bar for R8, built with `h()` and CSS only.
- The task panel always renders the "Dela upp det" button when `offerBreakdown` is set.

**`text-sv.js`** gets the units strings (sample lines below), and the comma-moving strings are deleted.

## Player-facing content (Swedish)
| Swedish (shown in game) | English (for reading only) |
|---|---|
| "Hur många tiondelar är 0,3?" / "Hur många hundradelar är 0,04?" | "How many tenths is 0,3?" / "How many hundredths is 0,04?" |
| Help 1 (tenths): "Första rutan efter kommat är tiondelar. Vilken siffra står där?" | "The first box after the comma is tenths. Which digit is there?" |
| Help 1 (hundredths): "Andra rutan efter kommat är hundradelar. Vilken siffra står där?" | "The second box after the comma is hundredths. Which digit is there?" |
| "3 tiondelar · 20 = ? tiondelar" | "3 tenths · 20 = ? tenths" |
| Help 2: "Räkna som vanligt, men med tiondelar i stället för hela." | "Count as usual, but with tenths instead of wholes." |
| "60 tiondelar, vilket tal är det?" | "60 tenths, which number is that?" |
| Help 3: "10 tiondelar är 1 hel. Hur många hela blir 60 tiondelar?" | "10 tenths is 1 whole. How many wholes do 60 tenths make?" |
| Bar label: "10 tiondelar = 1 hel" | "10 tenths = 1 whole" |

## Alternatives considered
- **Keep moving the comma, explained better.** This is the method she already found confusing, and it
  is an abstract rule with no meaning she can check.
- **Estimation only:** "0,4 is almost a half, so the answer is about half of 3." This is good for
  checking, but hard for `0,04` ("much less than a tenth"). We use it as the step-3 help line, not as
  the whole method.
- **Money:** "0,3 kr = 30 öre". This is concrete, but öre are gone from daily life, and hundredths of a
  kilo or a metre would mix in units. Tenths and hundredths are the textbook's own words (*tiondel*,
  *hundradel* on `repeat-chap-1-1.png`).
- **Show the help after one wrong answer instead of always.** Faster than today, but the owner asked
  for "right away".

## Policy concerns flagged
1. **Always-visible help:**
   - She could open "Dela upp det" for every task. That still practises the method, because she
     types each step, and it clears the task the same way.
   - Owner to confirm there should be no limit.
2. **Choice in step 3:** with 3 options she could guess. A wrong choice gives the size hint, and 3
   wrong tries reveal the answer, as today. Owner to confirm a choice is better than typing here.
3. **Unbuilt levels on the map:** walkable with "Kommer snart" signs. The alternative is hiding them
   until they're built, which would make the map look empty. Kept visible as a preview.
4. **No unlocking at all:** keys only matter for the boss now, so playing levels in order is not
   encouraged. That matches the intent.

## Decisions log
- **2026-10-08 Owner (intent):** unlock everything except the boss; help right away; find a clearer
  explanation than moving the comma.
- **2026-10-08 Claude:** chose "count in tenths and hundredths" plus a size check, for the reasons
  under *Alternatives*. The split strategy stays.
- **2026-10-08 Claude:** keep save version 1, accept and ignore `unlocked`, so her progress survives
  this update.
- **2026-10-08 Owner (chat, after review; amends R7, R8 and adds R12):** the reviewer found that step 3
  for hundredths could only be solved by counting decimals, and that the options could have up to
  4 decimals. The owner chose:
  1. **Hundredths, step 3 = column picture.**
     - Each option is the digits of the count (e.g. 24, or 60) placed in the place-value boxes, ending in
       a different column. The hundredths box is highlighted.
     - Help: "Hundradelar står i andra rutan efter kommat. Sista siffran i 24 ska stå där." ("Hundredths
       are in the second box after the comma. The last digit of 24 must be there.")
     - Options: answer, ×10 and ×100 (`0,24 / 2,4 / 24`; for 60 hundredths `0,6 / 6 / 60`).
     - The 10×10 bar is dropped for hundredths (R8 now covers tenths only).
  2. **Options = likely mistakes**, never more than 2 decimals (like the sheet), in size order.
     - Tenths: ÷10, answer, ×10 (`0,6 / 6 / 60`). The ×10 option is the count she forgot to turn back
       into a number.
     - Hundredths: answer, ×10, ×100 (`0,24 / 2,4 / 24`).
     - So the position depends on the unit (tenths: middle, hundredths: first).
  3. **R12 (new), walking:** the cat stops on every stone, and each push walks one stone. A push made
     while the cat is still walking is remembered and done on arrival, so input is never lost. Key
     auto-repeat does not walk.
- **2026-10-08 Claude (review, recorded):**
  - Tenths step-3 help is worded "Tio tiondelar blir en hel. Hur många hela blir 60 tiondelar?",
    with numbers in words so a digit can't give away an answer of 1.
  - When the answer *is* 1 (`0,5 · 2`), the tenths help and bar state it outright. This is accepted
    as scaffolding (reviewer: minor).
  - The split strategy is now used only for halves (`n,5`); any other decimal ≥ 1 uses units.
  - Saves keep an always-empty `unlocked` array for rollback safety (plan *Risks*).
  - `bar` is the unit key string `"tenths"`.

## Open questions
1. Should the hint after a wrong answer also *point at* the "Dela upp det" button, for example with a
   gentle pulse? Default: no, the button is always visible anyway.
