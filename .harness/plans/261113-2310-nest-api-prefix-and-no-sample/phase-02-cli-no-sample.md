---
phase: 2
title: "CLI: --no-sample"
status: done
---

# Phase 2: init --no-sample

## Steps

1. **Flag.** `src/commands/init/init.command.ts`: `.option('--no-sample', 'Do not write the example
   domain; nest only (default: written)')`, beside `--no-vscode`; add it to `InitOptions` and an
   example row. Validate before any write: `--no-sample` with a framework other than nest throws
   `CliError('--no-sample needs --framework nest')` (follow how existing-mode init rejects `--pm`).
2. **Plan.** `src/commands/init/services/nest-plan.service.ts`: when the sample is off, drop every
   template file of the example domain (`src/domains/learning/**`,
   `src/core/i18n/locales/*/course.json`, `test/course.e2e-spec.ts`), add `src/domains/.gitkeep`
   (empty), and remove `CourseModule` from `src/app/app.module.ts` (import line and `imports`
   entry). Keep `partialUpdate` and the rest of `src/app/`. A string edit must assert its match, so
   a template change fails a test instead of shipping a broken module. Same for `--monorepo`
   (`apps/nest/...`).
3. **Tests.** `tests/init-plan.service.test.ts`: the no-sample tree (single and monorepo) and the
   non-nest rejection. `tests/init-nest.e2e.test.ts`: a no-sample case that installs, lints,
   typechecks, tests, builds and serves `/health/ready`; the sample case probes
   `/api/v1/courses` (was `/v1/courses`).

## Validation

- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (typecheck errors only in the untracked
  `my-app/` are not yours)
- `INIT_E2E=1 pnpm vitest run tests/init-nest.e2e.test.ts` with pnpm, npm, yarn 1 and bun; check
  `<pm> --version` for each, a missing one is logged and passes.
