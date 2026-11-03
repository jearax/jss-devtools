---
phase: 1
title: "init fixes"
status: pending
priority: P2
effort: 3h
dependencies: []
---

# Phase 1: init fixes

Touch only `src/commands/init/**`, `src/core/adapters/package-manager.adapter.ts` and their tests;
another cooker is editing the harness module.

## A failed write

`applyInitPlan` (`src/commands/init/services/write.service.ts`) lets a write error escape to the
crash path in `src/cli.ts`, which prints a bare `EACCES: permission denied, open '…'`.

- Catch a write or delete error per entry and throw a `CliError` that names the file, says which
  files were already written (a count, plus the list when short), and gives the next step: fix the
  permission and rerun, which is safe because unchanged files are skipped.
- Test: a read-only file in existing mode; exit 1, the message names the file, no stack trace.

## Reject a bad folder before asking for a package manager

`runInit` (`src/commands/init/init.command.ts`) asks "Which package manager?" before
`preflightInit` runs, so `init nonempty` asks, then fails on the folder.

- Run the checks that do not need the package manager (target folder, git present) before the
  question; run the package-manager checks (installed, yarn 1) after the answer. Keep one
  preflight entry point if that stays simple; split it only along that line.
- Test: `init <non-empty folder>` in a pseudo-terminal or with the prompt stubbed; it exits 1 on the
  folder without the package-manager question.

## Say which manager a dry run assumes

`askPackageManager` returns `npm` for `--dry-run` without `--pm`, so the plan shown may differ from
the one an interactive run would build.

- When `--dry-run` runs without `--pm`, the output says it assumed npm and that `--pm` picks another
  (one line, beside the plan).
- Test: `init <dir> --dry-run` prints the line; with `--pm pnpm` it does not.

## npm hooks stay off the registry

The generated npm hooks run `npx lint-staged` and `npx commitlint`; plain `npx` can fetch an
unpinned package when the local bin is missing, against decision 0030 ("Versions are pinned, not
fetched").

- For npm, the local-bin command is `npx --no-install <bin>`. Other managers unchanged.
- Test: the generated `.husky/pre-commit` and `commit-msg` for npm use `npx --no-install`; the
  snapshot follows.

## Acceptance

- Each test fails before the fix and passes after.
- Full gate green.
