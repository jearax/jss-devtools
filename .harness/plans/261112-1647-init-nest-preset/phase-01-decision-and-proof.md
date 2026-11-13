---
phase: 1
title: "The templates/nest project"
status: done
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: The templates/nest project

## Goal

`templates/nest/` exists at the repository root: a real Nest 12 ESM project, the pinned
`nest new` output edited to the contract, that with the shared jss toolchain added installs,
lints, typechecks, builds, tests and serves. No file under `src/` changes.

## Context

- Read decision 0047 and the brainstorm report (including its corrections to the reference).
- `npx @nestjs/cli@12.0.12 new nest -p pnpm --skip-git --skip-install --no-observe < /dev/null`
  writes 17 files in under a second. Keep `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`,
  `vitest.config.ts`, `vitest.config.e2e.ts`, `.gitattributes`; delete `.oxlintrc.json`,
  `.prettierrc`, `AGENTS.md`, `README.md`, `app.service.ts`, `app.controller.spec.ts`; rewrite
  the rest.
- What belongs in the folder: every file that differs from the `node` preset, including the Nest
  `eslint.config.mjs` and `tsconfig*.json`. What does not: files the `node` preset already writes
  identically (`.prettierrc.json`, `.editorconfig`, `.prettierignore`, `commitlint.config.mjs`,
  husky hooks, `.vscode/*`, the harness). Compare byte for byte before deciding; `.gitignore` and
  `package.json` scripts are the likely differences.

## Steps

1. **Layout.** `src/main.ts`; `src/app/{app.module,app.controller}.ts` with `GET /health/ready`;
   `src/core/config` (`@Global`, typed `ConfigService`, zod env schema as `validationSchema`),
   `src/core/logger` (`@Global`, nestjs-pino; see step 10), `src/core/i18n` (`@nestjs/i18n`, `en` and `vi`),
   `src/core/database` (`@Global`, `DatabaseService` with `onModuleInit`/`onModuleDestroy`, no
   driver), `src/core/helper` (`@Global`, one small service), `src/domains/.gitkeep`;
   `test/app.e2e-spec.ts` against the health route; the zod-validated sample route lives in the
   spec itself, through Nest's testing module, so the app ships no route besides the health check.
   Every env variable has a default and `DATABASE_URL` is optional, so the app boots with no
   `.env` file.
2. **Project name.** `package.json` `name` is a fixed placeholder that keeps the project valid
   (for example `nest-app`); list every file that carries the project name, for phase 3 to
   substitute. Nothing else is templated.
3. **Module system.** ESM, `nodenext`, `experimentalDecorators`, `emitDecoratorMetadata`, `@/*`
   paths with `.js` imports. Prove `nest build` rewrites `@/` in `dist` and `nest start --watch`
   boots. Keep as many of the `node` preset's strict compiler options as Nest tolerates; record
   each one dropped and why.
4. **Type imports and DI.** With `verbatimModuleSyntax` and typescript-eslint's
   `consistent-type-imports`, an injected class imported as `import type` loses its runtime
   metadata. Find the configuration that keeps constructor injection working and lint green, and
   prove it with an injected service whose type comes from another file.
5. **ESLint.** Start from the `node` preset's config and require `.js` on relative and `@/`
   imports instead of forbidding it. Check `prefer-arrow-functions` and `import-x` against
   classes and decorators; record every rule change.
6. **Validation and i18n.** Global `I18nStandardSchemaValidationPipe` (or Nest's pipe plus
   `translateStandardSchemaIssues`), zod schema on `@Body({ schema })`. Record how `@nestjs/i18n`
   resolves the request language. Messages keyed `<code>.<format>`, `<code>.<origin>`, `<code>`;
   a missing field reads as required; no user input in any message. Avoid installing
   `class-validator` if its peer is optional.
7. **Proof harness.** In the scratchpad, copy `templates/nest/` plus the shared toolchain from a
   fresh `node dist/cli.mjs init scratch-node -y`, then run the checks with pnpm, npm, yarn 1 and
   bun. Record manager-specific needs (pnpm `allowBuilds`, yarn 1 `version`, bun and decorators).
8. **Repository isolation.** Exclude `templates/` from the root ESLint, `tsconfig.json`,
   Prettier and the architecture scanner, so `pnpm lint && pnpm typecheck && pnpm test` ignore it.
   Prove a commit that touches only `templates/nest/` passes the `pre-commit` hook: lint-staged's
   Prettier task matches `**/*.json`, and an ignored file passed explicitly must exit 0.
   The template ships no `.env`; an `.env.example` holds only names and safe defaults.
9. **Versions.** Record the exact version of every dependency in `templates/nest/package.json`,
   for phase 2's pin script.

10. **Logger, written fresh.** The reference's logger is input, not a source to copy. One
    `LoggerModule.forRootAsync` reading `ConfigService`: `LOG_LEVEL` (default `info`) and
    `LOG_FORMAT` (`json` | `pretty`, default `pretty` when `NODE_ENV` is `local` or `dev`, else
    `json`). Pretty output goes through the `pino-pretty` transport, a devDependency loaded only
    when `pretty` is chosen, so a production install without devDependencies still starts.
    Redact credentials in request logs (`authorization`, `cookie`, `set-cookie` headers), give
    each request an id (reuse an incoming `x-request-id`), keep the health route out of the
    request log, and make `main.ts` use the pino logger from the first line (`bufferLogs`).
    Prove both formats: `dev` prints coloured lines, a `NODE_ENV=prod` build prints JSON, and a
    request with an `authorization` header logs it redacted.

## Output

`templates/nest/` committed-ready, and the report
`.harness/plans/reports/proof-261112-nest-template.md`: the tree, the per-manager commands and
their real output, each deviation from the brainstorm report and its reason.

## Verification

- Per manager, on the scratch copy: install, `lint`, `typecheck`, `build`, `test`, `test:e2e`
  exit 0; `node dist/main.js` answers `GET /health/ready` 200; a bad body answers 400 in `vi` and
  in `en`; `prettier --check .` is clean.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the repository root, unchanged.

## Failure protocol

If `@nestjs/i18n` 0.0.3 cannot translate zod issues per request, stop and report to the planner
with the evidence; do not switch library without the user.
