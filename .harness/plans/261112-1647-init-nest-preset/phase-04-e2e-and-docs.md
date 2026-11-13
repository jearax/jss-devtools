---
phase: 4
title: "End-to-end proof and docs"
status: done
priority: P1
effort: "1d"
dependencies: [3]
---

# Phase 4: End-to-end proof and docs

## Goal

A generated Nest app, single and monorepo, works end to end with each package manager, and the
docs describe the preset.

## Files

- Create: `tests/init-nest.e2e.test.ts`, gated by `INIT_E2E=1`, reusing `tests/support/init-e2e.ts`.
- Modify: `.github/workflows/` only if the gated suites run in CI today; otherwise state that the
  e2e stays local, as the existing ones do.
- Modify: `README.md`, `.harness/docs/system-architecture.md`, `.harness/docs/codebase-summary.md`
  (`templates/`, the new services, scripts and tests), `.harness/docs/project-roadmap.md`,
  `site/src/constants/reference.constant.ts`, `site/src/pages/Docs/pages/Init/` (keep each file
  under 200 lines; `Init.tsx` is at 199, so add a section file rather than grow it).
- Modify: `CLAUDE.md` outside the harness block — the "Where things are" table gains
  `templates/`.

## Steps

1. E2E per manager on `PATH`: `init my-nest-<pm> --framework nest --pm <pm> -y`; `lint`,
   `typecheck`, `build`, `test`, `test:e2e`; start `node dist/main.js` on a free port, `GET
   /health/ready` 200, a bad body 400 with Vietnamese under the `vi` resolver phase 1 recorded and
   English under `en`; stop the process; `prettier --check .`; no git commit. The same for
   `--monorepo --framework nest` through turbo, with a cached rebuild.
2. Docs and site; run the site sequence.

## Verification

- `pnpm build && INIT_E2E=1 pnpm vitest run tests/init-nest.e2e.test.ts tests/init.e2e.test.ts tests/init-monorepo.e2e.test.ts`
  — the real output per manager, skipped managers named.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`

## Notes

- A push to `main` deploys the site; this plan does not push. Commit decision 0047, the report and
  the plan with the work.
