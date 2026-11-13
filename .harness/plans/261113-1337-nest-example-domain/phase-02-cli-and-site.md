---
phase: 2
title: "CLI tests and site docs"
status: done
---

# Phase 2: CLI tests and site docs

## Steps

1. **CLI.** The bundle embeds the template, so `tests/init-plan.service.test.ts` expected trees and
   `tests/nest-template.test.ts` change with the new files; update the expectations, never weaken
   them. `tests/init-nest.e2e.test.ts` keeps probing `/health/ready`; add one `GET /v1/courses`
   200 probe on the served app.
2. **Site.** `site/src/pages/Docs/pages/Nest/`: the tree shows `domains/learning/course/`, a short
   section on the example domain and the `/v1` routes, and response examples captured from a real
   run. `tests/site-nest-docs.test.ts` must pass unchanged in its rules.
3. **Docs.** `README.md` nest paragraph and `.harness/docs/project-roadmap.md` nest section name the
   example domain and `/v1`.

## Validation

- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- `INIT_E2E=1 pnpm vitest run tests/init-nest.e2e.test.ts` with pnpm, npm, yarn 1 and bun on `PATH`
  (check `<pm> --version` for each; a missing one is logged and passes)
- `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`
- Screenshots of the changed bands, per `.harness/docs/site-screenshots.md`.
