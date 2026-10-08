---
id: 0005-deploy-guard-and-cache-busting
stage: intent
status: approved
owner: Johan Fredin
approved_by: Johan Fredin (delegated in chat 2026-10-08: "sure" to "Want me to do those as a small change?"; recorded by Claude)
approved_at: 2026-10-08T21:08:03+02:00
---

# Intent: deploy guard and cache busting

## Problem
1. **Re-running an old deploy run rolls the live site back.**
   - At 19:01 a re-run of the first deploy run (for commit `ff8c2d8`, change 0001) replaced the 0004
     site with the 0001 version.
   - The GitHub UI makes this easy to do by mistake: "Re-run" sounds like "rebuild", but it deploys
     that run's old files.
2. **After a deploy, the browser keeps old files for up to 10 minutes.** Safari on the iPad can keep
   them longer. A half-updated cache (new data, old code) can even show the error screen.

## Proposed outcome
- A deploy run only publishes if its commit is still the latest commit on `main`. Otherwise it fails
  with a clear message, and the live site is left alone.
- Each deploy stamps a version on every file the page loads: the stylesheet, the scripts and the
  world/sheet data. A new release then reaches her the next time the page itself is loaded, with no
  hard reload and no mixed old and new files.

## Player experience
None directly. She always gets the newest version, and never a broken mix of old and new.

## Affected systems
`.github/workflows/pages.yml`, a stamping script, how `main.js` fetches data, and tests.

## Constraints
- No change for local development (`python3 -m http.server -d site`).
- GitHub Pages headers can't be changed. `index.html` itself can still be cached for up to 10 minutes.

## Out of scope
A service worker or offline mode.
