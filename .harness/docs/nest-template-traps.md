# Nest template traps

Facts about `templates/nest/` that cost real time when missed. Each names the file that proves it.
Policy lives in decisions [0047](../decisions/0047-init-nest-preset.md) and
[0049](../decisions/0049-nest-response-envelope.md).

## Build and lint

- `dev` is `nest start --watch`, never tsx: esbuild emits no decorator metadata, so constructor
  injection breaks (`templates/nest/package.json`).
- ESM with `nodenext`: `@/` imports carry `.js`. Injected classes stay value imports, so
  `consistent-type-imports` is off in the template's ESLint (`templates/nest/eslint.config.mjs`).
- URI versioning applies to every controller, test-only ones included: an e2e request to a spec
  controller under `setupApp` is `/api/v1/_probe`, not `/api/_probe`
  (`templates/nest/src/app/app.setup.ts`, `templates/nest/test/app.e2e-spec.ts`).

## Conventions (user)

- An injected field is named after its class in camelCase:
  `private readonly helperService: HelperService`, never `helper`
  (`templates/nest/src/app/app.controller.ts`).
- Shared, non-module HTTP pieces live in `src/app/<role>/` (`decorators/`, `schemas/`, …); the user
  chose this over Nest samples' `src/common/`, so do not reopen it. A `PATCH` DTO is
  `partialUpdate(createSchema)` (`templates/nest/src/app/schemas/partial-update.schema.ts`), never
  `@nestjs/mapped-types`, which needs class-validator DTOs.

## Libraries

- On Express, `setGlobalPrefix` sends any path outside the prefix and its `exclude` list to
  Express's HTML 404, past every Nest filter; an envelope there needs a fallback of its own
  (decision 0051). `exclude` is matched without the version segment.
- Nest runs global filters last-registered first, so a type-specific `APP_FILTER` goes after the
  `AllExceptionsFilter` catch-all, or the catch-all swallows its exceptions
  (`templates/nest/src/app/app.module.ts`).
- `@nestjs/config` `envFilePath`: the first file holding a variable wins, and a variable already in
  `process.env` beats every file; list the most specific file first
  (`templates/nest/src/core/config/config.module.ts`).
- `@nestjs/i18n` 0.0.3: each `locales/<locale>/<ns>.json` is a namespace, and only nested objects
  traverse. Issues without a path stay untranslated, and translated messages drop their `path:`
  prefix, so field paths survive only through a custom `exceptionFactory`
  (`templates/nest/src/app/exceptions/validation.exception.ts`). Evidence:
  [proof report](../plans/reports/proof-261112-nest-template.md).
