// Default conventional rules only — extending beyond
// @commitlint/config-conventional is a deliberate non-goal of init.
export const COMMITLINT_CONFIG_PATH = 'commitlint.config.mjs'

export const buildCommitlintConfigContent = (): string =>
	`const commitlintConfig = {\n\textends: ['@commitlint/config-conventional']\n}\n\nexport default commitlintConfig\n`
