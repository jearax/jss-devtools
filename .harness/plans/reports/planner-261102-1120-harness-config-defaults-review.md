# Review: harness config defaults, round 1

Reviewed the working tree against `76219a0` and
`plans/reports/minimax-cooker-261102-1119-harness-config-defaults-done.md`. The planner reran the
full gate: green (427 passed, 7 skipped). Accepted: `satisfies HarnessConfig`, the doctor test
deriving the limit from the constant, the hook fixtures spreading the default group, the update
round trip.

## Finding

1. **Nothing pins the decided values any more.** Every test now reads `HARNESS_CONFIG_DEFAULTS`,
   so a wrong edit to the template (say `maxChars: 480`) leaves the whole suite green. The values
   are a user decision ("Chốt 7 / 4800 / 300 / 10 / 7 / 14 / 28", user, 2026-11-02), so exactly one
   test states them as literals: the `config.json` that `init` installs equals
   `{ review: { minToolCalls: 7 }, memory: { maxChars: 4800, maxEntryChars: 300 }, curator: {
   minLearnedSkills: 10, intervalDays: 7, staleDays: 14, archiveDays: 28 } }`. Put it in the
   existing init or install-plan test file that already checks installed files; keep every other
   test reading the constant.

Rerun the full gate, append a "Round 1 fixes" section with real output. Do not commit, do not push.
