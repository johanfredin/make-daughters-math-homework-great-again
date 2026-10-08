---
name: intent
description: "SDLC stage 1 – capture or refine the intent for a change: /intent <id> <idea>"
argument-hint: <id> <short description>
disable-model-invocation: true
---
Create or refine the intent artifact for a change.

Arguments: `$ARGUMENTS`. The first word is the change id `<id>`; the rest is the raw idea from the owner.

1. Locate the change's worktree, `.worktrees/<id>/`.
   - If it does not exist, offer to run `./scripts/new-change.sh "<idea>"`.
   - Do all work inside the worktree.
2. If `docs/changes/<id>/intent.md` exists, read it and keep refining it instead of starting over.
   Otherwise, copy the structure of `docs/templates/intent.md`.
3. Explore the repo read-only to find the affected systems yourself, including the homework in
   `sources/` if relevant. Then interview the owner briefly: at most 5 sharp questions, one round at a
   time, in English. Ask about:
   - the problem
   - what she should experience
   - the constraints
4. Fill in the intent. Keep it to one page. Leave `status: draft`.
5. Commit it on `change/<id>` as `[<id>] intent`.
6. List the remaining open questions and tell the owner to run `./scripts/approve.sh <id> intent`
   (inside the worktree) when satisfied.

Do not write a spec or any code.
