---
id: 0005-deploy-guard-and-cache-busting
stage: spec
status: draft
intent: docs/changes/0005-deploy-guard-and-cache-busting/intent.md
approved_by:
approved_at:
---

# Spec: deploy guard and cache busting

## Summary
1. The deploy job refuses to publish a commit that is no longer the tip of `main`.
2. The build job stamps `?v=<short sha>` onto every file the page loads.

## Requirements
- **R1** The `deploy` job in `.github/workflows/pages.yml` checks `git ls-remote` for the current
  `refs/heads/main` before `deploy-pages`. If it differs from `$GITHUB_SHA`, it fails with an
  `::error::` naming both commits, and nothing is deployed.
  - The guard sits in the deploy job, not in the build job, because GitHub can re-run a single job;
    a re-run of only `deploy` reuses the old artifact.
- **R2** A script `scripts/stamp-version.mjs <siteDir> <version>` rewrites the copy that gets uploaded:
  - In `index.html`: `css/game.css` → `css/game.css?v=<version>` and `js/main.js` → `js/main.js?v=<version>`.
  - In every `*.js` under `<siteDir>/js`, it stamps every static relative import specifier
    (`from "./x.js"`, `from "../x.js"`, `import "./x.js"`).
  - Every module is then loaded under one versioned URL, so no module is loaded twice and no old and
    new modules are mixed.
- **R3** The build job runs the stamp script on the checked-out `site/` before `upload-pages-artifact`,
  with the first 7 characters of `$GITHUB_SHA`. The repo's source files are never stamped, so local
  development is unchanged.
- **R4** JSON data (the world index, world.json and sheets) is fetched with the same `?v=` query as
  the module that fetches it (`new URL(import.meta.url).search`). There is no query when running
  locally.
- **R5** The stamp script fails (non-zero exit) when `index.html` lacks either reference it must stamp,
  so a renamed file can't silently ship unstamped.

## Acceptance criteria
- **AC1 (R2, R5)** When a temp copy of `site/` is stamped with `abc1234`, `index.html` references
  `css/game.css?v=abc1234` and `js/main.js?v=abc1234`, and every relative import in every JS file ends
  in `.js?v=abc1234`. No unstamped relative import remains. Non-import text such as
  `{ className: "pv-from" }, h(` is unchanged. — `tests/site/stamp.test.js`
- **AC2 (R5)** Stamping a directory whose `index.html` lacks `js/main.js` throws. — same test file
- **AC3 (R4)** `withSearch(url, "?v=x")` returns the URL with that query, and `withSearch(url, "")`
  returns it unchanged. `main.js` fetches through `versioned()`. — `tests/engine/version.test.js`
- **AC4 (R1, R3)** The workflow's deploy job contains the guard before `deploy-pages`, and the build job
  runs the stamp script before upload. — `tests/site/workflow.test.js` (text check)
- **AC5 (R2–R4)** A stamped copy served over HTTP boots in headless Chrome. The network log shows only
  `?v=` URLs for css, js and json, and there are no console errors. — verifier (browser)

## Design
- `scripts/stamp-version.mjs` exports `stampSite(dir, version)` and also works as a CLI.
  - It uses a regex on `(from|import)\s*"(\.{1,2}/[^"]+\.js)"`. The codebase uses double quotes and
    has no dynamic `import()` (checked with grep: `site/js` has no `import(`).
- `site/js/engine/version.js` provides:
  - `withSearch(url, search)`: pure.
  - `versioned(url)`: uses `new URL(import.meta.url).search`. Because `version.js` is itself imported
    through a stamped URL, its own `import.meta.url` carries `?v=`.
- `main.js` `fetchJson` (`site/js/main.js:565`) fetches `versioned(url)`.
  - URLs for sheets are resolved from the unversioned `indexUrl`/`worldUrl` and only versioned at fetch
    time, so the relative resolution stays the same.
- Workflow:
  - The build job adds `setup-node@v5` and `node scripts/stamp-version.mjs site "${GITHUB_SHA::7}"`.
  - The deploy job adds a guard step that runs before `deploy-pages`.

## Player-facing content
None.

## Alternatives considered
- **A service worker:** too heavy, and out of scope.
- **Guarding in the build job:** this misses single-job re-runs.
- **Stamping only `main.js`:** its imports would still be cached under old URLs.

## Policy concerns flagged
None. No new runtime dependencies and no third-party requests. The guard calls github.com from CI only.

## Decisions log
- 2026-10-08: the owner said "sure" to doing the deploy guard and cache busting as a small change.

## Open questions
None.
