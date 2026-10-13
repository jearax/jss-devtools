import { ROOT_CODE_GLOB, SOURCE_CODE_GLOB } from '@/commands/init/generators/scripts-content'

export const buildLintStagedConfig = (): Record<string, string[]> => ({
	[SOURCE_CODE_GLOB]: ['eslint --fix', 'prettier --write'],
	[ROOT_CODE_GLOB]: ['eslint --fix', 'prettier --write'],
	'package.json': ['prettier --write']
})
