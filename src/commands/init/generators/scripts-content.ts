import { FrameworkPreset } from '@/commands/init/presets/types'

export const ROOT_CODE_GLOB = '*.{ts,mjs}'

// Added only when absent — an existing user script is never clobbered.
export const buildScripts = (
	preset: FrameworkPreset,
	options?: { includeLinter?: boolean }
): Record<string, string> => {
	const scripts: Record<string, string> = {
		prepare: 'husky',
		typecheck: 'tsc --noEmit'
	}

	if (options?.includeLinter !== false) {
		const globs = `"${preset.codeGlob}" "${ROOT_CODE_GLOB}"`

		scripts.lint = `eslint --no-error-on-unmatched-pattern ${globs}`
		scripts.format = `eslint --fix --no-error-on-unmatched-pattern ${globs} && prettier --write --no-error-on-unmatched-pattern ${globs}`
	}

	return scripts
}
