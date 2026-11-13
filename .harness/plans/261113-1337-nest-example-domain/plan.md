---
title: "The Nest preset ships the learning/course example domain behind /v1"
description: "Replace src/domains/.gitkeep with a REST CRUD example backed by an in-memory repository, add URI versioning, and carry the change through the CLI tests and the site docs."
status: done
priority: P2
effort: 1d
branch: main
tags: [feature, init, nest, site]
blockedBy: []
blocks: []
created: 2026-11-13
---

# The Nest preset ships the learning/course example domain behind /v1

## Overview

Policy: [decision 0050](../../decisions/0050-nest-example-domain-and-uri-versioning.md), on top of
[0047](../../decisions/0047-init-nest-preset.md) and [0049](../../decisions/0049-nest-response-envelope.md).
Template traps: [nest-template-traps.md](../../docs/nest-template-traps.md).

## Contract

- **Outcome:** a generated Nest app has `src/domains/learning/course/` answering
  `GET|POST /v1/courses` and `GET|PATCH|DELETE /v1/courses/:id` in the envelope, with translated
  validation and not-found messages; `/health/ready` is unchanged.
- **Constraints:** no new dependency; the default API version is a code constant
  (`API_DEFAULT_VERSION = '1'`), never an env variable: it marks which routes are v1 and is never
  bumped, a v2 is opt-in per route with `@Version('2')` (user confirmed). One `setupApp(app)`
  applies versioning and CORS for both `main.ts` and the e2e suites, so the tests run the
  production setup.
- **Non-goals:** a database, auth, pagination, a global `/api` prefix.
- **Acceptance:**
  1. Template: `tsc`, `eslint`, `prettier --check .`, unit and e2e pass; the course e2e covers each
     route, 404 `course.not_found` in `vi` and `en`, and the DTO validation cases below.
  2. `_sample` and `src/domains/.gitkeep` are gone; their coverage lives in the course e2e.
  3. CLI: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, and `INIT_E2E=1` nest suite on
     all four managers.
  4. Site: `/docs/nest` shows the domain and `/v1`; the site sequence and `tests/site-nest-docs.test.ts` pass.

## Phases

| #   | Phase                                                   | Status  |
| --- | ------------------------------------------------------- | ------- |
| 1   | [Template: versioning and the domain](./phase-01-template.md) | Done |
| 2   | [CLI tests and site docs](./phase-02-cli-and-site.md)   | Done |
