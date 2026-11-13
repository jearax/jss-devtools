---
id: 0050
title: The Nest preset ships one example domain, learning/course, behind URI version v1
status: Accepted
date: 2026-11-13
supersedes: none
---

# 0050: The Nest preset ships one example domain, learning/course, behind URI version v1

## Context

`templates/nest/src/domains/` held only a `.gitkeep`, so nothing showed the template's own
conventions (zod DTOs through `@Body({ schema })`, i18n keys as exception messages, the envelope of
[0049](./0049-nest-response-envelope.md)). They were proved only by a test-only `_sample`
controller. The routes also had no version, which is a breaking change to add once clients exist.

## Decision

- `src/domains/learning/course/` is a REST CRUD example with no database: a repository keeps the
  courses in memory, seeded from a hardcoded list; ids come from `HelperService`.
- Folder and class names are singular (`course/`, `CourseController`); the URL is the plural
  collection, `/v1/courses`.
- Controller methods are `list`, `detail`, `create`, `update`, `delete`. `DELETE` answers 200 with
  the envelope, never 204.
- Routes are URI-versioned with default version `1`; the health route stays version-neutral.
- The e2e suite tests the DTO validation, translated per request.

> "Nếu domains mẫu thì có cần database không? hay chủ controller, service (hard CUD json)?" (user, 2026-11-13)
>
> "randomUUID quăng vào helperService, test case validate với zod schema DTO (i18n) … CRUD chuẩn
> rest, tên method, list, detail, create, update, delete … Tôi nghĩ có nên thêm API version k?!" (user, 2026-11-13)
>
> "số ít cho folder, DELETE 200" (user, 2026-11-13)

## Options considered

| Option                       | Consequence                                                         |
| ---------------------------- | ------------------------------------------------------------------- |
| In-memory repository, seeded | No dependency or infrastructure; each e2e app starts from the seed  |
| JSON file persistence        | Lost: concurrent writes, read-only containers, tests dirty the file |
| A real database              | Lost: picks an ORM and a database, a policy of its own              |
| `DELETE` 204                 | Lost: Express drops a 204 body, so the envelope of 0049 disappears  |

## Consequences

- Easier: a generated app shows every convention in one folder; swapping storage touches only the
  repository.
- Harder: every user deletes or renames the example before real work.
- Enforced by: `templates/nest/test/course.e2e-spec.ts`, `tests/nest-template.test.ts`,
  `tests/site-nest-docs.test.ts`.
