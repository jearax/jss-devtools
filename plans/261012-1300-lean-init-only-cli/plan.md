---
title: "Lean init-only CLI"
description: "Cut jss-devtools to one command (init), drop duplicated dependencies, delegate PM command mapping to package-manager-detector, align generated configs with the reference repos, verify via pack."
status: completed
priority: P1
effort: 4h
branch: main
tags: [cli, refactor, breaking-change, init]
blockedBy: [261012-1249-remove-self-management-commands]
blocks: []
created: 2026-10-12
---

# Lean init-only CLI

## Outcome

`jss-devtools` ships a single command, `init`, plus the `--help` / `--version` flags. It carries only the
dependencies it needs. Its generated tooling matches the house setup used by
`dokploy/design-system` (react) and `dokploy/auth` (node). The packed tarball is verified end to end.

## Decisions

| Area | Decision | Why |
|---|---|---|
| CLI surface | Remove `version` and `help` subcommands; keep `--help` / `--version` flags | Subcommands duplicated the flags |
| Banner | Keep the `figlet` banner on `-h`/`--help` (citty `showUsage` hook, as in `cs-cli`) and `-v`/`--version` | User wants branded help/version output |
| Logging | Replace `consola` with a small stderr logger built on `node:util` `styleText` | One-file usage; Node 24 has styling built in |
| Spinner | Replace `ora` with `@clack/prompts` `spinner()` | clack is already a dependency |
| Paths | Replace `pathe` with `node:path` | Built-in |
| PM detection | Replace `nypm` + hand-written lockfile/berry heuristics with `package-manager-detector` `detect()` | Same job twice; `detect()` already reports `yarn@berry` |
| PM commands | Build every command with `resolveCommand(agent, 'add' \| 'execute-local' \| 'execute')` | npm/pnpm/yarn/bun are equivalent; only the command mapping differs |
| pnpm 11 builds | Write `allowBuilds: { unrs-resolver: true }` into `pnpm-workspace.yaml`, pnpm projects only | pnpm 11 removed `onlyBuiltDependencies` (pnpm.io/settings/build); the old `package.json#pnpm` write had no effect and was also written for npm/yarn/bun |
| Monorepo check | `pnpm-workspace.yaml` counts only when it declares `packages` | pnpm 11 single-package repos keep settings there (both reference repos do) |
| House style | Generated prettier/commitlint/eslint/lint-staged/format follow the reference repos | User-chosen references |
| Build | Drop redundant tsup `external` list and published sourcemap | tsup externalizes deps already; map file only bloats the tarball |

## Non-goals

- New presets, `--harness`, bin rename, registry changes.
- Project-specific rules from the reference repos (vitest/playwright plugins, Vite config-loader files, CSS import groups, stylelint).
- `.editorconfig` / `.prettierignore` generation.

## Acceptance criteria

1. `jss-devtools --help` lists only `init`; `version`/`help` subcommands are gone; `--version` prints the version.
2. Runtime dependencies: `@clack/prompts`, `citty`, `execa`, `figlet`, `package-manager-detector`, `semver` only.
3. `init` on fresh node/react/next fixtures (npm, pnpm, yarn, bun detection) produces configs matching the reference repos' house style; `pnpm lint` of the generated `eslint.config.mjs` loads.
4. `init --dry-run` on copies of `design-system` and `auth` no longer aborts as a monorepo.
5. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass.
6. Pack gate: `pnpm pack` tarball contains only `dist/cli/cli.js`, `package.json`, README, LICENSE; `bin` resolves; installing the tarball into a temp prefix and running `jss-devtools init` on a fixture works.
7. README, CHANGELOG, docs updated.

## Verification (2026-10-12)

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (154 passed, 0 skipped), `pnpm build` green.
- Real `init` + install + `lint` + `typecheck` + commit hooks (bad message rejected, conventional accepted): node preset on pnpm 11, npm, bun, yarn classic.
- Real Vite react-ts app (npm): install, lint after `format`, `vite build` pass. Findings below.
- Dry-run on copies of `design-system` (react) and `auth` (node): prettier, commitlint, pnpm-workspace, hooks, gitignore, tsconfig byte-identical (no write); only `eslint.config.mjs` differs (reference repos add project-specific blocks).
- Pack gate: tarball = `dist/cli/cli.js`, `LICENSE`, `package.json`, `README.md`; 6 runtime deps (30 packages installed); installed bin ran `init` end to end; re-run reports `noop` with a clean tree.

## Findings left open

- Current `create-vite` templates ship oxlint (`.oxlintrc.json`); `init` aborts with `FOREIGN_LINTER`.
- Solution-style tsconfig (Vite) is left untouched, so the `@/` alias is never configured while the eslint alias rule is active; `typecheck` (`tsc --noEmit`) checks nothing on a `files: []` root.
- `next` preset not exercised against a real `create-next-app` project.
