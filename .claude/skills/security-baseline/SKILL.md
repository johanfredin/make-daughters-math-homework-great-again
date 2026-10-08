---
name: security-baseline
description: Security and privacy rules for this repo (a static kids' game hosted publicly). Use when writing specs, plans, code or reviews that touch storage, hosting/deploy, dependencies, third-party scripts, rendering of text into the DOM, or the homework photos.
user-invocable: false
---

# Security & privacy baseline

Policy owner: Johan Fredin. Changes to this skill go through normal review.

The player is a child. The site is public. Keep it boring and private.

## Rules
1. **No personal data leaves the device.**
   - Progress lives in `localStorage` only.
   - No accounts, no names beyond a nickname she chooses, no analytics, no tracking pixels, no fingerprinting.
2. **No third-party runtime code.**
   - No CDN scripts, fonts or embeds at runtime unless a spec approves them.
   - Vendor approved libraries into `site/vendor/` with their licence and pinned version.
3. **Homework photos stay out of the deployed site.**
   - `sources/` is input for content design only. The owner is fine with it being public in the repo.
   - Do not copy photos or transcribed sheets into `site/`: the game generates its own tasks.
4. **DOM safety.**
   - Render text with `textContent` or by creating elements.
   - Use `innerHTML` only with constant templates, never with data from `localStorage`, the URL or world files.
5. **Validate data at the boundary.**
   - World JSON and saved progress are validated when loaded.
   - Corrupt or old saved progress resets gracefully (with a Swedish message); it never crashes the game.
6. **Dependencies.** A new dependency, dev-only ones included, must be justified in the plan: maintained,
   licence compatible, no known CVEs. Prefer none.
7. **Secrets.** There should be none. If hosting needs a token, it lives in the CI secret store, never in the repo.
8. **Content Security Policy.** The site sets a strict CSP (`default-src 'self'`) once the skeleton exists.

## In specs
List any rule above that applies under *Policy concerns flagged*, with the decision needed from the owner.

## In reviews
Each violation is at least `major`. Data leaving the device and third-party tracking are `blocker`.
