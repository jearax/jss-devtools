# Proof: the templates/nest project (plan phase 1)

Phase: [phase-01-decision-and-proof.md](../261112-1647-init-nest-preset/phase-01-decision-and-proof.md) ·
Policy: [decision 0047](../../decisions/0047-init-nest-preset.md) · Contract: [brainstorm report](brainstorm-261112-1953-init-nest-preset.md)
Status: done. Every check was run for real; exit codes and outputs follow each claim.

## Outcome

`templates/nest/` exists at the repository root: a real Nest 12 ESM project, the pinned
`nest new` output (`npx @nestjs/cli@12.0.12 new nest -p pnpm --skip-git --skip-install --no-observe < /dev/null`,
exit 0, 17 files) edited to the contract. With the shared jss toolchain added, it installs, lints,
typechecks, builds, tests and serves on all four managers. No file under `src/` changed
(`git status --short | grep -cE '^\s*[AM]+\s+src/'` -> `0`), and HEAD is still `4b9bee3` - nothing committed.

## The tree

```text
templates/nest/
- .env.example            names and safe defaults only; no secrets, no env file shipped
- .gitattributes          nest new's own (* text=auto eol=lf)
- eslint.config.mjs       the node preset's config, adapted (see ESLint changes)
- nest-cli.json           assets: core/i18n/locales/**/* (locales copied into dist/)
- package.json            name placeholder "nest-app"; the only name-bearing file
- tsconfig.json           node preset strictness + Nest decorators/nodenext
- tsconfig.build.json     extends tsconfig.json, rootDir src, excludes test
- vitest.config.ts        named const + export (decision 0016)
- vitest.config.e2e.ts
- src/
  - main.ts               bufferLogs, pino logger from the first line, port from ConfigService
  - app/
    - app.module.ts       imports the five core modules; APP_PIPE = I18nStandardSchemaValidationPipe
    - app.controller.ts   GET /health/ready; injects HelperService (the DI proof)
  - core/
    - config/             @Global ConfigModule; ConfigService typed over envSchema.parse
    - logger/             @Global LoggerModule; loggerOptions factory; pino-pretty only when chosen
    - i18n/               I18nModule, JsonI18nLoader, locales/<locale>/validation.json, issue-keys.ts
    - database/           @Global DatabaseModule; DatabaseService with onModuleInit/Destroy, no driver
    - helper/             @Global HelperModule; HelperService (nowIso, parseJsonSafe)
  - domains/.gitkeep
- test/app.e2e-spec.ts    health route + the zod-validated sample route (spec-only, per contract)
```

## Per-manager results (all four green)

Setup for every manager: copy `templates/nest/`, add the shared toolchain files (`.prettierrc.json`,
`.editorconfig`, `.prettierignore`, `.gitignore`, `commitlint.config.mjs`, `.husky/`, `.vscode/`)
from a fresh `node dist/cli.mjs init scratch-node -y`, merge the `NODE_PRESET_DEPENDENCIES`
devDependencies, install, run. The template holds only Nest-specific dependencies; the shared ones
keep their one home in the node preset constants, and phase 3 merges them at init.

| Check                    | pnpm 11.24.0 | npm 11.19.1 | yarn 1.22.22 | bun 1.3.8  |
| ------------------------ | ------------ | ----------- | ------------ | ---------- |
| install                  | exit 0       | exit 0      | exit 0       | exit 0     |
| lint                     | exit 0       | exit 0      | exit 0       | exit 0     |
| typecheck                | exit 0       | exit 0      | exit 0       | exit 0     |
| test                     | 7 passed     | 7 passed    | 7 passed     | 7 passed   |
| test:e2e                 | 7 passed     | 7 passed    | 7 passed     | 7 passed   |
| build                    | exit 0       | exit 0      | exit 0       | exit 0     |
| GET /health/ready        | 200          | 200         | 200          | 200        |
| authorization redacted   | yes          | yes         | yes          | yes        |
| x-request-id reused      | yes          | yes         | yes          | yes        |

The serve runs used `NODE_ENV=prod node dist/main.js`. The bad-body 400s in vi and en are proven by
`test:e2e` (real HTTP through supertest), because the built app intentionally ships only the health
route - the zod-validated sample route lives in the spec, per the phase contract.

### Validation details

- Unit (7): env schema defaults, PORT coercion and bounds, unknown NODE_ENV/LOG_LEVEL rejected,
  LOG_FORMAT optional with NODE_ENV-driven default; logger options pretty-vs-json, redact paths,
  health-route exclusion, x-request-id reuse and length cap.
- E2E (7): health 200; valid POST 201; missing field -> 400 "Trường name là bắt buộc..." under
  Accept-Language vi, "The field name is required..." under en; bad email -> "phải là địa chỉ email
  hợp lệ"; short string -> "phải có ít nhất 2 ký tự"; out-of-range number -> "phải từ 18".
- Logger (step 10): NODE_ENV=prod prints one JSON object per line; NODE_ENV=local prints coloured
  pino-pretty lines; a request carrying `authorization` logs a redacted value; an incoming
  `x-request-id: proof-req-42` is reused as reqId; /health never appears in the request log.

## Proof-harness facts (scratch only)

- A bare install of the template alone fails at `prepare: husky` (chicken-egg; phase 3 merges the
  shared devDependencies into the manifest before install).
- pnpm 11 supply-chain policy: the four Nest packages published 2026-11-12 sit inside
  minimumReleaseAge; pnpm auto-adds minimumReleaseAgeExclude entries to pnpm-workspace.yaml on a
  fresh resolution (entries must be quoted, "@" opens no YAML scalar). Phase 2's pin script must
  record this for generated pnpm projects.
- yarn 1: husky prints ".git can't be found" in a non-git folder; init'd projects are git repos.
- LOG_FORMAT= (empty string) is rejected with a clear config-validation error; kept strict.

## Deviations from the brainstorm report

1. @nestjs/i18n 0.0.3's API differs from the report's description (drawn from community
   nestjs-i18n conventions): resolvers are `AcceptLanguageLocaleResolver`, the loader is
   `JsonI18nLoader` passed as an instance, the options key is `defaultLocale` (not
   fallbackLanguage), and catalogs load as `<path>/<locale>/**/*.json` where each file is a
   namespace (en/validation.json -> validation.*).
2. Catalog traversal requires nested objects; a flat "invalid_format.email" key is unreachable
   (I18nService.get walks dot-paths through nested objects). Because nested invalid_format makes
   the bare <code> candidate unresolvable, the pipe's issueKeys option supplies a final
   <code>.generic candidate and the catalogs hold too_small.{generic,string,number} etc.
3. translateStandardSchemaIssues only translates issues that have a path; an issue about the whole
   input keeps the library's message (documented in its source). Accepted for phase 1.
4. defaultIssueKeys is not exported from the package index, and @standard-schema/spec does not
   resolve from app code under a strict package manager (it sits only in @nestjs/common's own
   node_modules), so src/core/i18n/issue-keys.ts re-derives the candidates structurally.
5. POST answers 201 (Nest's default), not 200; the e2e expects 201.
6. __dirname is unusable in ESM with top-level await (ERR_AMBIGUOUS_MODULE_SYNTAX);
   import.meta.dirname instead.
7. export default defineConfig(...) violates the shared import-x/no-anonymous-default-export
   (allowCallExpression: false), so the vitest configs assign a named const first (decision 0016);
   the two vitest config files also joined tsconfig include, because the shared ESLint applies
   projectService to them.
8. nest build rewrites @/ to relative paths in dist (brainstorm evidence confirmed: no @/ remains
   and node dist/main.js runs).

## Steps 3-6: recorded decisions

Step 3 - tsconfig. Kept from the node preset: strict, noUncheckedIndexedAccess,
noImplicitOverride, noFallthroughCasesInSwitch, exactOptionalPropertyTypes, verbatimModuleSyntax,
forceConsistentCasingInFileNames, isolatedModules, resolveJsonModule, esModuleInterop and
allowSyntheticDefaultImports, skipLibCheck. Nest requirements: nodenext,
experimentalDecorators + emitDecoratorMetadata, strictPropertyInitialization: false (a relaxation
of strict:true, Nest's own default), declaration/removeComments/sourceMap/incremental.
Dropped: none. Proven: verbatimModuleSyntax and emitDecoratorMetadata TS-level compatible; DI works
- AppController injects HelperService from another file; app boots; e2e green on four managers.

Step 4 - type imports and DI. consistent-type-imports cannot apply here: Nest DI reads constructor
parameter types through emitDecoratorMetadata, which needs the injected class kept as a runtime
value; import type erases it. The rule is off in the nest ESLint config, with an explanatory
comment in the file. Injected classes are value-imported; interfaces keep import type.

Step 5 - ESLint. Three changes vs the node preset, everything else parity-checked:
1. Glob src,test instead of the broad folder list.
2. no-restricted-imports: @/ and relative imports require .js (negative-lookahead pattern); .ts is
   still forbidden.
3. consistent-type-imports: off (reason commented in the config).
   prefer-arrow-functions and import-x needed no change: the full node preset rule set lints the
   classes, decorators and DI wiring clean on all four managers.

Step 6 - validation and i18n. The global pipe is I18nStandardSchemaValidationPipe registered as
APP_PIPE with issueKeys: validationIssueKeys. Schemas arrive per route through @Body({ schema }) -
Nest 12's ParameterDecoratorOptions.schema, consumed by StandardSchemaValidationPipe from
parameter metadata; no custom pipe, no nestjs-zod. class-validator is an optional peer
(@nestjs/i18n peerDependenciesMeta) and is NOT installed. Language resolution: I18nModule is
global by default and mounts I18nMiddleware on every route; the middleware resolves the locale
from Accept-Language via AcceptLanguageLocaleResolver, then runs the rest of the pipeline inside
an AsyncLocalStorage locale context, so the pipe's validate() translates per request. Responses
carry Content-Language and Vary.

## Repository isolation and pre-commit proof (step 8)

- Root .prettierignore gained `templates/`; root tsconfig.json excludes `templates`; root
  eslint.config.mjs adds `templates/**` to globalIgnores (explicit; the lint globs never matched it).
- The architecture scanner reads only `src/` (tests/support/architecture-rules.ts, SRC_ROOT), so
  templates/ was already outside it; `pnpm test` (498 passed, 11 skipped) confirms.
- Pre-commit proof: staged templates/nest/nest-cli.json, ran `pnpm exec lint-staged run` - exit 0;
  Prettier skipped the explicitly passed ignored file, the eslint glob matched nothing under
  templates/. Unstaged afterwards; nothing committed.

## Versions recorded for the pin script (step 9)

Runtime (resolved on install, carets in the manifest):
@nestjs/common 12.5.0, @nestjs/core 12.5.0, @nestjs/platform-express 12.5.0,
@nestjs/config 12.1.1, @nestjs/i18n 0.0.3, nestjs-pino 5.3.1, pino 10.4.0, pino-http 11.0.0,
reflect-metadata 0.2.2, rxjs 7.8.2, zod 4.6.7.

Dev: @nestjs/cli 12.0.12, @nestjs/schematics 12.0.13, @nestjs/testing 12.5.0,
@types/express 5.0.6, @types/supertest 7.2.1, @vitest/coverage-v8 4.1.12, pino-pretty 13.2.0,
source-map-support 0.5.21, supertest 7.3.2, vite 8.3.8, vitest 4.1.12.

Shared toolchain devDependencies stay in NODE_PRESET_DEPENDENCIES (one home) and are merged at
init (phase 3).

## Repository checks (root)

- pnpm lint -> exit 0
- pnpm typecheck -> exit 0
- pnpm test -> exit 0 (31 files passed, 2 skipped; 498 passed, 11 skipped)
- pnpm build -> exit 0 (dist/cli.mjs 344.71 kB)

## Unresolved questions

- None blocking phase 1. Phase 2 must handle: the pin script owns templates/nest/package.json, and
  generated pnpm projects need the minimumReleaseAgeExclude handling recorded above.
