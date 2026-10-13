import { ROOT_CODE_GLOB, SOURCE_CODE_GLOB } from '@/commands/init/generators/lint-globs'

// lint-staged matches a slash-less glob against basenames in every directory;
// the `./` prefix keeps root globs at the root, like the lint script. Without
// it `package.json` also formats every nested manifest (vendored tools, agent
// skills) that happens to be staged.
export const buildLintStagedConfig = (): Record<string, string[]> => ({
	[SOURCE_CODE_GLOB]: ['eslint --fix', 'prettier --write'],
	[`./${ROOT_CODE_GLOB}`]: ['eslint --fix', 'prettier --write'],
	'./package.json': ['prettier --write']
})
