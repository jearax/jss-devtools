export const SOURCE_CODE_GLOB = '{src,test}/**/*.ts'
export const ROOT_CODE_GLOB = '*.{ts,mjs}'

// Added only when absent — an existing user script is never clobbered.
// Explicit globs keep `lint` off tool-owned dirs even when eslint.config.mjs is
// user-edited; eslint --fix formats through prettier/prettier.
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
