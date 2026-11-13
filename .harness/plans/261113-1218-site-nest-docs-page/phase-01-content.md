---
phase: 1
title: "Content and the drift test"
status: done
---

# Phase 1: content and the drift test

## Context

- `templates/nest/` is the app `init --framework nest` copies; read it, do not recall it.
- The current nest text: `site/src/pages/Docs/pages/Init/Init.constant.ts` (`INIT_NEST_PARAGRAPHS`)
  and `site/src/pages/Docs/pages/Init/InitNest.tsx`.
- A page's facts live in its own `<Page>.constant.ts`; a fact two routes share lives in
  `site/src/constants/` (see the header of `site/src/pages/Docs/Docs.constant.ts`).

## Steps

1. Create `site/src/pages/Docs/pages/Nest/Nest.constant.ts` with the section list and the facts:
   - `NEST_SECTIONS`: what-it-writes, environment, responses, language, health, scripts,
     monorepo (ids and titles, through `sectionMeta`).
   - The `src/` tree: from `ls -R templates/nest/src` (leave out specs).
   - The env table: name, default, meaning, from `templates/nest/.env.example` and
     `templates/nest/src/core/config/env.schema.ts`. The env file order from
     `templates/nest/src/core/config/config.module.ts`: `.env.<NODE_ENV>.local`,
     `.env.<NODE_ENV>`, `.env.local`, `.env`; the first file holding a variable wins, and a
     variable already set in the shell beats every file.
   - Three response examples copied from a real run: a 200 from `GET /health/ready`, a 400 from a
     bad body with `?lang=vi`, a 404 with `?lang=en`. Take them from the template's e2e
     (`templates/nest/test/*.e2e-spec.ts`) or from `curl` against `node dist/main.js`; never type
     them by hand.
   - The locale order: `?lang`, then `x-lang`, then `Accept-Language`; the curl lines.
   - Health: `@nestjs/terminus`, `GET /health/ready`, 503 with `data: null` when a check fails, and
     where a database indicator goes once a driver exists.
   - Scripts: from `templates/nest/package.json` `scripts`.
2. Add `tests/site-nest-docs.test.ts` to the CLI suite: parse `templates/nest/.env.example`
   (`NAME=value` lines) and the env table in `Nest.constant.ts`, and assert equal names, order
   and defaults. Read the site file as text if importing it breaks the import rules
   (decision 0025); keep the parse narrow and fail loudly when it finds no rows.
3. Shrink `INIT_NEST_PARAGRAPHS` to one paragraph that names the preset and links `/docs/nest`.
   Keep the `presets` table on the init page.

## Validation

- `pnpm vitest run tests/site-nest-docs.test.ts` passes, and fails after renaming one variable
  in a scratch copy of the constant (prove the guard, then revert).
- `pnpm --dir site typecheck` passes.

## Risk

A drift test that parses TypeScript text can pass on an empty match; assert a row count above zero.
