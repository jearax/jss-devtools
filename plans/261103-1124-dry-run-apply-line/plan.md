---
title: "Dry-run apply line names the full command"
description: "The 'To apply' line after --dry-run repeats what the user typed, for nested commands too."
status: completed
priority: P2
effort: 1h
branch: main
tags: [cli, harness, init]
blockedBy: []
blocks: []
created: 2026-11-03
---

# Dry-run apply line names the full command

## Outcome

After `--dry-run`, the "To apply" line shows the command the user typed without `--dry-run`, so it
can be copied and run. The user asked for the fix and for the command name to come from `bin`:
"Lấy tên lệnh từ bin" (user, 2026-11-03).

## The bug

Commander sets `rawArgs` only on the command that `.parse()` runs on, the root program. Both
helpers read `command.parent.rawArgs`:

- `src/commands/harness/update.command.ts:31` `typedWordsOf`: the parent of `update` is `harness`,
  whose `rawArgs` is `[]`. `jss-devtools harness update --dry-run -y` prints `jss-devtools` alone.
- `src/commands/init/init.command.ts:126` `typedWords`: works today only because `init` sits
  directly under the root. The same code is duplicated.

The command name already comes from `bin`: `PACKAGE.name` is the bin key
(`scripts/package-info.mjs`), so that part needs no change.

Verified with commander directly:

```
parent: harness  parent.rawArgs: []  root.rawArgs: [node, jss-devtools, harness, update, --dry-run, -y]
```

The unit tests in `tests/harness-update-units.test.ts` ("keeps an empty argument quoted…", "leaves
plain words unquoted") pass because they fake `parent.rawArgs`.

## Change

1. One helper in `src/core/utils/` (for example `apply-command-line.util.ts`) that walks
   `parent` up to the root, takes its `rawArgs` after the first two entries (node and the script),
   drops `--dry-run`, and returns `[PACKAGE.name, ...words].map(shellQuote).join(' ')`.
   - Type the parameter structurally (`{ parent?: …; rawArgs?: readonly string[] }`). The
     architecture rule `commander-in-command-files-only` forbids importing `commander` outside
     `*.command.ts` and `cli.ts`, including type imports.
2. `update.command.ts` and `init.command.ts` call it. Delete `typedWordsOf`, `typedWords`,
   `applyCommandLine` and the export `applyCommandLineOf`.
3. Tests go through a real commander tree, not a faked parent:
   - Nested: `harness update --dry-run -y` gives `jss-devtools harness update -y`.
   - Top level: `init my-app --pm pnpm --dry-run` gives `jss-devtools init my-app --pm pnpm`.
   - An empty argument and a word with a space or quote stay shell-quoted.
   - Replace the two faked-parent tests in `tests/harness-update-units.test.ts`.

## Acceptance

- The three test cases above pass.
- No `rawArgs` read from `command.parent` remains in `src/`.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green; report the real output.

## Non-goals

- Changing what the dry run prints apart from this line.
- Other uses of `PACKAGE.name` (banner, intro titles).

## Rules

- Work on `main` in this tree. Do not commit or push; the planner reviews and commits.
- Comments: default none.
- Report to `plans/reports/cooker-261103-1124-dry-run-apply-line.md`, ending with
  `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT` and a one-line summary.
