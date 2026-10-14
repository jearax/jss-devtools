---
title: "jss-devtools 0.6.4: lint globs cover jsx and tsx"
date: 2026-10-14
summary: The shared lint extension list gained jsx and tsx, so React components are linted, formatted and checked by lint-staged
---

# jss-devtools 0.6.4: lint globs cover jsx and tsx

## What happened
The generated code glob was `{src,lib,app,server,bin,scripts,config,test,tests,spec,__tests__,e2e}/**/*.{ts,mts,js,mjs}`, so `.jsx`/`.tsx` files in those folders were skipped by `lint`, `format`, lint-staged and `eslint.config.mjs` `files`.

## Change (commit 7acd018, tag v0.6.4)
- `LINT_EXTENSIONS` in `src/commands/init/generators/lint-globs.ts` is `mjs, js, jsx, mts, ts, tsx`; every generated glob derives from it. CommonJS stays out.
- The repository's own lint-staged key and `format` script use the same list.

## Verification
- `tests/init-lint-staged-matching.test.ts` stages `src/view.tsx`, `app/page.jsx`, `vite.config.mts` (touched) and `.claude/.../ui.tsx`, `sub/widget.jsx`, `legacy.cjs` (not touched); it fails on the old list.
- E2E with the built CLI in a scratch project: `init --yes`, then `.jsx`/`.tsx` components lint with style errors only (no parse errors; the typescript-eslint parser handles JSX by extension), `format` fixes them, lint exits 0, and lint-staged formats a staged `src/c.jsx`.
- Clean clone: lint, typecheck, build, 181 tests pass. Release run 38526038011 green.

## Gotcha
- `tests/smoke.test.ts` runs the built `dist/`; after a version bump, `pnpm build` before `pnpm test` or it compares the old version.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
