# Task: harness plan, phase 5 (harness update)

Repository: `~/Desktop/yyyy`, branch `main`, HEAD `d366187` (phase 4). Node 24.11.0.

## Task

Implement `plans/261101-0204-init-harness/phase-05-harness-update.md` exactly: the `harness`
command group and `jss-devtools harness update` with `--continue`, `--abort`, `-y`, `--dry-run`.

## Read first, in this order

1. `CLAUDE.md`, `docs/code-standards.md`, `docs/decisions/0024-*`, `0029-shared-command-flags.md`,
   `0031-init-installs-the-harness.md`
2. `plans/261101-0204-init-harness/plan.md` and `phase-05-harness-update.md`
3. `plans/261031-2325-init-harness-discussion/decision-log.md`: "`update` follows the old
   prototype's decision 0001 unchanged", "What `harness update` covers", "A missing key or invalid
   `config.json`", "Skills approved; the last curation is committed"
4. Phase 4 code: `src/modules/harness/install-plan.service.ts`, `merge.service.ts`, the templates,
   `constants/` (manifest and base paths, hook settings), and `src/commands/init/` for how a plan
   is rendered, confirmed and written
5. Reference only, do not copy: `the dokploy repository`
   (`planner.ts` for the edge cases, `staging.ts`, `run-core-update.ts`)

## Files you may create or modify

- `src/commands/harness/**` (new), `src/cli.ts` (register the group only)
- `src/modules/harness/**`
- `tests/**` (the tests the phase file names; help snapshots only where the new command appears)
- `docs/decisions/0032-*.md` (new), `docs/system-architecture.md`, `docs/codebase-summary.md`,
  `docs/project-roadmap.md`
- `plans/261101-0204-init-harness/phase-05-harness-update.md`: only `status`

## Acceptance

- Every preflight line, every row of the per-path table and every flow step holds, proven by
  `tests/harness-update.test.ts` in temp repositories installed by phase 4's code, plus unit
  tests for the three-way merge and the config merge.
- The upstream text always comes from the templates inside the installed CLI; nothing is
  downloaded. A missing `config.json` key is written back with its default even at the same
  version.
- Settings: harness entries (both the plain hook command and the `memory-guard` one) are
  replaced, every other key and hook kept.
- Seeds, learned skills, `.harness/archive/`, `.harness/curator.json` and the toolchain files are
  byte for byte unchanged in every case.
- A failed preflight leaves the repository byte for byte unchanged.
- `--help` for `harness` and `harness update` states each option's effect and its default.
- One real conflict round trip in a scratch repository outside this repo, pasted: edit a managed
  file, simulate a newer CLI template, `update` stages and exits 1, resolve, `--continue` exits 0.
- Gate green with real output: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Constraints

- **Comments: default zero.** Only a non-inferable trap, one line. No JSDoc that says what a thing
  is or does.
- Merge, staging and planning logic live in `src/modules/harness/`; `src/commands/harness/` holds
  argument rules and wiring only. The module layer knows nothing of commander or clack. Only
  `src/cli.ts` touches process exit. Files over 200 lines are split along a real boundary.
- No new dependency; write the line merge yourself, small and tested.
- Never commit from the CLI, never suggest a commit.
- **Do not commit, do not push.**
- Stay inside the files listed. If the phase file conflicts with a decision or blocks you, stop
  and say so in the report.

## Report

Write `plans/reports/cooker-261101-<HHMM>-harness-phase-05-done.md`: files changed, gate output,
the round trip, deviations and why. End with:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
```
