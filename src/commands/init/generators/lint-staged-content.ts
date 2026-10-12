export const buildLintStagedConfig = (): Record<string, string[]> => ({
	'{src,test}/**/*.ts': ['eslint --fix', 'prettier --write'],
	'*.{ts,mjs}': ['eslint --fix', 'prettier --write'],
	'package.json': ['prettier --write']
})
