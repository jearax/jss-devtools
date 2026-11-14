# Cook: the Nest preset ships the learning/course example domain behind /v1

Plan: [261113-1337-nest-example-domain](../261113-1337-nest-example-domain/plan.md) — both phases
implemented and validated. Status marked done in `plan.md`. Nothing committed or pushed.

## Phase 1 — template

New in `templates/nest/`:

- `src/app/app.setup.ts`: `setupApp(app, configService)` (CORS + URI versioning) and
  `API_DEFAULT_VERSION = '1'`. `main.ts` calls it; `course.e2e-spec.ts` calls the same setup.
  `AppController` is `@Controller({ path: 'health', version: VERSION_NEUTRAL })`, so
  `/health/ready` keeps its path.
- `src/domains/learning/course/`: `entities/course.entity.ts`, `dtos/create-course.dto.ts`
  (title min 3, description optional), `dtos/update-course.dto.ts` (`partial()` refined with a
  `path: ['body']` so the empty-body issue stays translatable), `repositories/course.repository.ts`
  (a `Map` seeded by copying the hardcoded list), `services/course.service.ts` (list/detail/create/
  update/delete, missing id throws `NotFoundException('course.not_found')`), `course.controller.ts`
  (`@Controller('courses')`, `DELETE` on 200 with `@ResponseMessage('course.deleted')`),
  `course.module.ts` imported by `AppModule`.
- `HelperService.uuid()` (`node:crypto` `randomUUID`) + a small `helper.service.spec.ts`.
- `locales/{en,vi}/course.json`: `not_found`, `deleted`.
- `services/course.service.spec.ts` (unit); `test/course.e2e-spec.ts`: every route and status,
  404 in `vi` and `en`, validation (missing field, wrong type, too short, empty `PATCH` body) each
  in `vi` and `en`, plus a guard that `/health/ready` stays version-neutral. `_sample` and its
  tests are gone from `app.e2e-spec.ts` (the `/​_probe` 503 case stays); `src/domains/.gitkeep`
  deleted.

Two real bugs the checks caught: `vi.fn<[], T>` is gone in vitest 5 (single function type
argument), and spreading the optional DTO typed `title` as `string | undefined` — `update` now
merges field by field. ESLint also rejected the parent-relative `../` imports (0025's rule lives
in the template too); everything goes through `@/`.

## Phase 2 — CLI and site

- `tests/init-plan.service.test.ts`: the nest tree lists gained the 11 new files (single and
  `apps/nest`), `.gitkeep` removed — order kept, nothing weakened.
- `tests/init-nest.e2e.test.ts`: `serveAndStop` now also fetches `/v1/courses` and fails on a
  non-200 before stopping the app.
- `site/src/pages/Docs/pages/Nest/`: `NEST_TREE` shows the domain (the drift test enforces set
  equality with `templates/nest/src`); new section `the-example-domain` (paragraphs + a routes
  table from `constants/domain.constant.ts`); two real domain examples joined `NEST_RESPONSES`
  (DELETE vi 200, missing id en 404); search index picks the section up through `NEST_SECTIONS`.
- `README.md` nest paragraph and `.harness/docs/project-roadmap.md` nest section name the example
  domain, `/v1` and decision 0050.

## Validation (real output)

From the scratch project (a fresh CLI init with the new bundle, checks via `node_modules/.bin`
binaries after `pnpm exec`'s verify-deps auto-install pruned the toolchain twice):

- `tsc --noEmit -p tsconfig.json` → clean
- `eslint src test` → clean (after `--fix` folded formatting back into the template)
- `prettier --check .` → all files match
- `vitest run` → 22 passed
- `vitest run -c vitest.config.e2e.ts` → 23 passed
- `nest build` → exit 0; served on port 4147 and curled once per route: health 200, list 200,
  detail 200, POST 201 (uuid id), PATCH 200, DELETE vi 200 `Đã xóa khóa học.` `data: null`, then
  the deleted id answers 404 `The course was not found.` (`?lang=en`)

Repository:

- `pnpm vitest run tests/site-nest-docs.test.ts tests/init-plan.service.test.ts
  tests/nest-template.test.ts` → 3 files, 57 passed
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → all exit 0; **516 passed, 19 skipped**
- `INIT_E2E=1 pnpm vitest run --hookTimeout=120000 tests/init-nest.e2e.test.ts` → **1 file,
  8/8 tests passed**, no manager skipped (versions checked first: pnpm 11.24.0, npm 11.19.1,
  yarn 1.22.22, bun 1.3.8)
- `pnpm --dir site lint && typecheck && test && build` → all exit 0; 27 files, 128 tests
  (three prettier fixes along the way)

## Screenshots

`.harness/plans/261113-1218-site-nest-docs-page/screenshots/`: `desktop-tree-domain.png`,
`desktop-example-domain.png`, `desktop-responses-domain.png` (1280×800) and
`phone-example-domain.png` (390×844). Overflow check at 390: `scrollWidth 390 == clientWidth 390`;
the routes table scrolls inside itself like the env table (the prose `max-sm:overflow-x-auto`).

## Notes and limitations

- `pnpm exec` in a generated project triggers a verify-deps auto-install that pruned the merged
  toolchain out of `node_modules` (twice); run the template checks through `node_modules/.bin`
  binaries instead. Memory line added.
- The scratch probe project lives under
  `~/.claude/projects/-Users-<account>-Documents-jjuidev-tools-jss-devtools/scratchpad/nest-docs-probe/`
  and can be deleted.
- No version change happened, so the pin script was not touched.

## Unresolved questions

- None.

## Review fixes appended 261113 (round 2)

Four review findings, all fixed:

1. **The empty-PATCH message is actionable now.** `validationIssueKeys` tries `custom.<key>`
   first when a custom issue's `params.key` is a string; the refine passes
   `params: { key: 'empty_body' }`; `validation.json` turns `custom` into
   `{ generic, empty_body }` (`en` "Send at least one field to update.", `vi`
   "Cần gửi ít nhất một trường để cập nhật."; the generic texts kept). No issue-keys spec
   exists, so the course e2e covers the key path and asserts the new messages.
2. **`CourseService` timestamps through `helperService.nowIso()`** in create and update; the
   service spec's helper mock gained `nowIso`.
3. **`CourseRepository.save`** stores `stored` and returns a copy of it — no `as Course` cast,
   copies still at the boundary.
4. **The controller comment** keeps only the non-obvious half: `// DELETE answers 200: Express
   drops a 204 body, and the envelope with it.`

Verification: template checks in the scratch — `tsc --noEmit` clean, `eslint src test` clean
(one prettier fix in the e2e, folded back), `prettier --check .` clean, unit **22 passed**,
e2e **23 passed** (the two unit failures on the way were the spec's helper mock lacking
`nowIso`); `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → all exit 0, **516 passed,
19 skipped**. The site sequence was skipped: no site file changed — the response examples the
page shows are byte-identical and the drift guards (env, scripts, tree) do not read the
validation catalogs. Nothing committed or pushed.
