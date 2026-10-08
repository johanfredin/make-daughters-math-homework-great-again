---
id: 0005-deploy-guard-and-cache-busting
stage: review
verdict: MERGE            # after fixing the reviewer's two minors and the nits
reviewed_at: 2026-10-08T21:15:58+02:00
---

# Review: deploy guard and cache busting

## Verification
- `./scripts/verify.sh`: **VERIFY: PASS**, 129 tests, 0 failing (after the fixes).
- **Verifier: PASS.**
  - Each of AC1–AC4 was mutation-checked: removing the behaviour makes its test fail.
  - AC5 was run in headless Chrome (muted) on a stamped copy, at iPad landscape (1180x820, touch) and
    desktop (1440x900):
    - The game boots, and entering "Räkna med decimaltal" loads the level.
    - All 37 css/js/json requests end in `?v=abc1234`: 1 css, 27 js, 9 json.
    - No path is requested twice, and there are no console errors.
    - The unstamped `site/` still boots locally with no `?v=`.
- **Guard dry-run against the real repo:**
  - An old commit as `GITHUB_SHA` exits 1 with the `::error::` message.
  - The tip of main exits 0.

## Acceptance criteria coverage
| Criterion | Test | Status |
|-----------|------|--------|
| AC1 every reference and import stamped, other text untouched | tests/site/stamp.test.js | pass |
| AC2 missing index.html reference throws | tests/site/stamp.test.js | pass |
| AC3 withSearch / main fetches via versioned() | tests/engine/version.test.js | pass |
| AC4 guard before deploy-pages, stamp before upload | tests/site/workflow.test.js | pass |
| AC5 stamped site boots, only versioned requests | verifier (browser) | pass |

## Findings
Format: severity, pass, file, problem, fix.

- **minor**, correctness, AGENTS.md:
  - Problem: it claimed that a release "never mixes" old and new files, but `index.html` is not
    versioned and can be cached for about 10 minutes.
  - Fixed: the remaining window is now documented, and a reload fixes it.
- **minor**, tests, tests/site/stamp.test.js:
  - Problem: a future dynamic `import()` or a single-quoted import would stay unstamped, so a module
    could load twice and split its state.
  - Fixed: a new test forbids them. It was mutation-checked with three variants, all caught, and is
    anchored to import/export lines so comments don't trip it.
- **nit**, tests:
  - Problem: the "odd version" test ran against the real `site/`.
  - Fixed: it now runs on a temp copy.
- **nit**, maintainability, AGENTS.md:
  - Problem: the docs didn't say that a run overtaken by a newer push also goes red.
  - Fixed: this is now documented as expected.
- **nit**, scripts/stamp-version.mjs:
  - Problem: it escaped only the first dot.
  - Fixed: it now uses `replaceAll`.
- **nit**, workflow:
  - Problem: `git ls-remote` runs without credentials, so it only works while the repo is public.
  - Accepted: the repo is public, and if it ever goes private the guard fails closed.

## Deviations from plan
None.

## How to try it
- Locally, nothing changes: `python3 -m http.server -d site 8000`.
- After the merge, each deploy's requests carry `?v=<sha7>`.
- A re-run of an old Actions run fails at "Refuse to deploy anything but the tip of main", and the
  live site is left untouched.
