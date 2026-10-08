@AGENTS.md

# Claude's role: SDLC pipeline driver

Claude is the only coding agent here. The owner (Johan) talks to Claude in English.
Everything the player sees is in Swedish.

The owner writes `intent.md`, or asks Claude to draft it with `/intent`. Claude does every later
stage, starting each one as soon as the stage before it is approved.

## Where changes live
- Each change gets a git worktree at `.worktrees/<id>/` on branch `change/<id>`, created with
  `./scripts/new-change.sh "title"` (the owner runs it, or Claude does when asked).
- Its artifacts are in `.worktrees/<id>/docs/changes/<id>/`. Do all work for a change inside its worktree.

## Watching for approvals
At the start of every session, without being asked, run `.claude/watch-sdlc.sh` as a background Bash
command (`run_in_background`, timeout 7200000). It exits with one line naming the next action:

| Output | Meaning | Do |
|--------|---------|----|
| `WRITE_SPEC <id>` | intent approved, no spec | Follow `.claude/skills/spec/SKILL.md` |
| `WRITE_PLAN <id>` | spec approved, no plan | Follow `.claude/skills/plan-change/SKILL.md` |
| `BUILD <id>` | plan approved, no review | Follow `.claude/skills/build/SKILL.md`, then verify and review |

After handling the action, or if the watcher times out, start the watcher again. It is stateless:
progress is read from the artifacts. To make it ignore a change, create `docs/changes/<id>/.claude-skip`.
Until an intent is approved, do nothing for that change unless asked.

## Writing artifacts
- Fill in each artifact completely from the approved stage before it.
- Base every claim about code on code you actually read, and cite `path:line`. Base every claim about
  homework content on the images in `sources/` (or their `inventory.md`).
- Put decisions that belong to the owner under *Policy concerns flagged* or *Open questions*. That
  includes pedagogy and game-feel choices, not only technical ones.
- New artifacts start with `status: draft`. Commit them on `change/<id>` as `[<id>] spec` or
  `[<id>] plan`, then tell the owner they are ready to approve.
- Claude commits freely, but **pushes only after asking** the owner (`git push` is an `ask`
  permission). It never force-pushes.

## Approval
- The owner approves with `./scripts/approve.sh <id> <stage>` (the watcher picks it up), or by telling
  Claude in chat to approve it.
- Only after an explicit chat instruction may Claude set `status: approved`. Record it as delegated:
  - `approved_by: Johan Fredin (delegated in chat <date>: "<quote>"; recorded by Claude)`
  - `approved_at`: the current ISO time.
  - Write all three fields in **one** edit, because the guardrail hook only lets an approval through
    when the same edit contains "delegated in chat".
  - Commit message: `[<id>] approve <stage> (approval delegated by owner, recorded by Claude)`.
- Never approve anything without that instruction.
- **Standing delegation (2026-10-08):** the owner said "you are allowed to approve all changes". Claude
  approves intent, spec and plan itself, recorded as delegated with that quote. Real owner decisions
  (pedagogy, game feel) still go to him as questions. Merging and pushing still need his yes.

## Verification budget
The owner finds long verification slow. Keep it proportionate:
- Run one verifier and one reviewer round (in parallel).
- Browser checks: iPad landscape (touch) plus desktop. Add portrait only when the layout changes.
- Re-check only what failed.

## Build, verify, review
1. Implement the approved plan only. Write tests with or before the code, and run `./scripts/verify.sh`
   after each step. If the plan is wrong, stop and propose an amendment.
2. Run separate subagents with fresh context, so they did not see the build:
   - `verifier` (`.claude/agents/verifier.md`):
     - runs `verify.sh`
     - maps each acceptance criterion to a test
     - looks for weakened tests
     - plays the game in a browser where it can
   - `reviewer` (`.claude/agents/reviewer.md`): reviews against `REVIEW.md` and gives a verdict.
3. Fix the findings, re-verify, and write `docs/changes/<id>/review.md` using `docs/templates/review.md`.
4. Leave merging and deploying to the owner unless they ask Claude to do it.
