# Task: harness plan, phase 7 (harness doctor)

Repository: `/Users/tandm/Desktop/yyyy`, branch `main`, HEAD `3e9450b`. Node 24.11.0.

## Task

Implement `plans/261101-0204-init-harness/phase-07-harness-doctor.md` exactly:
`jss-devtools harness doctor`, a read-only check of the installed harness that reports what the
hooks cannot see, above all that the hooks are no longer wired.

## Read first, in this order

1. `CLAUDE.md`, `docs/code-standards.md`, `docs/decisions/0024-*` (with the services amendment),
   `0031-*`, `0032-harness-update.md`
2. `plans/261101-0204-init-harness/plan.md` and `phase-07-harness-doctor.md`
3. `src/commands/doctor/` and `src/core/ui/check-list.ui.ts` (how `doctor` renders)
4. `src/commands/harness/` and `src/modules/harness/services/` (reuse: config, memory, index drift,
   decisions, learned skills, skill usage, redaction, block region, staging, manifest, hook
   settings constants)
5. Reference only: `/Users/tandm/Documents/jearax/dokploy/harness/src/commands/doctor-command.ts`
   and the `check*` functions it calls under `src/core/`

## Files you may create or modify

- `src/commands/harness/**` (register `doctor`; `services/doctor.service.ts` collects and orders)
- `src/modules/harness/**` (check functions in `services/`, types in `types/`)
- `tests/**` (`tests/harness-doctor.test.ts`, help snapshots where `doctor` appears)
- `docs/decisions/0032-harness-update.md` (a `doctor` section) or a new short `0033-*.md`,
  `docs/system-architecture.md`, `docs/codebase-summary.md`, `docs/project-roadmap.md`
- the phase file's `status`; `plans/261101-0204-init-harness/plan.md` `status: completed` only if
  every phase is done

## Acceptance

- Every row of the phase file's check table: introduced alone in a repository installed by phase 4's
  code, it reports exactly that issue at that level. A fresh install reports nothing and exits 0;
  any error exits 1; warnings alone exit 0.
- A check that SessionStart or `update` already performs is the same function, called from both;
  move logic rather than copy it.
- The command writes nothing, ever (test: the repository is byte for byte unchanged after a run
  with issues).
- `--help` states what it checks and the exit codes.
- One real run of the built CLI in a scratch repository outside this repo, healthy and with the
  hook entries removed from `.claude/settings.json`, pasted.
- Gate green with real output: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Constraints

- **Comments: default zero.** Only a non-inferable trap, one line. No JSDoc that says what a thing
  is or does.
- Module layer: no commander, no clack, no output. Only `src/cli.ts` touches process exit. Files
  over 200 lines are split along a real boundary. No new dependency.
- **Do not commit, do not push.** If the phase file conflicts with a decision, stop and say so.

## Report

Write `plans/reports/cooker-261101-<HHMM>-harness-phase-07-done.md`: files changed, gate output, the
scratch runs, deviations and why, ending with the Status block (`Status`, `Summary`,
`Concerns/Blockers`).
