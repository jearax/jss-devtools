---
phase: 1
title: "Template: prefix and the 404 envelope"
status: done
---

# Phase 1: template, prefix and the 404 envelope

Work in `templates/nest/`. Read decision 0051 and `.harness/docs/nest-template-traps.md` first.

## Steps

1. **Paths.** Move the probe requests in `test/app.e2e-spec.ts`, `test/response.e2e-spec.ts` and
   every route in `test/course.e2e-spec.ts` to `/api/v1/...`; health stays `/health/ready`.
2. **404 outside the prefix.** Measured: with Express, `/_nowhere` and `/v1/courses` answer
   Express's HTML 404 (Nest docs, "Global prefix": unmatched paths outside the prefix never reach
   Nest). Make them answer the 404 envelope, translated, through the same i18n resolution and
   envelope builder the exception filter uses. Prove the mechanism in a scratch copy first (an
   Express-level fallback registered from `setupApp`, a Nest middleware, or another route); pick
   the one that keeps `setupApp` the only place `main.ts` and the e2e suites share. Keep
   `/api/<unknown>` behaving as today.
3. **Tests.** E2e: a 404 outside the prefix answers JSON envelope in `vi` and `en`; the old
   `/v1/courses` is a 404 envelope; `/health/ready` has no prefix.

## Validation

From `templates/nest`: `pnpm exec tsc --noEmit -p tsconfig.json`, `pnpm exec eslint src test`,
`pnpm exec prettier --check .`, `pnpm exec vitest run`, `pnpm exec vitest run -c vitest.config.e2e.ts`.
Then a built app (`APP_PORT=<free> node dist/main.js`): `curl` `/health/ready`, `/api/v1/courses`,
`/_nowhere?lang=vi`, `/api/_nowhere?lang=en`, and check the content type is JSON on every one.
