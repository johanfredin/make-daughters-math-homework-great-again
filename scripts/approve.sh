#!/usr/bin/env bash
# Human approval gate for SDLC artifacts. Claude is blocked from running this (guardrail hook + interactive tty check).
#   ./scripts/approve.sh <id> <intent|spec|plan>          approve an artifact
#   ./scripts/approve.sh --check <id> <intent|spec|plan>  print APPROVED / NOT APPROVED (read-only, agents may use)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

check=0
if [[ ${1:-} == --check ]]; then check=1; shift; fi
id=${1:?usage: approve.sh [--check] <id> <intent|spec|plan>}
stage=${2:?usage: approve.sh [--check] <id> <intent|spec|plan>}
[[ $stage =~ ^(intent|spec|plan)$ ]] || { echo "stage must be intent, spec or plan" >&2; exit 2; }
file="docs/changes/$id/$stage.md"

if [[ $check == 1 ]]; then
  if [[ -f $file ]] && grep -qE '^status:[[:space:]]*approved' "$file"; then echo APPROVED; else echo "NOT APPROVED ($file)"; fi
  exit 0
fi

[[ -f $file ]] || { echo "no such artifact: $file" >&2; exit 1; }
[[ -t 0 ]] || { echo "approve.sh must be run interactively by a human" >&2; exit 1; }

case $stage in
  spec) prev=intent ;;
  plan) prev=spec ;;
  *) prev= ;;
esac
if [[ -n $prev ]] && ! grep -qE '^status:[[:space:]]*approved' "docs/changes/$id/$prev.md" 2>/dev/null; then
  echo "cannot approve $stage: $prev is not approved" >&2; exit 1
fi

${PAGER:-less} "$file"
read -r -p "Approve $file? [y/N] " ok
[[ $ok == [yY] ]] || { echo "not approved"; exit 1; }

who=$(git config user.name || whoami)
when=$(date -Iseconds)
sed -i -E \
  -e "0,/^status:.*/s//status: approved/" \
  -e "0,/^approved_by:.*/s//approved_by: $who/" \
  -e "0,/^approved_at:.*/s//approved_at: $when/" \
  "$file"
git add "$file"
git commit -q -m "[$id] approve $stage" -- "$file"
echo "approved and committed $file"
