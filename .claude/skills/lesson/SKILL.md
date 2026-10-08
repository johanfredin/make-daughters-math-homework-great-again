---
name: lesson
description: "SDLC stage 6 – record a lesson / post-mortem and feed it back: /lesson <slug> <what happened>"
argument-hint: <slug> <what happened>
disable-model-invocation: true
---
Record a lesson learned as `docs/lessons/<slug>.md`. Arguments: `$ARGUMENTS`.

Sections:
- what happened
- impact (on the code, or on the player: was she confused, bored or frustrated?)
- root cause
- how it was detected
- fix
- prevention

Then propose concrete prevention, choosing from:
- a line for *Known pitfalls* in `AGENTS.md`
- a new or updated skill
- a guardrail in the hook
- a test

If a code fix is needed, draft a new change intent so it re-enters the loop.

Show the owner the proposals. Do not apply changes to `AGENTS.md`, the skills or the hook yourself
until the owner says so.
