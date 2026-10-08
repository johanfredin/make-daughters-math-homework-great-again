#!/usr/bin/env bash
# Start a new change in its own git worktree with a seeded intent.md.
#   ./scripts/new-change.sh "short title of the change"
# Base branch: $SDLC_BASE, or the branch currently checked out in the main tree.
set -euo pipefail
main_root=$(git rev-parse --path-format=absolute --git-common-dir)/..
main_root=$(cd "$main_root" && pwd)
cd "$main_root"
title=${1:?usage: new-change.sh "short title"}

git rev-parse --verify -q HEAD >/dev/null || { echo "make an initial commit first" >&2; exit 1; }
base=${SDLC_BASE:-$(git symbolic-ref --short HEAD)}

slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-|-$//g' | cut -c1-40)
last=$( { ls docs/changes 2>/dev/null; ls .worktrees 2>/dev/null;
          git branch --list 'change/*' --format='%(refname:short)' | sed 's#change/##'; } \
        | grep -oE '^[0-9]{4}' | sort -n | tail -1 || true)
num=$(printf '%04d' $((10#${last:-0} + 1)))
id="$num-$slug"
wt="$main_root/.worktrees/$id"

git worktree add -q -b "change/$id" "$wt" "$base"
mkdir -p "$wt/docs/changes/$id"
sed -e "s/CHANGE_ID/$id/g" -e "s/^# Intent: TITLE/# Intent: $title/" -e "s/^owner:.*/owner: $(git config user.name || whoami)/" \
  docs/templates/intent.md > "$wt/docs/changes/$id/intent.md"

echo "Created $id on branch change/$id (from $base)"
echo "  intent: $wt/docs/changes/$id/intent.md"
echo "Fill it in yourself, or ask Claude:  /intent $id $title"
echo "Then approve:  ./scripts/approve.sh $id intent   (run inside the worktree)"
