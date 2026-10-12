---
phase: 2
title: "Docs and release notes"
status: pending
effort: 1h
blockedBy: [phase-01]
---

# Phase 02: Docs and release notes

## Files

| Path | Change |
|---|---|
| `README.md` | Replace the "MVP Commands" block with the real commands (`init`, `version`, `help`); add an "Install / update / uninstall" section |
| `CHANGELOG.md` | `0.6.0` entry: breaking change, replacement commands, note that the old `conf` config file may remain on user machines |
| `docs/system-architecture.md` | Remove self commands from the diagram (~line 26) and the command tree (~lines 53-55); remove deleted core modules |
| `docs/code-standards.md:83` | Remove the non-TTY rule for self commands, or rewrite it for `init` only if still accurate |
| `docs/project-roadmap.md` | Strike `update/upgrade/downgrade` items (~lines 47-49) with the reason; mark "Auto-update of CLI itself" as won't do |
| `docs/project-overview-pdr.md` | G3 and the Version management goal: drop self-management, point to native commands |

## README: native command table

| PM | Install | Update | Uninstall |
|---|---|---|---|
| npm | `npm i -g @jjuidev/jss-devtools` | `npm i -g @jjuidev/jss-devtools@latest` | `npm rm -g @jjuidev/jss-devtools` |
| pnpm | `pnpm add -g @jjuidev/jss-devtools` | `pnpm add -g @jjuidev/jss-devtools@latest` | `pnpm remove -g @jjuidev/jss-devtools` |
| bun | `bun add -g @jjuidev/jss-devtools` | `bun add -g @jjuidev/jss-devtools@latest` | `bun remove -g @jjuidev/jss-devtools` |
| yarn 1 | `yarn global add @jjuidev/jss-devtools` | `yarn global upgrade @jjuidev/jss-devtools --latest` | `yarn global remove @jjuidev/jss-devtools` |

One-shot without installing: `npx @jjuidev/jss-devtools init ...`, `pnpm dlx`, `bunx`. Yarn 2+ only has `yarn dlx`.
Downgrade = install a specific version (`@0.5.10`).

Before writing the README, verify each command against official docs (npm folders/uninstall, pnpm
global packages, bun add/remove, yarn classic global). If a command cannot be verified, ask the
user instead of guessing.

## Steps

1. Verify the command table against official docs.
2. Update README, CHANGELOG, and the 4 docs files.
3. Re-grep: `grep -rnE "\b(upgrade|downgrade|uninstall)\b" README.md docs` should only show historical references or native commands.

## Commit and release

- `docs: replace self-management commands with native package manager commands`
- Release 0.6.0 via `docs/deployment-guide.md` (tag-based) **only with user approval**.
