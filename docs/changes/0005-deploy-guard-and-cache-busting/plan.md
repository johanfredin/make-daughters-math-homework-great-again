---
id: 0005-deploy-guard-and-cache-busting
stage: plan
status: approved
spec: docs/changes/0005-deploy-guard-and-cache-busting/spec.md
approved_by: Johan Fredin (delegated in chat 2026-10-08: "you are allowed to approve all changes"; recorded by Claude)
approved_at: 2026-10-08T21:10:37+02:00
---

# Plan: deploy guard and cache busting

1. Add `tests/engine/version.test.js` and `site/js/engine/version.js` (`withSearch`, `versioned`).
   Make `main.js` `fetchJson` use `versioned`. (AC3)
2. Add `tests/site/stamp.test.js`, then `scripts/stamp-version.mjs`:
   - `stampSite(dir, version)`
   - a CLI entry point
   - it throws when an `index.html` reference is missing. (AC1, AC2)
3. Workflow:
   - Build job: `setup-node`, then the stamp step before upload.
   - Deploy job: the main-tip guard step before `deploy-pages`.
   - Add `tests/site/workflow.test.js`. (AC4)
4. AGENTS.md:
   - Note that the deploy stamps `?v=` and refuses old commits.
   - Add a pitfall: new relative imports must use double quotes and static `import … from "./x.js"`,
     or they stay unstamped.
5. `./scripts/verify.sh`. A stamped temp copy is checked in headless Chrome (muted) by the verifier,
   with the reviewer running in parallel. (AC5)

Risk: a module imported both stamped and unstamped would load twice and split state. Step 2's
"no unstamped relative import remains" assertion covers this.
