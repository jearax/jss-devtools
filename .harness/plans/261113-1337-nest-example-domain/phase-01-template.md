---
phase: 1
title: "Template: versioning and the domain"
status: done
---

# Phase 1: template, versioning and the domain

Work inside `templates/nest/`. Read decision 0050 and `.harness/docs/nest-template-traps.md` first.

## Steps

1. **Setup.** Add `src/app/app.setup.ts` exporting `setupApp(app, configService)`: CORS from
   `configService.corsOrigin` and `app.enableVersioning({ type: VersioningType.URI, defaultVersion: API_DEFAULT_VERSION })`.
   `main.ts` calls it; every e2e spec calls it after `createNestApplication()`. The health
   controller gets `@Version(VERSION_NEUTRAL)` so `/health/ready` keeps its path.
2. **Helper.** `HelperService.uuid()` returns `randomUUID()` from `node:crypto`; add it to the
   helper's spec if one exists, else a small one.
3. **Domain** `src/domains/learning/course/`:
   - `entities/course.entity.ts`: `type Course = { id; title; description; createdAt; updatedAt }`.
   - `dtos/create-course.dto.ts`: a zod schema (title min length, description optional, …) and its
     inferred type; `dtos/update-course.dto.ts`: `createCourseSchema.partial()` refined to reject an
     empty body.
   - `repositories/course.repository.ts`: a `Map<string, Course>` seeded by copying a hardcoded
     list on construction (a shared array would leak writes across apps); ids from
     `helperService.uuid()`.
   - `services/course.service.ts`: `list`, `detail`, `create`, `update`, `delete`; a missing id
     throws `NotFoundException('course.not_found')`.
   - `course.controller.ts`: `@Controller('courses')`, methods `list`, `detail`, `create`,
     `update`, `delete`; bodies through `@Body({ schema })`; `DELETE` answers 200 with `data: null`.
   - `course.module.ts`, imported by `AppModule`.
   - Field names follow the injected class (`courseService: CourseService`).
4. **i18n.** `src/core/i18n/locales/{en,vi}/course.json` with `not_found` (and any success message
   the controller names through `@ResponseMessage`).
5. **Tests.** `services/course.service.spec.ts` (unit); `test/course.e2e-spec.ts` covering every
   route and status, 404 in `vi` and `en`, and validation: missing field, wrong type, too short,
   `PATCH` with an empty body, each message checked in `vi` and `en`. Move what `_sample` proved in
   `test/app.e2e-spec.ts` here, then delete `_sample` and `src/domains/.gitkeep`.

## Validation

From `templates/nest`: `pnpm exec tsc --noEmit -p tsconfig.json`, `pnpm exec eslint src test`,
`pnpm exec prettier --check .`, `pnpm exec vitest run`, `pnpm exec vitest run -c vitest.config.e2e.ts`.
Then `curl` a built app (`APP_PORT=<free> node dist/main.js`) once per route and stop it.

## Risk

A spec that skips `setupApp` sees no `/v1` routes and fails with 404; that is the guard working.
