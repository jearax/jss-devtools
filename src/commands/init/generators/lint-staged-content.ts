import { ROOT_CODE_GLOB, SOURCE_CODE_GLOB } from '@/commands/init/generators/lint-globs'

// lint-staged matches a slash-less glob against basenames in every directory;
// the `./` prefix keeps the root glob at the root, like the lint script.
export const buildLintStagedConfig = (): Record<string, string[]> => ({
	[SOURCE_CODE_GLOB]: ['eslint --fix', 'prettier --write'],
	[`./${ROOT_CODE_GLOB}`]: ['eslint --fix', 'prettier --write'],
	'package.json': ['prettier --write']
})
