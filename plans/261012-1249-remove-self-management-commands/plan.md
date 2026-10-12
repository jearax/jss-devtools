---
title: "Remove self-management commands"
description: "Drop update/upgrade/downgrade/uninstall from the CLI; users manage jss with their package manager's native commands."
status: pending
priority: P1
effort: 2h
branch: main
tags: [cli, refactor, breaking-change]
blockedBy: []
blocks: []
created: 2026-10-12
---

# Remove self-management commands

## Context

Rationale: note `obsidian-brain/notes/backend/npm-bin-distribution.md`. The only contract for a CLI
distributed via npm is `package.json#bin` plus a shebang. Every package manager (npm, pnpm, yarn 1,
bun) creates its own symlink/shim in its global bin directory, so per-PM cost is zero. The current
self commands re-implement exactly that per-PM work: probing 4 PMs in parallel, keeping a ledger in
`conf`, a 10s timeout because `yarn global list` can hang, and mapping add/remove commands per PM.
That is ~1.7k LOC plus 5 test files just to wrap `npm i -g` / `pnpm add -g` / `bun add -g` /
`npm rm -g`.

## Outcome

The CLI exposes only `init`, `version`, `help`. Installing, updating, and uninstalling jss happens
through the package manager's native commands, documented in the README.

## Constraints

- `init` behavior stays unchanged, including the shared modules it uses: `core/registry-client`,
  `core/runner/pm-commands`, `core/detector/project-pm`, `core/detector/monorepo-signals`,
  `utils/prompts`.
- Bin name `jss-devtools` is unchanged.
- Still on 0.x, so the breaking change bumps minor: `0.5.10 → 0.6.0`.
- Release follows the existing tag-based flow (`docs/deployment-guide.md`), only with user approval.

## Non-goals

- Any change beyond removing self commands (bin name, flags, presets, registry in `fetch-package.ts`).
- Temporary stubs or a deprecation period for the 4 commands: hard removal (user decision).
- Cleaning up the old `conf` config file on user machines. It is orphaned but harmless; noted in CHANGELOG only.
- Rewriting the whole README (it is stale in other places too).

## Acceptance criteria

1. `jss-devtools update|upgrade|downgrade|uninstall` fails as an unknown command (exit ≠ 0) via citty.
2. `jss-devtools --help` lists only `version`, `help`, `init`.
3. No imports remain of `@/commands/self`, `core/detector/{global-pm,pm,types}`,
   `core/self-installer`, `core/store`, `core/version-resolver`.
4. `conf` is removed from `dependencies`; `pnpm install --frozen-lockfile` passes after the lockfile update.
5. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass.
6. Manual gate: `pnpm pack` → `npm i -g <abs-path>.tgz` → `jss-devtools init --framework node --dry-run` works as before.
7. README has an install/update/uninstall table per PM; CHANGELOG has a 0.6.0 entry noting the breaking change.

## Phases

| # | Phase | Status | Effort |
|---|---|---|---|
| 01 | [Remove code, tests, dependency](phase-01-remove-code-tests-dependency.md) | pending | 1h |
| 02 | [Docs and release notes](phase-02-docs-and-release-notes.md) | pending | 1h |

## Risks

| Risk | Mitigation |
|---|---|
| Users have scripts calling `jss-devtools upgrade` | Breaking note in CHANGELOG + replacement command table in README |
| Deleting a module `init` still uses | AC #3 + typecheck; the keep-list lives in Constraints |
| Lockfile drift after removing `conf` | Run `pnpm install`, then verify `--frozen-lockfile` as CI does |

## Rollback

Revert the commits. If 0.6.0 is not published, nobody is affected; if it is, users can reinstall
`@jjuidev/jss-devtools@0.5.10`.
