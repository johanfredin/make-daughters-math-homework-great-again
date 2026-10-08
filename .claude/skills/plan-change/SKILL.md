---
name: plan-change
description: "SDLC stage 3a – implementation plan from an approved spec: /plan-change <id>"
argument-hint: <id>
disable-model-invocation: true
---
Produce `docs/changes/<id>/plan.md` for change `$ARGUMENTS`, working in `.worktrees/<id>/`.

1. Run `./scripts/approve.sh --check <id> spec`. If it does not print `APPROVED`, stop and say the
   spec must be approved first.
2. Read `spec.md` and explore the code it touches, read-only. Use the `researcher` subagent for broad
   searches.
3. Write the plan using the structure of `docs/templates/plan.md`:
   - every file to change, mapped to a requirement
   - a work order of small steps
   - the tests that prove each acceptance criterion
   - risks and rollback
   - exact verification commands, including how to see it in a browser
4. Any new dependency, external service or hosting change must be justified in the plan
   (see `security-baseline`).
5. Leave `status: draft`. Commit it as `[<id>] plan`. Expect the owner to interrogate it: answer
   questions and amend the plan.
6. Tell the owner to run `./scripts/approve.sh <id> plan` when satisfied.

Do not write any code.
