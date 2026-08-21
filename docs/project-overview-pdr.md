# Project Overview & PDR — `jss-devtools`

## One-liner

A complete SDK-style JavaScript stack dev-tools CLI, distributed publicly on npm as `jss-devtools` with bin `jss-devtools`. Inspired by Docker's command-tree UX (subcommands + per-subcommand `--help`).

## Problem

JS developers juggle multiple one-off CLIs (version managers, scaffolders, updaters, listers). Each has its own UX, help format, and update cadence. No single tool gives a coherent, discoverable surface for the common stack-management workflows.

## Solution

`jss-devtools` is a single entry point covering:

1. **Version management** — update / upgrade / downgrade / ls of project dependencies and runtime versions
2. **Scaffolding** — preset-based project initialization
3. **Standard CLI ergonomics** — `--help` everywhere, subcommand trees, predictable exit codes

## Goals (MVP)

| # | Goal | Acceptance |
|---|---|---|
| G1 | Publish `jss-devtools` to npm public registry | `npm i -g jss-devtools` works; bin `jss-devtools` callable |
| G2 | Subcommand tree mirrors Docker UX | `jss-devtools <sub> --help` prints usage for every subcommand |
| G3 | MVP commands shipped | `update`, `upgrade`, `downgrade`, `ls`, `help`, `version`, `scaffold init` |
| G4 | Test coverage baseline | Vitest suite covers core command paths; CI green |
| G5 | Node 24 LTS baseline | `engines.node` = `>=24.0.0`; tested on v24.19.0 |

## Non-Goals (MVP)

- No GUI / TUI mode
- No plugin system (future)
- No monorepo / workspace awareness (future)
- No auto-update mechanism for the CLI itself (future)

## Target User

- JavaScript / TypeScript developers
- Comfortable with npm/pnpm, terminal-first workflow
- Wants one CLI to handle many small stack-management tasks

## Author & Ownership

- Owner: `jjuidev` (GitHub: `jjuidev`)
- Org: `jearax`
- Repo: `jss-cli`
- Package: `jss-devtools`

## Open Decisions

| Topic | Decision | Status |
|---|---|---|
| Build/bundler | bun / esbuild / tsup / tsdown / rollup / vite | researching |
| Linter / formatter | ESLint + Prettier (revised from Biome, 2026-08-21) | locked |
| License | TBD (likely MIT) | open |
| CI provider | TBD (GitHub Actions assumed) | open |
| Release tooling | TBD (changesets / release-please) | open |