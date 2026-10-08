---
name: spec
description: "SDLC stage 2 – requirements + design from an approved intent: /spec <id>"
argument-hint: <id>
disable-model-invocation: true
---
Produce `docs/changes/<id>/spec.md` for change `$ARGUMENTS`, working in `.worktrees/<id>/`.

1. Run `./scripts/approve.sh --check <id> intent`. If it does not print `APPROVED`, stop and say the
   intent must be approved first.
2. Read the intent and the code and content it touches, read-only. Use the `researcher` subagent for
   broad searches. For game content, look at the actual sheets in `sources/` and their `inventory.md`.
3. Load the skills that apply. `security-baseline` always applies. `kid-math-pedagogy` applies to
   anything the player sees or any task type.
4. Write the spec using the structure of `docs/templates/spec.md`:
   - numbered, testable requirements
   - acceptance criteria mapped to requirements
   - design
   - alternatives considered
   - *Policy concerns flagged*, for anything the owner must decide
5. Record what you assumed in the decisions log. Leave `status: draft`.
6. Commit it as `[<id>] spec` and tell the owner to run `./scripts/approve.sh <id> spec`.

Do not write a plan or any code.
