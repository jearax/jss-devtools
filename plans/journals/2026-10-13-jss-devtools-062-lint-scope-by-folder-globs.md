---
title: "jss-devtools 0.6.2: lint scope by folder globs"
date: 2026-10-13
summary: Replaced hard-coded agent-dir ignores with shared folder globs; fixed lint-staged matchBase leak
---

# jss-devtools 0.6.2: lint scope by folder globs

## What happened
User rejected 0.6.1's hard-coded `.claude/.agentkit/.harness` ignores as too rigid; scope should live in editable folder globs.

## Change (commit f160ac0, tag v0.6.2)
- New `src/commands/init/generators/lint-globs.ts` feeds eslint `files`, `lint`/`format` scripts and lint-staged.
- Folders: src, lib, app, server, bin, scripts, config, test, tests, spec, __tests__, e2e + root. Extensions: ts, mts, js, mjs.
- `.cjs`/`.cts` excluded: verified they fail `@typescript-eslint/no-require-imports` under the ESM-only house rules.
- lint-staged root glob `./*.{...}`: lint-staged enables `matchBase` for slash-less globs (`lib/matchFiles.js:16`), so `*.{ts,mjs}` matched staged files in every dir, including `.claude/`.

## Verification
Packed tarball + published npm 0.6.2: 300 dirty files in agent dirs → lint 0.43 s exit 0; errors in `spec/` caught; empty project exit 0; lint-staged with staged `.claude/` files exit 0. Release + CI green, npm latest 0.6.2.

## Gotcha
`pnpm version` refuses an untracked file in the tree; a failed `git push origin main vX` with a missing tag pushes nothing (atomic refspec failure).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
