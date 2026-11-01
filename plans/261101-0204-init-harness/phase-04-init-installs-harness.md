---
phase: 4
title: "init installs the harness"
status: pending
priority: P1
effort: "1.5d"
dependencies: [2, 3]
---

# Phase 4: init installs the harness

## Goal

`jss-devtools init` writes the harness by default, in both modes, through init's existing
preflight, plan, dry run, confirmation and writes.

## Context

Decision log sections "Harness is on by default, AgentKit is off", "`--harness` runs inside the
init flow", "Harness flags depend on `--harness`", "`--agent-kit` follows the prototype's decision
0013", "`.harness/config.json` holds the harness settings". Init's flow and its rules are in
decision 0030 and `src/commands/init/`.

## Flags

| Flag | Help text (states the default) |
|---|---|
| `--no-harness` | `Do not install the harness (default: installed)` |
| `--agent-kit` | `Point AgentKit at .harness/docs and .harness/plans; needs ak (default: off)` |

`validateInitArguments` in `init.service.ts` rejects `--agent-kit` with `--no-harness`:
`CliError('Option --agent-kit needs the harness', { hint: 'Drop --no-harness' })`. Add both rows to
the help examples only if they read naturally; the help snapshot test is updated either way.

## Preflight additions (all before the first write)

- With `--agent-kit`: `ak --version` through a new `src/core/adapters/agent-kit.adapter.ts`; missing
  exits 1 with the install hint. Never run without the flag.
- Existing mode: any harness path already present (`.harness/`, a `harness-*` skill, the block
  markers in `CLAUDE.md`, a harness entry in `.claude/settings.json`) joins `ownedConflicts`, so it
  exits 1 listing it, unless `-f`.
- `CLAUDE.md` or `.claude/settings.json` that is a symlink exits 1.
- `.claude/settings.json` that is not valid JSON exits 1, naming the parse error.

## Plan entries

`src/modules/harness/install-plan.service.ts` returns the harness entries for given inputs (mode,
AgentKit on or off, the current `CLAUDE.md` and `settings.json` text); `plan.service.ts` appends
them. The module knows nothing of commander or clack.

- Every file of the design proposal's table, from the `.template.ts` files encoding the drafts the
  user approved in phase 2. One copy of each; AgentKit changes no file the harness writes.
- `.harness/bin/hooks.mjs` from the embedded text; `.harness/bin/harness-hook.mjs` from the shim
  template.
- `CLAUDE.md`: created with only the block when missing; otherwise the block appended after one
  blank line.
- `.claude/settings.json`: harness entries added, every other key and hook kept, key order kept.
- `.harness/core/manifest.json`: CLI version, AgentKit on or off, each managed, block and config
  path with its kind and sha256. `.harness/core/base/**`: the installed text of each.
- `BOOTSTRAP.md`: the create-mode or existing-mode copy.
- The "Nothing to change" early return counts harness entries.

## After the writes

- With `--agent-kit`, after the install: `ak init --docs-dir .harness/docs --plans-dir
  .harness/plans`. A failure exits 1 with `To finish:` and that command, like an install failure.
- The outro adds one line naming the harness and the next step: open Claude Code in the folder.
- No commit, no commit suggestion.

## Tests

- `tests/harness-install-plan.service.test.ts`: entries for each mode and AgentKit setting;
  `CLAUDE.md` absent, present without block; `settings.json` absent, with user hooks.
- `tests/init-preflight.service.test.ts`: each new exit 1, the folder byte for byte unchanged.
- `tests/init.e2e.test.ts`: create mode and existing mode with the default; `--no-harness` equals
  the previous snapshot; `--agent-kit` with a stub `ak` on PATH. After the e2e install, run the
  installed SessionStart hook once and assert memory is injected.
- `tests/bundle.test.ts`: the hook bundle text inside `cli.mjs` equals `dist/hooks.mjs`. It is
  provable only now, when the init code imports the constant, so tree-shaking keeps it.
- Existing snapshots that assert the default plan are updated, and only those.

## Docs

Decision 0030 gains an amendment for the new default with the user's quote; a new decision record
`0031` for the harness install (folders, kinds, AgentKit as 0013, the CLI never commits), quoting
the decision log; `docs/system-architecture.md`, `docs/codebase-summary.md`,
`docs/project-roadmap.md`.

## Validation

```bash
pnpm vitest run tests/harness-install-plan.service.test.ts tests/init-preflight.service.test.ts tests/init.e2e.test.ts
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Report one real run in a scratch repository: `init -y` output and the resulting `.harness/` tree.

## Risk and rollback

Changes the default of a shipped command; reverting the commit restores it. `--no-harness` is the
user-side escape.
