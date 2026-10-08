---
name: review-change
description: "SDLC stage 5 – review a change against REVIEW.md by a fresh-context reviewer subagent: /review-change [id]"
argument-hint: "[id]"
disable-model-invocation: true
---
Run the `reviewer` subagent (fresh context) on the change.

- Change id (optional): `$ARGUMENTS`.
- Give it:
  - the worktree path
  - the change id
  - the base branch to diff against
- If a change id is given, write its returned review to `docs/changes/<id>/review.md` using
  `docs/templates/review.md`. Otherwise, show the review here.
- Never merge as part of this.
