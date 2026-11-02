# Task: scaffold touch-ups (moss green banner, fuller ignore files, AgentKit wording)

Repository: `/Users/tandm/Desktop/yyyy`, branch `main`. Node 24.11+, pnpm.

## Task

Implement `plans/261102-1247-scaffold-touchups/plan.md` and its three phases,
`phase-01-recolour-the-banner.md`, `phase-02-fuller-ignore-files.md` and
`phase-03-agentkit-wording.md`, exactly.

## Read first

1. `CLAUDE.md`, `docs/code-standards.md`
2. The plan and the three phase files
3. Phase 1: `src/core/constants/banner.constant.ts`, `src/core/ui/banner.ui.ts`,
   `tests/banner.test.ts`, `docs/system-architecture.md` (banner paragraph)
4. Phase 2: `src/commands/init/templates/gitignore.template.ts`,
   `src/commands/init/templates/prettierignore.template.ts`, the lint glob in
   `src/commands/init/templates/package-json.template.ts`, and the tests that print these files
5. Phase 3: `src/modules/harness/templates/claude-block.template.ts`,
   `src/modules/harness/templates/harness-seeds.template.ts`,
   `src/modules/harness/templates/harness-template-files.template.ts`

## Files you may modify

- The phase 1 files above.
- The two ignore templates, `tests/**` where a test or snapshot prints the ignore files, and new
  tests the phase 2 file asks for.
- The three phase 3 templates, and `tests/**` where a test prints their text.
- `docs/**` only where a doc lists the banner colours, the ignore entries or quotes the phase 3 lines.
- `status` in the plan and phase files.

## Acceptance

- Every Acceptance bullet of the three phases holds, including phase 2's step 4 and phase 3's
  step 3, run in a temp folder outside this repository, pasted.
- Gate green with real, unedited output: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Constraints

- Comments: default zero. No new dependency. The spinner and help colours stay as they are.
- If a managed harness Markdown file changes under Prettier in phase 2's step 4, stop and report the
  diff; do not change the harness.
- Another agent works in `/Users/tandm/Desktop/jss-harness-eval`; do not touch it. Edit nothing
  outside this repository.
- Do not commit, do not push.

## Report

Write `plans/reports/<cooker>-261102-<HHMM>-scaffold-touchups-done.md`: files changed, gate output,
the banner check, the phase 2 step 4 run, the phase 3 step 3 output, deviations. End with:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
```
