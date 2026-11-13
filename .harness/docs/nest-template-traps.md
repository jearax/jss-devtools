# Nest template traps

Facts about `templates/nest/` that cost real time when missed. Each names the file that proves it.
Policy lives in decisions [0047](../decisions/0047-init-nest-preset.md) and
[0049](../decisions/0049-nest-response-envelope.md).

## Build and lint

- `dev` is `nest start --watch`, never tsx: esbuild emits no decorator metadata, so constructor
  injection breaks (`templates/nest/package.json`).
- ESM with `nodenext`: `@/` imports carry `.js`. Injected classes stay value imports, so
  `consistent-type-imports` is off in the template's ESLint (`templates/nest/eslint.config.mjs`).

## Conventions (user)

- An injected field is named after its class in camelCase:
  `private readonly helperService: HelperService`, never `helper`
  (`templates/nest/src/app/app.controller.ts`).

## Libraries

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
