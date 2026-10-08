# REVIEW.md

Review policy used by the `reviewer` subagent (`/review-change`) and by humans. Owned by the owner.

## Passes
Run each pass separately and report findings per pass.

1. **Correctness**
   - Logic errors, edge cases and off-by-one errors.
   - Floating-point noise in decimal math.
   - Wrong "correct" answers: a generated task whose stored answer is wrong is always a blocker.
   - Answer checking: `0,5` / `0.5` / `,5` / `0,50` must be judged as intended.
2. **Spec conformance**
   - Every requirement and acceptance criterion in the approved `spec.md` is implemented and tested.
   - Nothing extra beyond `plan.md`.
3. **Tests**
   - The tests prove the acceptance criteria.
   - No tests removed, skipped or weakened, and no assertions loosened.
   - Task generators are tested with a seeded random number generator over many seeds.
4. **Player experience** (apply the `kid-math-pedagogy` skill)
   - All player-facing text is correct, natural Swedish for a 13-year-old.
   - Swedish math notation is used.
   - Tone is encouraging, with no punishing mechanics.
   - Task difficulty matches the source sheet.
   - Works by touch on a phone or tablet: targets ≥ 44 px, no hover-only actions, no pinch-zoom needed.
5. **Security & privacy** (apply the `security-baseline` skill)
   - No personal data leaves the device.
   - No third-party runtime scripts or tracking.
   - No homework photos in the deployed site.
   - No `innerHTML` with data that is not a constant.
6. **Maintainability**
   - Engine and content stay separate: no world-specific code in the engine.
   - Naming, duplication, dead code, and the conventions in `AGENTS.md`.

## Severity
| Level | Meaning | Merge? |
|-------|---------|--------|
| blocker | Bug, wrong math answer, security/privacy issue, spec violation, weakened test, English text shown to the player | No |
| major | Likely future defect, missing test for a requirement, broken on touch devices | No, unless the owner accepts in writing |
| minor | Style, naming, small cleanup, awkward Swedish wording | Yes |
| nit | Optional | Yes |

## Exclusions
- Generated files, lockfiles, vendored code.
- Raw source photos in `sources/`.

## Output format
For each finding: `severity | pass | file:line | problem | concrete failure scenario | suggested fix`.
Only report findings you can justify with a concrete failure scenario.
End with a verdict: `MERGE`, `MERGE AFTER FIXES`, or `DO NOT MERGE`.

## Merge rule
An agent never merges on its own initiative. The owner merges, or tells Claude to merge, after:
- verify passes
- there are no open blocker or major findings
- all artifacts are approved
