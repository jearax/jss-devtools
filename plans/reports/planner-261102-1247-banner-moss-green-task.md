# Task: banner in the design system's moss green

Repository: `/Users/tandm/Desktop/yyyy`, branch `main`. Node 24.11+, pnpm.

## Task

Implement `plans/261102-1247-banner-moss-green/plan.md` and its only phase,
`phase-01-recolour-the-banner.md`, exactly.

## Read first

1. `CLAUDE.md`, `docs/code-standards.md`
2. The plan and the phase file (the colour table and the skin note)
3. `src/core/constants/banner.constant.ts`, `src/core/ui/banner.ui.ts`, `tests/banner.test.ts`,
   `docs/system-architecture.md` (banner paragraph)

## Files you may modify

The four files above, and `status` in the plan and phase files.

## Acceptance

- Every bullet of the plan's Acceptance holds.
- Gate green with real, unedited output: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Constraints

- Comments: default zero. No new dependency. The spinner and help colours stay as they are.
- Another agent works in `/Users/tandm/Desktop/jss-harness-eval`; do not touch it. Edit nothing
  outside this repository.
- Do not commit, do not push.

## Report

Write `plans/reports/minimax-cooker-261102-<HHMM>-banner-moss-green-done.md`: files changed, gate
output, the banner check, deviations. End with:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
```
