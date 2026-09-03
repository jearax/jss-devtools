// Default conventional rules only — extending beyond
// @commitlint/config-conventional is a deliberate non-goal of init.
export const COMMITLINT_CONFIG_PATH = 'commitlint.config.mjs'

// Two accepted header shapes — either a hard-prefixed ticket reference
// (TICKET-<num>) for traceability, or a conventional commit type. Subject
// description is intentionally permissive (any non-empty string); case and
// trailing-period are left to the built-in rules from config-conventional.
const TICKET_REGEX = /^TICKET-\d+ - .+$/
const CONVENTIONAL_REGEX = /^(\w+)(\([^)]+\))?!?: .+$/

export const buildCommitlintConfigContent = (): string =>
	`const TICKET_REGEX = ${TICKET_REGEX.toString()}\n` +
	`const CONVENTIONAL_REGEX = ${CONVENTIONAL_REGEX.toString()}\n\n` +
	`const headerRegexPlugin = {\n` +
	`\trules: {\n` +
	`\t\t'header-ticket-or-conventional': ({ header }, when) => [\n` +
	`\t\t\twhen(\n` +
	`\t\t\t\tTICKET_REGEX.test(header) || CONVENTIONAL_REGEX.test(header),\n` +
	`\t\t\t\t'Header must match either "TICKET-<num> - <desc>" or conventional "<type>[(<scope>)][:!]: <desc>"'\n` +
	`\t\t\t)\n` +
	`\t\t]\n` +
	`\t}\n` +
	`}\n\n` +
	`const commitlintConfig = {\n` +
	`\textends: ['@commitlint/config-conventional'],\n` +
	`\tplugins: [headerRegexPlugin],\n` +
	`\trules: {\n` +
	`\t\t'header-ticket-or-conventional': [2, 'always']\n` +
	`\t}\n` +
	`}\n\n` +
	`export default commitlintConfig\n`
