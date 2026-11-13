---
id: 0051
title: The Nest preset serves its API under /api, keeps the envelope on every 404, and init --no-sample drops the example domain
status: Accepted
date: 2026-11-13
supersedes: none
---

# 0051: The Nest preset serves its API under /api, keeps the envelope on every 404, and init --no-sample drops the example domain

## Context

[0050](./0050-nest-example-domain-and-uri-versioning.md) put the example domain at `/v1/courses`
with no global prefix. With `setGlobalPrefix` on the Express adapter, a path outside the prefix and
outside its exclusions never reaches Nest: Express answers it with an HTML 404 (measured on a built
app: `/_nowhere` and `/v1/courses` returned `text/html`), which breaks the envelope of
[0049](./0049-nest-response-envelope.md). Every user also deletes the example domain before real
work.

## Decision

- `setupApp` sets the global prefix `api`; the health routes are excluded and stay at
  `/health/ready`. The domain answers at `/api/v1/courses`. The version constant is
  `API_VERSION_DEFAULT`.
- Every 404 answers the translated JSON envelope, including a path outside `/api` and `/health`.
- `init --no-sample` (default: the sample is written) writes `src/domains/.gitkeep` instead of the
  example domain. It applies to `--framework nest` only; with any other preset `init` fails with a
  `CliError` and exit 1.

> "Chỗ app.setup.ts dùng thêm `setGlobalPrefix`" (user, 2026-11-13); prefix chosen: "'api', health
> excluded" (user, 2026-11-13)
>
> On the HTML 404 outside the prefix: "Envelope everywhere" (user, 2026-11-13)
>
> "những việc liên quan tới src/domains/\* thì tương tác với flag mới, tên là --no-sample (mặc định
> flase), flag đó chỉ tương tác với --framework nest thui á, --no-sample true thì chỉ có
> src/domains/.gitkeep" (user, 2026-11-13); without nest: "Reject with an error" (user, 2026-11-13)
>
> "API_DEFAULT_VERSION -> API_VERSION_DEFAULT" (user, 2026-11-13)

## Options considered

| Option                                 | Consequence                                                       |
| -------------------------------------- | ----------------------------------------------------------------- |
| Health under the prefix                | Lost: probes and the CLI serve test would move to `/api/health/…` |
| Accept Express's HTML 404 outside /api | Lost: chosen against; scanners and typos would see a non-envelope |
| `--no-sample` ignored without nest     | Lost: a typo or misuse would silently do nothing                  |

## Consequences

- Easier: a generated app starts empty with one flag; API routes are visibly separate from probes.
- Harder: the 404 fallback for paths outside the prefix runs outside Nest's router and must reuse
  the same translation as the exception filter.
- Enforced by: `templates/nest/test/*.e2e-spec.ts`, `tests/init-plan.service.test.ts`,
  `tests/init-nest.e2e.test.ts`, `tests/site-nest-docs.test.ts`.
