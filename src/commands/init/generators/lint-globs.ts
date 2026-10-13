// One source for lint scope, shared by eslint.config.mjs `files`, the
// lint/format scripts and lint-staged, so editing one list never drifts.
// Explicit folders instead of `eslint .`: eslint walks every dot-dir (agent
// tooling, caches) and does not read .gitignore.
export const LINT_FOLDERS = [
	'src',
	'lib',
	'app',
	'server',
	'bin',
	'scripts',
	'config',
	'test',
	'tests',
	'spec',
	'__tests__',
	'e2e'
]
// ESM only: the house rules (sourceType module, no-require-imports) reject CommonJS.
export const LINT_EXTENSIONS = ['ts', 'mts', 'js', 'mjs']

const extGlob = `*.{${LINT_EXTENSIONS.join(',')}}`

export const ANY_DEPTH_CODE_GLOB = `**/${extGlob}`
export const SOURCE_CODE_GLOB = `{${LINT_FOLDERS.join(',')}}/**/${extGlob}`
export const ROOT_CODE_GLOB = extGlob
