import { FrameworkPreset } from '@/commands/init/presets/types'

const ROOT_CODE_GLOB = '*.{ts,mjs}'

export const buildLintStagedConfig = (preset: FrameworkPreset): Record<string, string[]> => ({
	[preset.codeGlob]: ['eslint --fix', 'prettier --write'],
	[ROOT_CODE_GLOB]: ['eslint --fix', 'prettier --write'],
	'package.json': ['prettier --write']
})
