#!/usr/bin/env bash
# Claude's SDLC watcher (see CLAUDE.md). Polls .worktrees/<id>/docs/changes/<id>/ and exits with the
# next action for the first change that needs one, which wakes the Claude session that started it:
#   WRITE_SPEC <id>   intent approved, no spec.md yet
#   WRITE_PLAN <id>   spec approved, no plan.md yet
#   BUILD <id>        plan approved, no review.md yet
# Stateless: progress is read from the artifacts themselves. Ignore a change by touching
# docs/changes/<id>/.claude-skip in its worktree.
ROOT=$(git -C "$(dirname "$0")" rev-parse --path-format=absolute --git-common-dir)/..
interval=${1:-20}
while true; do
  for wt in "$ROOT"/.worktrees/*/; do
    id=$(basename "$wt"); d="$wt/docs/changes/$id"
    [[ -d $d && ! -e $d/.claude-skip ]] || continue
    ok() { [[ "$(cd "$wt" && ./scripts/approve.sh --check "$id" "$1")" == APPROVED ]]; }
    if ok plan && [[ ! -f $d/review.md ]]; then echo "BUILD $id"; exit 0; fi
    if ok spec && [[ ! -f $d/plan.md ]]; then echo "WRITE_PLAN $id"; exit 0; fi
    if ok intent && [[ ! -f $d/spec.md ]]; then echo "WRITE_SPEC $id"; exit 0; fi
  done
  sleep "$interval"
done
