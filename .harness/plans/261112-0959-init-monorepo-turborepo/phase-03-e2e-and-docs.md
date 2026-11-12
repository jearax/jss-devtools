---
phase: 3
title: "End-to-end proof and docs"
status: done
priority: P1
effort: "4h"
dependencies: [2]
---

# Phase 3: End-to-end proof and docs

## Goal

A real generated monorepo installs, lints, typechecks, builds, caches and runs with each package
manager, and the docs describe `--monorepo`.

## Files

- Create: `tests/init-monorepo.e2e.test.ts`, gated behind `INIT_E2E=1` like `tests/init.e2e.test.ts`.
  If its helpers (`run`, `available`, the temp root, `CLI`) are needed, move them to
  `tests/support/` and import them in both files rather than copying.
- Modify: `site/src/constants/reference.constant.ts` — the `init` options list gains
  `--monorepo`.
- Modify: `.harness/docs/system-architecture.md` (the init flow and its preflight),
  `.harness/docs/codebase-summary.md` (new files), `.harness/docs/project-roadmap.md` (done).

## Steps

1. **E2E**, for each manager on `PATH` (pnpm and npm required, yarn and bun skipped when absent,
   as the existing suite does <!-- Updated: Validation Session 1 - bun supported -->):
   - `node dist/cli.mjs init my-mono-<pm> --monorepo --pm <pm> -y`;
   - `<pm> run lint`, `<pm> run typecheck`, `<pm> run build` at the root, each exit 0;
   - a second `<pm> run build` whose output contains `FULL TURBO`;
   - `node apps/node/dist/main.js` prints the line in `apps/node/src/main.ts`;
   - `apps/node/package.json` has `name` `@my-mono-<pm>/node` and a `version`;
   - no `.git` commit exists (`git rev-list --all` is empty): the CLI never commits.
   If `lint` fails because ESLint does not match `apps/node/src`, fix the phase 1 ESLint globs;
   do not widen the test.
2. **Docs.** Describe the flag, the tree, create mode only, and the four managers. Link
   decision 0045. Keep each doc's existing structure; read it before editing.
3. **Site.** After editing `reference.constant.ts`, run the site sequence.

## Verification

- `pnpm build && INIT_E2E=1 pnpm test -- tests/init-monorepo.e2e.test.ts tests/init.e2e.test.ts`
  — report the real output per manager, including any skipped manager.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`

## Notes

- Push to `main` deploys the site (CLAUDE.md); this plan does not push. Commit the harness files
  from the brainstorm (decision 0045, the 0030 status, the decisions index, the report, the memory
  line) with this work.
