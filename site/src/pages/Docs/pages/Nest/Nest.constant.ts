import { SectionMeta, sectionMeta } from '@/pages/Docs/Docs.constant';

/**
 * The sections of the nest page. The page asks for them by id, and the search index reads this
 * list, so a heading is declared once and never written out twice.
 */
export const NEST_SECTIONS = [
	{
		id: 'what-it-writes',
		title: 'What it writes'
	},
	{
		id: 'the-environment',
		title: 'The environment'
	},
	{
		id: 'the-responses',
		title: 'The responses'
	},
	{
		id: 'the-language',
		title: 'The language'
	},
	{
		id: 'the-health-route',
		title: 'The health route'
	},
	{
		id: 'the-scripts',
		title: 'The scripts'
	},
	{
		id: 'the-monorepo',
		title: 'The monorepo'
	}
] as const;

export type NestSectionId = (typeof NEST_SECTIONS)[number]['id'];

/** The metadata of one section of this page. */
export const meta = (id: NestSectionId): SectionMeta => {
	return sectionMeta(NEST_SECTIONS, id);
};

/** The `src/` tree `init --framework nest` writes, read from `templates/nest/src`; specs left out. */
export const NEST_TREE = `src/
  main.ts
  app/
    app.controller.ts
    app.module.ts
    decorators/response-message.decorator.ts
    exceptions/validation.exception.ts
    filters/all-exceptions.filter.ts
    interceptors/response.interceptor.ts
    interfaces/api-response.interface.ts
  core/
    config/config.module.ts
    config/config.service.ts
    config/env.schema.ts
    database/database.module.ts
    database/database.service.ts
    helper/helper.module.ts
    helper/helper.service.ts
    i18n/http-message.ts
    i18n/i18n.module.ts
    i18n/issue-keys.ts
    i18n/locales/en/http.json
    i18n/locales/en/validation.json
    i18n/locales/vi/http.json
    i18n/locales/vi/validation.json
    logger/logger.module.ts
    logger/logger.options.ts
    logger/logger.service.ts
  domains/.gitkeep`;

/** One row of the environment table: the variable, its default in `.env.example`, and what it does. */
export type NestEnvRow = {
	name: string;
	/** The value `.env.example` ships; an empty string is a variable the example leaves unset. */
	default: string;
	meaning: string;
};

/**
 * The environment variables, read from `templates/nest/.env.example` and
 * `templates/nest/src/core/config/env.schema.ts`. `tests/site-nest-docs.test.ts` asserts this
 * table stays equal to `.env.example`, in the same order with the same defaults.
 */
export const NEST_ENV_ROWS: readonly NestEnvRow[] = [
	{
		name: 'NODE_ENV',
		default: 'local',
		meaning: 'The environment the app runs in: `local`, `dev`, `test` or `prod`.'
	},
	{
		name: 'APP_PORT',
		default: '3000',
		meaning: 'The port the app listens on, from 1 to 65535.'
	},
	{
		name: 'APP_CORS_ORIGIN',
		default: '*',
		meaning: 'The origins CORS allows, comma-separated; `*` allows every origin.'
	},
	{
		name: 'LOG_LEVEL',
		default: 'info',
		meaning: 'The pino level: `fatal`, `error`, `warn`, `info`, `debug` or `trace`.'
	},
	{
		name: 'LOG_FORMAT',
		default: 'pretty',
		meaning: '`json` or `pretty`. Deleted, the app logs `pretty` in `local` and `dev`, `json` everywhere else.'
	},
	{
		name: 'DATABASE_URL',
		default: '',
		meaning:
			'The connection string. Set, it names where the driver in `core/database` connects; unset, the frame runs without a connection.'
	}
];

/** The paragraphs of the environment section, rendered through `RichText`. */
export const NEST_ENV_PARAGRAPHS: readonly string[] = [
	'The schema in `src/core/config/env.schema.ts` validates every variable with `zod` before the app reads one: an enum narrows the choices, and `APP_PORT` is coerced to a number and bounded.',
	'`src/core/config/config.module.ts` reads the files in this order: `.env.<NODE_ENV>.local`, `.env.<NODE_ENV>`, `.env.local`, `.env`. The first file holding a variable wins, and a variable already set in the shell beats every file.'
];

/** The paragraphs of the language section, rendered through `RichText`. */
export const NEST_LANGUAGE_PARAGRAPHS: readonly string[] = [
	'`@nestjs/i18n` resolves the request language in this order: the `?lang` query parameter, then the `x-lang` header, then `Accept-Language`. Explicit choices come first because every browser sends `Accept-Language`, which would shadow them. Without any of the three the app answers in the default locale, `en`.',
	'The three curls below all answer `{"status":404,"message":"Không tìm thấy tài nguyên.","data":null}`; the same request without any language hint answers `The resource was not found.`'
];

/** The paragraphs of the health section, rendered through `RichText`. */
export const NEST_HEALTH_PARAGRAPHS: readonly string[] = [
	'`GET /health/ready` runs through `@nestjs/terminus`. The shipped controller checks nothing, so it answers `ok`; a database indicator joins the check list in `src/app/app.controller.ts` once a driver exists.',
	'A failing check turns the answer into a 503 with `data: null`: `{"status":503,"message":"The service is unavailable. Please try again later.","data":null}`.'
];

/** The `scripts` block of the generated `package.json`, read from `templates/nest/package.json`. */
export const NEST_SCRIPTS = `{
  "build": "nest build",
  "dev": "nest start --watch",
  "format": "npm run lint:fix && prettier --write .",
  "lint": "eslint \\"{src,test}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\" \\"*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\"",
  "lint:fix": "eslint --fix \\"{src,test}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\" \\"*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\"",
  "prepare": "husky",
  "start": "nest start",
  "start:debug": "nest start --debug --watch",
  "start:dev": "nest start --watch",
  "start:prod": "node dist/main.js",
  "test": "vitest run",
  "test:cov": "vitest run --coverage",
  "test:debug": "vitest --inspect-brk --no-file-parallelism",
  "test:e2e": "vitest run --config ./vitest.config.e2e.ts",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit"
}`;

/** The paragraphs of the monorepo section, rendered through `RichText`. */
export const NEST_MONOREPO_PARAGRAPHS: readonly string[] = [
	'With `--monorepo`, the app lands at `apps/nest` as the workspace `@my-app/nest`. The toolchain and the harness stay at the root, and every root script runs the app through turbo as in the node preset.',
	'The preset only creates a project: setting up an existing folder with `--framework nest` exits 1 and names the create command.'
];
