# make-daughters-math-homework-great-again

A Swedish math adventure game built from real homework. Each homework set or test becomes a world,
each worksheet a level. Clear levels to collect keys, use helper camps for visual help, and beat the
boss at the end of the world.

Built with an AI-native SDLC driven by Claude Code. See `AGENTS.md` (project context) and `CLAUDE.md`
(how Claude drives the pipeline).

**Play:** https://johanfredin.github.io/make-daughters-math-homework-great-again/

## Quick start
```bash
./scripts/verify.sh                          # is everything green?
python3 -m http.server -d site 8000          # play locally at http://localhost:8000
```

## Workflow
```bash
./scripts/new-change.sh "short title"        # new worktree .worktrees/<id>/ + seeded intent.md
# write the intent yourself, or in Claude:  /intent <id> <idea>
./scripts/approve.sh <id> intent             # inside the worktree; Claude's watcher picks it up
#   Claude writes spec.md   -> ./scripts/approve.sh <id> spec
#   Claude writes plan.md   -> ./scripts/approve.sh <id> plan
#   Claude builds, verifies (verifier subagent) and reviews (reviewer subagent) -> review.md
# you merge
```

### New homework or test
1. Put the photos in `sources/<chapter>/` (e.g. `sources/kap2/`).
2. In Claude: `/new-world sources/kap2`. It inventories the sheets and drafts the intent for the new world.
3. Approve, and follow the normal flow.

## Layout
| Path | What |
|------|------|
| `AGENTS.md`, `CLAUDE.md` | Project context and Claude's role |
| `REVIEW.md` | Review policy (protected) |
| `.claude/skills/` | Slash commands: `/intent` `/spec` `/plan-change` `/build` `/verify` `/review-change` `/lesson` `/new-world`, plus policy skills |
| `.claude/agents/` | Subagents: `researcher`, `verifier`, `reviewer` |
| `.claude/hooks/guardrails.mjs` | Blocks self-approval, edits to protected files, skipped tests, `--no-verify` |
| `docs/templates/`, `docs/changes/`, `docs/lessons/` | SDLC artifacts |
| `scripts/` | `verify.sh`, `approve.sh` (human only), `new-change.sh` |
| `sources/` | Homework photos + `inventory.md` per chapter (never deployed) |
| `site/` | The game (static, deployed as-is to GitHub Pages) |
| `.github/workflows/pages.yml` | Verify, then deploy `site/` on every push to `main` |
