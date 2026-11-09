# Cooker report: init touch-ups, phases 1 and 2

Worktree: `/Users/tandm/Desktop/yyyy-init-touch-ups` (branch `init-touch-ups`, base `3fea7b1`).
Plan: [261103-1021-init-touch-ups](../261103-1021-init-touch-ups/plan.md). Not committed; left for user review.

## Scope note

The `npx --no-install` item ("npm hooks stay off the registry") was dropped by the user mid-run
(2026-11-03) and was not implemented; the npm hook commands are unchanged.

## Phase 1

### Fix: a failed write names the file and what came before it

`applyInitPlan` (`src/commands/init/services/write.service.ts`) now wraps each write and each
delete in try/catch and throws a `CliError` instead of letting the raw `EACCES` reach the crash
path in `src/cli.ts`. The message names the file, reports how many files were written before it
(with the list when five or fewer), and hints: fix the permission and rerun; unchanged files are
skipped. Deletes after the failure are not attempted.

- Test: `tests/init.command.test.ts` "names the file a failed write hit, counts what came before
  it, and exits 1" — a read-only `eslint.config.mjs` with `-f`; exit 1, message names the file,
  no ANSI, no stack trace. Failed before the fix with the bare `EACCES` message, passes after.

### Fix: a bad folder is rejected before the package-manager question

`preflightInit` was split along the pm line: `preflightFolderChecks` (agent-kit check, target
folder, git; for existing mode also package.json parse, monorepo, tsconfig, git root, hooks path,
manager detection) runs before the question, and `completePreflight` (installed version, yarn
berry check; for existing mode also workspace mergeability, harness and config conflicts) runs
after the answer. `preflightInit` remains as the one-shot entry and delegates to both, so the
preflight unit tests kept their call shape unchanged. `runInit` now calls the two steps with the
question in between.

- Test: `tests/init.command.test.ts` "rejects a bad folder before asking for a package manager" —
  `init <non-empty folder>` with the prompt stubbed; `selectCalls` stays empty, exits 1 on the
  folder. Failed before the fix (the select stub was called once), passes after.

### Fix: a dry run says which manager it assumed

When `--dry-run` runs on create mode without `--pm`, one plain line prints beside the plan:
`Assumed npm for this plan; pass --pm to pick another`. Existing mode (detected manager) and an
explicit `--pm` stay quiet.

- Test: `tests/init.command.test.ts` "says a dry run without --pm assumed npm, and stays quiet
  when --pm is given". Failed before the fix, passes after.

## Phase 2

- `examplesText(rows)` moved to `src/core/ui/help-examples.ui.ts`; `init.command.ts` and
  `harness.command.ts` pass their rows. Help output is byte-identical (the help snapshot tests
  pass unchanged).
- `shellQuote` moved to `src/core/utils/shell-quote.util.ts` (the init implementation, which
  quotes the empty string as `''`); the init `services/shell-quote.service.ts` and the local copy
  in `update.command.ts` were deleted.
- The per-command apply-line helpers (`typedWords` / `applyCommandLine` in init, `typedWordsOf` /
  `applyCommandLineOf` in update) stayed in their command files: the architecture rule
  `commander-in-command-files-only` bans importing commander outside `*.command.ts` and `cli.ts`,
  so the shared helper cannot take a `Command`. `applyCommandLineOf` is now exported for testing.
- Acceptance grep: `grep -rn "examplesText\|shellQuote =" src` shows only the core definitions
  and call sites; no local copies remain.

- Tests: `tests/harness-update-units.test.ts` "the update apply command line" — the apply line
  keeps an empty argument as `''` and leaves plain words unquoted. Both failed before the helper
  swap, pass after.

## Out-of-scope observation

Commander stores `rawArgs` only on the program: for `harness update`, `update.parent.rawArgs` is
`[]`, so `typedWordsOf` produces an empty list and the dry-run apply line prints just
`$ jss-devtools` with no `harness update` words (verified with commander directly). The existing
`FAKE_COMMAND` stub in `tests/harness-update.test.ts` assumes rawArgs are present, so the tests
do not catch it. Fixing it means reading `rawArgs` from the program root or a different lookup;
it was left untouched because phase 2 restricts `update.command.ts` changes to the helper swap.

## Gate

```
pnpm lint       pass
pnpm typecheck  pass
pnpm test       448 passed | 7 skipped (455), 28 files passed | 1 skipped
pnpm build      pass (dist/cli.mjs 324.63 kB)
```
