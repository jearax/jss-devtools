import { AgentName } from 'package-manager-detector'

import { FrameworkPreset } from '@/commands/init/presets/types'
import { fmtCommand, oneOffRunnerCommand } from '@/core/runner/pm-commands'

// prettier-package-json runs through the PM one-off runner (never installed),
// so its pinned spec is resolved upstream and passed in — identical string is
// reused for the hook, the lint-staged entry, and the plan display.
export const buildLintStagedConfig = (
	preset: FrameworkPreset,
	pm: AgentName,
	isYarnBerry: boolean,
	ppjSpec: string,
	options?: { includePpj?: boolean }
): Record<string, string[]> => {
	const config: Record<string, string[]> = {
		[preset.lintStagedGlob]: ['eslint --fix', 'prettier --write']
	}

	if (options?.includePpj !== false) {
		config['package.json'] = [fmtCommand(oneOffRunnerCommand(pm, ppjSpec, ['--write'], isYarnBerry))]
	}

	return config
}
