# Task: harness plan, phase 6 (services move into services/)

Repository: `/Users/tandm/Desktop/yyyy`, branch `main`, HEAD `c8b7d68`. Node 24.11.0.

## Task

Implement `plans/261101-0204-init-harness/phase-06-services-folder.md` exactly: a pure move of every
`*.service.ts` into a `services/` folder of its command or module, doctor included, with the
architecture rules, fixtures and docs following. No behavior change.

## Read first

1. `CLAUDE.md`, `docs/decisions/0024-core-and-command-layout.md`, `docs/code-standards.md`
2. `plans/261101-0204-init-harness/phase-06-services-folder.md`
3. `tests/support/architecture-rules.ts` and `tests/fixtures/architecture/`

## Files you may modify

`src/**` (moves and import updates only), `tests/**`, `docs/decisions/0024-*`,
`docs/code-standards.md`, `docs/system-architecture.md`, `docs/codebase-summary.md`, `CLAUDE.md`,
and the phase file's `status`.

## Acceptance

- `find src/commands src/modules -maxdepth 2 -name '*.service.ts'` prints nothing.
- The command root holds only `.command.ts`, the module root only `.entry.ts`, enforced by the
  architecture test with a negative fixture for each.
- `git diff --stat -M` after staging shows the moves as renames; no logic line changes.
- Gate green with real output: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Constraints

- Use `git mv` so history follows. Comments: default zero; do not add or remove comments other
  than path text that names a moved file.
- **Do not commit, do not push.** If a rule or doc conflicts with the phase file, stop and say so.

## Report

Write `plans/reports/cooker-261101-<HHMM>-harness-phase-06-done.md` with files changed, gate output
and deviations, ending with the Status block (`Status`, `Summary`, `Concerns/Blockers`).
