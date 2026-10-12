# Project Overview & PDR — `jss-devtools`

## One-liner

A lean CLI, published on npm as `@jjuidev/jss-devtools` (bin `jss-devtools`), whose single command `init` overlays a lint/format/commit toolchain on an existing Node.js + TypeScript project.

## Problem

Wiring eslint, prettier, editorconfig, husky, lint-staged and commitlint by hand means choosing peer-compatible versions, keeping the tools from fighting each other, and repeating the work in every repository.

## Solution

`jss-devtools init`:

1. Resolves peer-compatible versions of the house toolchain from the npm registry.
2. Writes configs that already pass their own checks (`.editorconfig` owns whitespace, `.prettierrc.json` owns JS syntax, `eslint.config.mjs` runs prettier).
3. Installs and wires git hooks through the project's own package manager (npm, pnpm, yarn, bun).
4. Re-runs idempotently and asks before replacing differing configs.

## Scope

| In | Out |
|---|---|
| `init` for single-package Node.js + TypeScript projects (`--framework node`) | Self-management of the CLI (install/update/uninstall belong to the package manager) |
| `--dry-run`, `--json`, `--yes`, `--no-linter`, `--no-commitlint`, `--no-install` | Monorepos and foreign linters (biome, oxlint): `init` aborts with a hint |
| Reserved framework ids `react`, `next`, `nest`, `rn` (abort with `FRAMEWORK_NOT_SUPPORTED`) | Creating new projects (left to each framework's scaffolder) |

## Principles

- Keep only what delivers real value; prefer the package manager and upstream tools over wrappers.
- Generated output must pass `lint`, `typecheck` and the commit hooks right after `init`.
- Never rewrite a user's own editor or ignore files; create them only when missing.

## Target User

JavaScript / TypeScript developers who want the same toolchain in every Node.js repository without hand-wiring it.

## Ownership

- Owner: `jjuidev`
- Org / repo: `jearax/jss-devtools`
- Package: `@jjuidev/jss-devtools` (MIT)
