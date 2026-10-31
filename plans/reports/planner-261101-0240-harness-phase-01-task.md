# Task: harness plan, phase 1 (the modules layer and the hook entry)

For the cooker. Planner: pane `wG:p1`. Date: 2026-11-01.

## Read first

1. `CLAUDE.md` (repository rules).
2. `plans/261101-0204-init-harness/plan.md` (outcome, non-goals).
3. `plans/261101-0204-init-harness/phase-01-modules-layer-and-hook-entry.md` (this task, the
   authority for roles, rules, fixtures and files).
4. `tests/support/architecture-rules.ts`, `tests/architecture.test.ts`,
   `tests/fixtures/architecture/`, `docs/decisions/0024-core-and-command-layout.md`.

## Do

Exactly phase 1: the roles table and the rules table of the phase file, each rule with its
negative fixture, and the doc updates it lists (0024 amendment, `docs/code-standards.md`,
`docs/system-architecture.md`, `CLAUDE.md`). The hook entry is
`src/modules/harness/harness-hook.entry.ts` (role `.entry.ts`); do not create it or any other file
under `src/` in this phase.

## Constraints

- Comments: default zero. Keep only a non-inferable trap, one line. No JSDoc that says what
  something is or does. Do not add comments to the rules or fixtures beyond what an existing rule
  already carries.
- Do not commit, do not push, do not amend. The planner reviews and commits.
- Do not edit anything under `plans/`.
- Fixtures must each fail exactly their own rule; the real tree must pass.
- If the phase file is ambiguous or contradicts the code, stop and report it instead of guessing.

## Done means

```bash
pnpm vitest run tests/architecture.test.ts
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

All green, real output.

## Report back (in your final reply)

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Files: every file created or modified
Checks: each command above with its last lines of output
Concerns/Blockers: optional
```
