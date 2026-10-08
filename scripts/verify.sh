#!/usr/bin/env bash
# Single entry point for "is this change done?". Claude, the verifier subagent and humans run this; CI will too.
# Extend it as the stack grows (change 0001 sets up the real game skeleton).
set -euo pipefail
cd "$(dirname "$0")/.."

fail() { echo "VERIFY: FAIL - $*" >&2; exit 1; }

command -v node >/dev/null || fail "node (>= 22) is required"

echo "==> guard: no homework photos or secrets in the deployed site"
if [[ -d site ]]; then
    leaked=$(find site -type f \( -iname '*.heic' -o -path '*/sources/*' -o -name '.env*' \) | head -5)
    [[ -z $leaked ]] || fail "files that must not be deployed: $leaked"
fi

echo "==> unit tests"
mapfile -t tests < <(find tests -type f \( -name '*.test.js' -o -name '*.test.mjs' \) 2>/dev/null | sort)
if (( ${#tests[@]} == 0 )); then
    echo "(no tests yet)"
else
    node --test "${tests[@]}"
fi

echo "VERIFY: PASS"
