import { ROOT_CODE_GLOB, SOURCE_CODE_GLOB } from '@/commands/init/generators/lint-globs'

// Added only when absent — an existing user script is never clobbered.
// eslint --fix formats through prettier/prettier.
export const buildScripts = (options?: { includeLinter?: boolean }): Record<string, string> => {
	const scripts: Record<string, string> = {
		prepare: 'husky',
		typecheck: 'tsc --noEmit'
	}

	if (options?.includeLinter !== false) {
		const globs = `--no-error-on-unmatched-pattern "${SOURCE_CODE_GLOB}" "${ROOT_CODE_GLOB}"`

		scripts.lint = `eslint ${globs}`
		scripts.format = `eslint --fix ${globs}`
	}

	return scripts
}
