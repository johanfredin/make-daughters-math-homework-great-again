---
name: verify
description: "SDLC stage 4 – independent verification of the current work by a fresh-context subagent: /verify [id]"
argument-hint: "[id]"
disable-model-invocation: true
---
Run the `verifier` subagent (fresh context; it must not see the build conversation) on the current
work.

- Change id (optional): `$ARGUMENTS`.
- Give it:
  - the worktree path
  - the change id
  - the base branch to diff against
- Do not give it your own opinion of the code.

Relay its verdict and evidence to the owner in enough detail that failures are actionable.
