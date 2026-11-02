# Task: harness config defaults

Repository: `/Users/tandm/Desktop/yyyy`, branch `main`, HEAD `76219a0`. Node 24.11+, pnpm.

## Task

Implement `plans/261102-1045-harness-config-defaults/plan.md` and its only phase,
`phase-01-change-the-defaults.md`, exactly: the defaults `jss-devtools init` writes to
`.harness/config.json` become `review.minToolCalls` 7, `memory.maxChars` 4800,
`memory.maxEntryChars` 300, `curator.minLearnedSkills` 10, `curator.intervalDays` 7,
`curator.staleDays` 14, `curator.archiveDays` 28.

## Read first, in this order

1. `CLAUDE.md`, `docs/code-standards.md`
2. The plan and the phase file above
3. `plans/261031-2325-init-harness-discussion/decision-log.md`, last section ("Config defaults for
   a medium project")
4. `src/modules/harness/templates/harness-config.template.ts` and the tests the phase file names

## Files you may create or modify

- `src/modules/harness/templates/harness-config.template.ts`
- `tests/**`, only where a test asserts the shipped default (the phase file says which)
- `plans/261101-0204-init-harness/content/.harness/config.json`
- `plans/261102-1045-harness-config-defaults/phase-01-change-the-defaults.md` and `plan.md`: only
  `status`

## Acceptance

- Every bullet of the plan's Acceptance holds.
- One real `init -y` into a temp folder outside this repository, with its `.harness/config.json`
  pasted.
- Gate green with real, unedited output: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Constraints

- Comments: default zero; only a one-line non-inferable trap.
- No new dependency. Values only: no new key, no behavior change.
- Another agent works in `/Users/tandm/Desktop/jss-harness-eval`; do not touch that folder.
- Do not commit, do not push.

## Report

Write `plans/reports/minimax-cooker-261102-<HHMM>-harness-config-defaults-done.md`: files changed,
gate output, the `init` run, deviations and why. End with:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
```
