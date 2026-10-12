// Legacy config variants (eslintrc-era, prettier/prettier config families)
// that our flat-config writes supersede — Replace removes them so two configs
// never fight over the same concern.
export const ESLINT_CONFIG_VARIANTS = [
	'eslint.config.mjs',
	'eslint.config.js',
	'eslint.config.cjs',
	'.eslintrc',
	'.eslintrc.js',
	'.eslintrc.cjs',
	'.eslintrc.json',
	'.eslintrc.yaml',
	'.eslintrc.yml'
] as const

export const PRETTIER_CONFIG_VARIANTS = [
	'.prettierrc',
	'.prettierrc.json',
	'.prettierrc.yaml',
	'.prettierrc.yml',
	'.prettierrc.js',
	'.prettierrc.cjs',
	'.prettierrc.mjs',
	'prettier.config.js',
	'prettier.config.cjs',
	'prettier.config.mjs'
] as const

export const COMMITLINT_CONFIG_VARIANTS = [
	'commitlint.config.mjs',
	'commitlint.config.js',
	'commitlint.config.cjs',
	'commitlint.config.json',
	'.commitlintrc',
	'.commitlintrc.json',
	'.commitlintrc.js',
	'.commitlintrc.yaml',
	'.commitlintrc.yml'
] as const
