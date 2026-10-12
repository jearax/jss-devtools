import { Agent } from 'package-manager-detector'

import { ROOT_CODE_GLOB } from '@/commands/init/generators/scripts-content'
import { FrameworkPreset } from '@/commands/init/presets/types'
import { fmtCommand, oneOffCommand } from '@/core/runner/pm-commands'

// prettier-package-json runs through the PM one-off runner (never installed);
// its pinned spec is resolved upstream so every run formats identically.
export const buildLintStagedConfig = (
	preset: FrameworkPreset,
	pm: Agent,
	ppjSpec: string
): Record<string, string[]> => ({
	[preset.codeGlob]: ['eslint --fix', 'prettier --write'],
	[ROOT_CODE_GLOB]: ['eslint --fix', 'prettier --write'],
	'package.json': [fmtCommand(oneOffCommand(pm, ppjSpec, ['--use-tabs', '--write']))]
})
