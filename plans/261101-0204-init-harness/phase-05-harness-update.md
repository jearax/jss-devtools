---
phase: 5
title: "harness update"
status: completed
priority: P1
effort: "1.5d"
dependencies: [4]
---

# Phase 5: harness update

## Goal

`jss-devtools harness update` brings a repository's harness to the installed CLI's version,
keeping the user's edits, and stages every conflict for the user to resolve.

## Context

Decision log sections "`update` follows the old prototype's decision 0001 unchanged" (with "The
CLI never commits" and the edge cases), "What `harness update` covers", "A missing key or invalid
`config.json`". H0's `src/updater/` shows the cases; its journal and backup folder do not carry.

## Command

`src/commands/harness/harness.command.ts` registers the `harness` group and `update` with
`--continue`, `--abort`, `-y`, `--dry-run` (decision 0029). The logic is in
`src/modules/harness/update-plan.service.ts`, `three-way-merge.service.ts`,
`config-merge.service.ts` and `staging.service.ts`; `src/commands/harness/update.service.ts`
holds only argument rules and wiring.

## Preflight (before any write)

- Git root, as init requires. No clean tree, no git identity.
- `.harness/core/manifest.json` present; else exit 1 with `jss-devtools init` as the next step.
- Manifest version newer than the CLI: exit 1, `refusing downgrade`, with the install command.
- Same version, no staged update and no `config.json` key missing: exit 0, "Harness is up to
  date". A missing key at the same version is still written back with its default; this is the
  repair the SessionStart warning names.
- A base file missing: exit 1, "restore `.harness/core` from git".
- `config.json` not valid JSON: exit 1 naming the line.
- An update already staged: `update` exits 1 naming `--continue` and `--abort`.
- Another update running (lock file in `.harness/update/`): exit 1.

## Per-path actions

| Kind | Action |
|---|---|
| managed, block | Three-way merge of base, local and upstream. Local equals base: take upstream. Upstream equals base: keep local. Both changed: line merge; overlapping hunks are a conflict. |
| managed, deleted locally | Conflict |
| managed, dropped upstream | Untouched: delete. Edited: conflict. |
| hook bundle | Overwrite |
| config | Key by key: untouched key takes the new default, edited key kept, new key added, missing key written back with the default, both sides changed to different values is a conflict |
| settings entries | Harness entries replaced, others kept |
| seed, learned skill, archive, `curator.json`, toolchain | Never touched |


## Flow

1. Plan every action, render it like init's plan (`+`, `~`, `-`, `!` for a conflict).
2. `--dry-run`: stop, exit 0.
3. Ask unless `-y`.
4. No conflict: write every result, then the new manifest and base. Exit 0. No commit suggestion.
5. Conflict: write nothing live. Stage under `.harness/update/`: for each conflicted path its
   base, local, upstream and a `resolved` copy holding conflict markers, plus the planned actions.
   Exit 1 listing the paths and naming `jss-devtools harness update --continue` and `--abort`.
6. `--continue`: refuse while a `resolved` copy holds conflict markers or block markers; then apply
   the staged plan with the resolved copies, write manifest and base, remove `.harness/update/`.
7. `--abort`: remove `.harness/update/`; live files were never changed.

## Tests

`tests/harness-update.test.ts`, in temp repositories installed by phase 4's code with a stubbed
older and newer harness release:

- every row of the table above;
- clean update, conflict then `--continue`, conflict then `--abort`;
- each preflight exit 1, the repository byte for byte unchanged;
- `--dry-run` writes nothing;
- seeds, learned skills and toolchain files unchanged in every case.

Unit tests for `three-way-merge.service.ts` and `config-merge.service.ts` on their own.

## Docs

Decision record `0032` for `harness update` (0001's rule, never commits, the edge cases) quoting the
decision log; `docs/system-architecture.md`, `docs/codebase-summary.md`, `docs/project-roadmap.md`;
`--help` for `harness` and `harness update` with examples.

## Validation

```bash
pnpm vitest run tests/harness-update.test.ts
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Report one real conflict round trip in a scratch repository.

## Risk and rollback

A new command; nothing else calls it. Revert the commit.
