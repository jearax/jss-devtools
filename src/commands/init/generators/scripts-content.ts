// Added only when absent — an existing user script is never clobbered.
// Lint scope comes from eslint.config.mjs (files/ignores), and eslint --fix
// formats through prettier/prettier, so no glob list is repeated here.
export const buildScripts = (options?: { includeLinter?: boolean }): Record<string, string> => {
	const scripts: Record<string, string> = {
		prepare: 'husky',
		typecheck: 'tsc --noEmit'
	}

	if (options?.includeLinter !== false) {
		scripts.lint = 'eslint .'
		scripts.format = 'eslint --fix .'
	}

	return scripts
}
