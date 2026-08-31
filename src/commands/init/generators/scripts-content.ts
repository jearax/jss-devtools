import { FrameworkPreset } from '@/commands/init/presets/types'

// Default scripts (user-approved set): prepare wires husky into every future
// install; format runs the linter pair over the preset globs. Both are only
// added when absent — an existing user script is never clobbered.
export const buildScripts = (
	preset: FrameworkPreset,
	options?: { includeFormat?: boolean }
): Record<string, string> => {
	const scripts: Record<string, string> = {
		prepare: 'husky'
	}

	if (options?.includeFormat !== false) {
		const globs = preset.formatGlobs.join(' ')

		scripts.format = `eslint --fix ${globs} && prettier --write ${globs}`
	}

	return scripts
}
