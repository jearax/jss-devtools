---
title: "Nest preset: /api prefix, envelope on every 404, init --no-sample"
description: "Finish the /api global prefix in the template, answer every 404 with the translated envelope, and add init --no-sample, through the CLI tests and the docs."
status: done
priority: P2
effort: 1d
branch: main
tags: [feature, init, nest, site]
blockedBy: []
blocks: []
created: 2026-11-13
---

# Nest preset: /api prefix, envelope on every 404, init --no-sample

## Overview

Policy: [decision 0051](../../decisions/0051-nest-api-prefix-and-no-sample.md), on top of
[0049](../../decisions/0049-nest-response-envelope.md) and
[0050](../../decisions/0050-nest-example-domain-and-uri-versioning.md). Template traps:
[nest-template-traps.md](../../docs/nest-template-traps.md).

Already in the working tree (do not redo): `setupApp` in `templates/nest/src/app/app.setup.ts`
sets `setGlobalPrefix('api', { exclude: ['health/{*splat}'] })`; the constant is
`API_VERSION_DEFAULT`; `app.e2e-spec.ts` and `response.e2e-spec.ts` now call `setupApp`, so five of
their probe requests fail on old paths. `partialUpdate` lives in
`templates/nest/src/app/schemas/partial-update.schema.ts`. Nothing is committed.

## Contract

- **Outcome:** a generated Nest app serves the domain at `/api/v1/courses`, health at
  `/health/ready`, and every 404 (inside or outside `/api`) as the translated envelope;
  `init --framework nest --no-sample` writes `src/domains/.gitkeep` and no example domain.
- **Constraints:** no new dependency; the 404 fallback reuses the template's i18n resolution
  (`?lang`, `x-lang`, `Accept-Language`) and the envelope shape, never a second copy of either;
  `--no-sample` is flag-only (no prompt), commander's `--no-sample`, and with any framework other
  than nest `init` throws a `CliError` (exit 1) before writing anything.
- **Non-goals:** moving `app/` to `common/` (user rejected), a prompt for the sample, Fastify.
- **Acceptance:**
  1. Template: `tsc`, `eslint`, `prettier --check .`, unit and e2e pass. E2e covers `/api/v1/...`
     routes, `/health/ready` unprefixed, and a 404 outside the prefix (`/_nowhere`, `/v1/courses`)
     answering JSON envelope in `vi` and `en`.
  2. CLI: `--no-sample` output tree has no `src/domains/learning/`, no `course.json`, no
     `test/course.e2e-spec.ts`, has `src/domains/.gitkeep`, and `app.module.ts` has no
     `CourseModule`; `--no-sample` with node fails exit 1 with the message from 0051.
     `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass.
  3. `INIT_E2E=1` nest suite on pnpm, npm, yarn 1, bun covers both sample and `--no-sample`
     (the generated no-sample app builds, tests and serves `/health/ready`).
  4. Site and docs name `/api/v1/courses`, the 404 boundary and `--no-sample`; the site sequence and
     `tests/site-nest-docs.test.ts` pass.

## Phases

| #   | Phase                                                      | Status  |
| --- | ---------------------------------------------------------- | ------- |
| 1   | [Template: prefix and the 404 envelope](./phase-01-template.md) | Done |
| 2   | [CLI: --no-sample](./phase-02-cli-no-sample.md)            | Done |
| 3   | [Docs: site and CLI](./phase-03-docs.md)                   | Done |
