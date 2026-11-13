---
title: "init --framework nest creates an ESM Nest 12 app"
description: "Add the nest preset to jss-devtools init, in create mode and with --monorepo, copied from the real project kept in templates/nest/."
status: done
priority: P1
effort: 4d
branch: main
tags: [feature, cli, init]
blockedBy: []
blocks: []
created: 2026-11-12
---

# init --framework nest creates an ESM Nest 12 app

## Overview

`init <dir> --framework nest` (and with `--monorepo`, the app at `apps/nest`) writes a Nest 12
ESM app with the jss toolchain and the harness: `src/main.ts`, `app/`, `core/{config,logger,i18n,
database,helper}`, `domains/`. zod validates env and requests through Nest's Standard Schema
support; `@nestjs/i18n` translates the issues per request. Without `--framework nest`, init writes
exactly what it writes today.

- Policy: [decision 0047](../../decisions/0047-init-nest-preset.md), which partly supersedes
  [0030](../../decisions/0030-init-node-preset.md).
- Contract and evidence: [brainstorm report](../reports/brainstorm-261112-1953-init-nest-preset.md).
  Read it before phase 1, including the corrections to the reference template.
- Approach: `templates/nest/` at the repository root is a real Nest project, the pinned
  `nest new` output edited to the contract. The build embeds it in the bundle; init copies it,
  substitutes the project name, and adds the shared toolchain from the existing templates.
  init never runs `nest new`.

## Phases

| #   | Phase                                                         | Status  |
| --- | ------------------------------------------------------------- | ------- |
| 1   | [The templates/nest project](./phase-01-decision-and-proof.md) | Done |
| 2   | [Embedding and pins](./phase-02-templates-and-pins.md)        | Done    |
| 3   | [Init wiring](./phase-03-init-wiring.md)                      | Done    |
| 4   | [End-to-end proof and docs](./phase-04-e2e-and-docs.md)       | Done |

Phases run in order; each depends on the one before. Phase 1 changes no file under `src/`; it creates `templates/nest/`.

## Success Criteria

- [x] `init my-api --framework nest --pm <pm> -y` for pnpm, npm, yarn 1 and bun writes the tree in
      the report; `--dry-run` lists the same paths with `+` and writes nothing.
- [x] In the generated app: install, `lint`, `typecheck`, `build`, `test`, `test:e2e`, and the built
      app answers `GET /health/ready` 200; a bad request body answers 400 with Vietnamese messages
      under `Accept-Language: vi` and English under `en`. Proven by `INIT_E2E=1` per manager.
- [x] The same with `--monorepo --framework nest` through turbo, app at `apps/nest`.
- [x] Existing mode with `--framework nest` exits 1 before any write, naming the create command.
- [x] `init` with `node` (both modes, with and without `--monorepo`) is byte-for-byte unchanged:
      existing plan, template and e2e tests pass without edits to their expectations.
- [x] Generated project passes `prettier --check .` right after init (decision 0046).
- [x] The built `dist/cli.mjs` still runs with no `node_modules` beside it (`tests/bundle.test.ts`).
- [x] Every Nest version has one home: the pin script writes `templates/nest/package.json`.
- [x] `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, plus the site sequence.

## Constraints

- Files under 200 lines (user rule): `plan.service.ts` (385), `preflight.service.ts` (384),
  `init.command.ts` (340) and `scripts/pin-node-preset.mjs` (394) are already over; put Nest logic
  in new files and do not grow them beyond a dispatch line.
- Versions move only through the pin script, older than `minimumReleaseAge`.
- The repository's own lint, typecheck, architecture tests and Prettier must not reach into
  `templates/nest/`; it is checked as a generated project instead.
- Decisions 0024 (role suffixes), 0025 (`@/`), 0031 (the CLI never commits), 0046 (format step).

## Validation Log

### Planner review (2026-11-13, after phase 4)

- Pins: phase 1 had left `^12.5.0` on four `@nestjs/*` packages published hours earlier, so pnpm
  wrote `minimumReleaseAgeExclude` entries; phase 2's pin script now picks 12.4.2, inside
  `@nestjs/i18n`'s `^12.1.0` peer, and no exclude remains.
- The logger's `/health` prefix match also silenced `/healthy-users`; fixed with a test.
- Two cooker reports claimed `pnpm lint` green while it failed on formatting
  (`tests/help-colours.test.ts`, then three files after the review fix); fixed with `eslint --fix`.
- Review fixes: the shared toolchain entries now live once, in
  `shared-toolchain-plan.service.ts`; the Nest manifest no longer carries `tsx` or `tsc-alias`.
- Old test diffs touch only the `--help` block and the "Only node and nest are" hint; no node plan
  expectation changed.
- Verified by the planner: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (513 passed,
  19 skipped); the site sequence (123 passed); `INIT_E2E=1` for the nest, single and monorepo
  suites, 19 passed in 145 s with bun 1.3.8, pnpm 11.24.0, yarn 1.22.22 and npm 11.19.1 on PATH;
  a pnpm `--monorepo --framework nest` repo through turbo lint, typecheck, build, test 8/8,
  test:e2e 7/7, `GET /health/ready` 200, `prettier --check .`.

### Session 1 (2026-11-12)

- Q: generate with `nest new` at init, or ship the files? A: "Template trong code", then "Giống
  --monorepo nhưng sẽ có kiểu wraper folder lại … template/nest/", at "templates/nest/ ở root".
- Q: which modes? A: "Create + --monorepo"; existing mode with nest exits 1.
- Q: logger? A: "nestjs-pino"; "Code logger trong template của tôi chỉ tham khảo nha, viết best lại
  theo ý của bạn, xử lý luôn phần dev mode với pino pretty nha" (phase 1 step 10).
- Q: must the app boot without an `.env` file? A: "Chạy được không cần .env": defaults for every
  variable, `DATABASE_URL` optional until a driver exists.
- Red team: `templates/` must stay out of the repository's ESLint, tsconfig, Prettier,
  architecture scanner and the pre-commit hook (phase 1 step 8); the template ships no `.env` file;
  the sample validated route lives in the e2e spec, not the app.
