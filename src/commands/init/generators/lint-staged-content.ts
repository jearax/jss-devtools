import { ROOT_CODE_GLOB } from '@/commands/init/generators/scripts-content'
import { FrameworkPreset } from '@/commands/init/presets/types'

export const buildLintStagedConfig = (preset: FrameworkPreset): Record<string, string[]> => ({
	[preset.codeGlob]: ['eslint --fix', 'prettier --write'],
	[ROOT_CODE_GLOB]: ['eslint --fix', 'prettier --write'],
	'package.json': ['prettier --write']
})
