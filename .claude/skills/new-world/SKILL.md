---
name: new-world
description: "Turn a new set of homework/test photos into a world: inventory the sheets and draft the change intent. /new-world <sources/chapter-dir>"
argument-hint: <sources/chapter-dir>
disable-model-invocation: true
---
The owner has put photos of new homework or test material in `$ARGUMENTS` (e.g. `sources/kap2/`).

1. Look at every image in that directory. Write `<dir>/inventory.md`, following the format of
   `sources/kap1/inventory.md`. For each sheet, in reading order, record:
   - the file name
   - the Swedish title
   - the skills practised
   - the task types: map each one to an existing generator under `site/js/tasks/` if there is one;
     otherwise mark it **NEW**
   - number ranges and difficulty, with 2–3 representative examples
   - anything the photo makes unclear
2. Suggest the world layout:
   - one level per sheet, with a Swedish level name and 5–8 tasks per level
   - which helper camps the world needs (multiplication, division, addition/subtraction, plus any
     topic-specific camp)
   - what the boss challenge mixes
3. Run `./scripts/new-change.sh "world <chapter>"`. Then fill in the change's `intent.md` from the
   inventory, as in `/intent`, listing new task types as affected systems.
4. Commit and tell the owner the intent is ready to approve. Do not write a spec or code.

Never copy the photos into `site/`. Tasks are re-created with fresh numbers, not transcribed.
