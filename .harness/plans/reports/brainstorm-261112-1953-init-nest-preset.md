# Brainstorm: the `init --framework nest` preset

Status: contract answered by the user (2026-11-12), ready for a decision and a plan. Not implemented. Builds on the
monorepo work ([decision 0045](../../decisions/0045-init-monorepo-creates-a-turborepo.md)): with
`--monorepo`, the app lands at `apps/nest`.

## Conflict with a decision in force

[Decision 0030](../../decisions/0030-init-node-preset.md) builds only `node`; `--framework nest`
exits 1 today ("Framework nest is not supported yet"). This preset needs a new decision. The ESM
choice below also departs from [0028](../../decisions/0028-extensionless-imports.md) for Nest
projects: generated imports carry `.js`.

## The user's intent

> "init trước dựa trên nest CLI, none-interactive … src/{app,core,domains}/, src/main.ts"

> "Không phải scaffold full như repo refs đâu nha, đại loại là base-on concept `modular`, DI
> (inject dependency) của nest"

The reference is the user's own template, `dokploy/ejs-temp/templates/nest` (Nest 11, CommonJS,
TypeORM, multi-tenant RLS, i18n, eight helper services). It is a source of conventions, not a
file set to copy.

## Evidence (run on 2026-11-12)

- `@nestjs/cli` 12.0.12: `nest new <name> -p <pm> --skip-git --skip-install --no-observe
  < /dev/null` exits 0 with no prompt. Without `--no-observe` it asks about `@nestjs/observe`;
  without `--skip-git` it runs git, which decision 0031 forbids for the CLI. Schematics ship
  inside the pinned CLI, so the generated file set is reproducible, unlike `create-turbo`.
- Nest 12 generates ESM (`type: module`, `nodenext`, `.js` imports), oxlint, vitest 4,
  `AGENTS.md`, `.gitattributes`, `app.service.ts`, `test/app.e2e-spec.ts`.
- `@/*` paths with `.js` suffixes typecheck, and `nest build` rewrites them to relative paths in
  ESM output; the app starts and serves `GET /`. Extensionless `@/` imports fail under ESM with
  `TS2307`. CommonJS with extensionless `@/` also built and ran on Node 24, because Node can
  `require` the ESM-only `@nestjs/core` 12; the user chose ESM anyway.
- tsx runs on esbuild, which does not emit decorator metadata, so constructor injection by type
  breaks under `tsx watch`. `dev` is `nest start --watch`, as the reference does.

## User answers (2026-11-12)

> Module system: "ESM + @/ có đuôi .js"

> `src/core/`: "config, logger, database (boilerplate), helper (boilerplate)"

> Database: "Không ORM, chỉ khung"

> Tests: "Giữ vitest của Nest"

> Linter: "Thay bằng ESLint preset"

> Database and helper frames: "Module + 1 thành viên" — each a `@Global()` module that `AppModule`
> imports, with one small working provider, so the frame shows the DI pattern.

> Validation and i18n: "zod, dịch theo request, cho thêm core/i18n đi" — zod for the env schema and
> for request schemas, messages translated per request language.

## Outcome so far

```text
<project>/                 templates/nest/ copied, plus the shared jss toolchain
├─ nest-cli.json, tsconfig.json, tsconfig.build.json, vitest.config.ts, vitest.config.e2e.ts
├─ eslint.config.mjs       the jss preset replaces .oxlintrc.json and the oxlint dependencies
├─ test/app.e2e-spec.ts    targets the health endpoint
└─ src/
   ├─ main.ts             bootstrap: ConfigService for the port, the pino logger
   ├─ app/                app.module.ts, app.controller.ts (GET /health/ready); no app.service.ts
   ├─ core/
   │  ├─ config/          @Global ConfigModule, typed ConfigService, env validated by a zod schema
   │  ├─ logger/          @Global LoggerModule on nestjs-pino
   │  ├─ i18n/            @nestjs/i18n, en and vi messages, zod issues translated per request
   │  ├─ database/        @Global module, one DatabaseService with init/destroy hooks, no ORM
   │  └─ helper/          @Global module with one small helper service
   └─ domains/.gitkeep    feature modules by bounded context
```

Superseded by [decision 0047](../../decisions/0047-init-nest-preset.md): the files live in
`templates/nest/`, modelled on the pinned `nest new` output; init never runs `nest new`.

## Recommended adjustments to the reference

- Keep `domains/`, and fix the reference's `STRUCTURE.md`, which says `modules/`.
- Keep the service rule: one service at the module root, two or more in `services/`. Ship it in
  the generated project's agent instructions so agents follow it.
- Keep `@Global()` for config and logger only.
- Drop the default `AppService`; the health check is the app controller's only route.

## Validation and i18n (evidence, run on 2026-11-12)

Run against `@nestjs/common` 12.5.0, `@nestjs/config` 12.1.1, zod 4.4.3, yup 1.7.1, TypeScript
6.0.3, in a compiled Nest app and plain scripts.

- Nest 12 takes a Standard Schema in both places: `ConfigModule.forRoot({ validationSchema })`
  for the env, and `StandardSchemaValidationPipe` with `@Body({ schema })` for requests. No custom
  pipe and no `nestjs-zod`. The reference's own `ValidationPipe(schema)` is no longer needed.
- Through Standard Schema, zod hands the pipe its full issue (`code`, `origin`, `format`,
  `minimum`); yup hands only `message` and `path`. Translating late, in the pipe's
  `exceptionFactory`, by the request's language therefore works with zod and not with yup. This
  decided zod.
- `class-validator` still works through the old `ValidationPipe` (optional peers of
  `@nestjs/common` 12); `class-transformer`'s latest release, 0.5.1, dates from 2022.
- zod 4.4.3 and valibot 1.5.0 ship a `vi` locale, both machine-like and mixing English type
  names; valibot's echoes the user's input. yup and joi ship none. Messages are written by hand.

Corrections to carry over from the reference, not copy:

- Its comment says zod 4's `customError` has no `code` for `invalid_format` and `too_small`.
  False on 4.4.3: `customError` receives the issue itself, with the right `code`, `origin` and
  `format` (`ctx.iss` is the zod 3 shape). Translating in the filter or pipe is still right, for a
  different reason: only there is the request's language known.
- One message key per `code` is too coarse: `too_small` covers strings, numbers and arrays. Key by
  `code` and `origin` or `format` (`too_small.string`, `invalid_format.email`).
- `validation.required` is dead: zod 4 has no `required` code; a missing field is
  `invalid_type` with `input` undefined. `{expected}` puts English type names into Vietnamese.
  The `received` argument never exists on a zod 4 issue.
- Keep its exclusion of `unrecognized_keys`' `keys`, which carry user input.

## Nest's generated `AGENTS.md`

> "Xóa hẳn" (user, 2026-11-12): the preset deletes it and carries nothing over. It held a
> `llms.txt` pointer, the first-party package list, ESM rules and a NestJS Observe section.

## i18n: the first-party `@nestjs/i18n`

> "@nestjs/i18n" (user, 2026-11-12), over the community `nestjs-i18n` the reference uses.

- `@nestjs/i18n` 0.0.3 (published 2026-11-06; 0.0.1 on 2026-09-29) ships
  `I18nStandardSchemaValidationPipe`, an extension of Nest's `StandardSchemaValidationPipe`, and
  `translateStandardSchemaIssues`. It looks up `<code>.<format>`, then `<code>.<origin>`, then
  `<code>`, with `i18nIssueMessage(key)` for a per-field message and `{count}` plurals. That
  replaces the reference's hand-written zod error map.
- Nest 12's generated `AGENTS.md` names it under "Translations".
- Risks the plan must handle: a 0.x API; `class-validator ^0.14.0` is a peer dependency, so check
  whether it is optional before the preset installs it; pin it through the pin script, which
  respects `minimumReleaseAge`. Nothing here was run yet: prove it in a scratch app first.

## Open questions, to ask one at a time when the plan needs them
None. Every question raised so far is answered.
