# Cook: /api prefix, envelope on every 404, init --no-sample

Plan: [261113-2310-nest-api-prefix-and-no-sample](../261113-2310-nest-api-prefix-and-no-sample/plan.md) —
all three phases implemented and validated, status marked done. Nothing committed or pushed.

## Phase 1 — template: prefix and the 404 envelope

Built on the in-tree work (`setupApp` already had `setGlobalPrefix('api', { exclude:
['health/{*splat}'] })` and `API_VERSION_DEFAULT`; `partialUpdate` already existed):

- **404 mechanism (the offered options):** an Express-level fallback registered from `setupApp`
  (`app.use`), so `main.ts` and every e2e suite share exactly one setup. `reachesNest(path)` keeps
  the predicate derived from the prefix itself: `/_api` exact, `/api/…`, and `/health/…` (the
  exclusion glob) pass through to Nest; anything else is answered directly with the 404 envelope.
  The fallback reuses the template's own pieces: the exported `i18nLocaleResolvers` chain (the same
  array `I18nModule` registers) for `?lang` → `x-lang` → `Accept-Language`, `I18nService.translate`
  with the resolved locale (the catalogs' own `matchLocale` handles `vi-VN`), and the `ApiResponse`
  shape. No second copy of the resolution or the envelope exists. `/api/<unknown>` still goes
  through Nest's `AllExceptionsFilter` as before.
- `i18n.module.ts` exports `i18nLocaleResolvers` (the one resolution chain).
- The three e2e specs moved: course routes `/api/v1/...`, `/_probe` → `/api/v1/_probe` and
  `/_response` → `/api/v1/_response` (versioning applies `v1` to the spec controllers too — the
  first e2e run caught exactly that), the malformed-body probe to `/api/_nowhere`; the outside
  `/_nowhere` GETs stay unprefixed and now prove the fallback. New tests: a 404 outside the prefix
  answers the JSON envelope in `vi` and `en` (content-type asserted), and the unversioned
  `/v1/courses` answers the envelope as well.

Validation: `tsc --noEmit`, `eslint src test`, `prettier --check .`, unit `22 passed`, e2e
`25 passed` in the scratch project (checks via `node_modules/.bin` binaries — `pnpm exec` still
prunes the toolchain); then `nest build` and curl: `/health/ready` 200, `/api/v1/courses` 200 with
the seed, `/_nowhere?lang=vi` → `Không tìm thấy tài nguyên.`, `/api/_nowhere?lang=en` → `The
resource was not found.`, old `/v1/courses?lang=vi` → 404 envelope — **every answer
`application/json`**.

## Phase 2 — CLI: --no-sample

- `init.command.ts`: `--no-sample` beside `--no-vscode` and an example row. The plan's literal
  description wrapped mid-parenthesis and failed the repo's own help tests (`default:` must end a
  line), so the shipped text is `'Do not write the example domain (default: written)'` — nest-only
  stays documented on the site/README and is enforced by the error.
- `init.service.ts`: `--no-sample` with any framework other than nest throws
  `CliError('--no-sample needs --framework nest')` before anything is written.
- `nest-plan.service.ts`: with the sample off, the plan drops `src/domains/learning/**`,
  `*/course.json`, `test/course.e2e-spec.ts`, rewrites `app.module.ts` without the `CourseModule`
  import line and its `imports` entry (both matches asserted — a template change fails the plan
  instead of shipping a broken module), and adds an empty `src/domains/.gitkeep`. Same for
  `--monorepo` under `apps/nest/`. `partialUpdate` and the rest of `src/app/` stay.
- Tests: the no-sample tree assertions (single and monorepo) in `init-plan.service.test.ts`; the
  non-nest rejection went beside its siblings in `init.service.test.ts` (the phase named
  `init-plan.service.test.ts`, but `validateInitArguments` is `init.service`'s subject — noted as a
  small deviation). The init help expectations in `init.command.test.ts`, `bundle.test.ts` and
  `help-colours.test.ts` gained the new flag line and the re-padded examples.

Validation: `pnpm lint` exit 0, `pnpm typecheck` — the only errors are in the untracked `my-app/`
(the phase said they are not mine; zero errors elsewhere), `pnpm test` **519 passed, 23 skipped**,
`pnpm build` exit 0. `INIT_E2E=1 pnpm vitest run --hookTimeout=180000 tests/init-nest.e2e.test.ts`
→ **12/12 passed**, no manager skipped (versions checked first: pnpm 11.24.0, npm 11.19.1,
yarn 1.22.22, bun 1.3.8): sample single, sample monorepo (turbo cache) and the new `--no-sample`
case — tree asserted, prettier, lint, typecheck, test, build, serves `/health/ready` — each per
manager; the sample cases probe `GET /api/v1/courses`.

## Phase 3 — docs

- `/docs/nest`: the routes table is `/api/v1/courses`; the domain section states the `/api` prefix,
  the unprefixed health route, the 404 boundary and `--no-sample`; the response examples carry the
  re-captured curls (`/api/_nowhere`, `/api/v1/courses/...`) with outputs from the real run.
- The init options table gains `--no-sample` (`reference.constant.ts`).
- `README.md` nest paragraph names `/api/v1/courses`, the 404 boundary, `--no-sample` and 0051;
  `.harness/docs/project-roadmap.md` updated likewise.

Validation: `tests/site-nest-docs.test.ts` 3 passed; `pnpm --dir site lint && typecheck && test &&
build` all exit 0 (**128 tests**; two prettier fixes along the way).

## Screenshots

`.harness/plans/261113-2310-nest-api-prefix-and-no-sample/screenshots/`: `desktop-example-domain-api.png`
(the prefix paragraph, `--no-sample` note, `/api/v1` routes table), `desktop-init-options.png` (the
`--no-sample` row on the init page). Both reviewed; no overflow — the tables scroll inside
themselves as designed.

## Notes and limitations

- `--no-sample` is flag-only as decided; no prompt was added.
- The scratch probe project under
  `~/.claude/projects/-Users-tandm-Documents-jjuidev-tools-jss-devtools/scratchpad/nest-docs-probe/`
  can be deleted.

## Unresolved questions

- None.
