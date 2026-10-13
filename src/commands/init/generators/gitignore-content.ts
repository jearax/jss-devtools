export const GITIGNORE_PATH = '.gitignore'

const NODE_MODULES_ENTRY = 'node_modules/'

// Only what init itself makes necessary: without it, `git add .` after
// install stages the dependency tree and the first pre-commit run lints it.
export const buildGitignoreContent = (): string => `${NODE_MODULES_ENTRY}\n`

// Spellings that ignore the root dependency tree: node_modules, /node_modules,
// **/node_modules, each with an optional /, /* or /** suffix. A negated form
// (`!node_modules/`) is a deliberate user choice and also counts as present.
const NODE_MODULES_PATTERN = /^!?(?:\/|\*\*\/)?node_modules(?:\/|\/\*|\/\*\*)?$/

// Git strips unescaped trailing spaces but keeps leading ones, so only trimEnd.
const mentionsNodeModules = (content: string): boolean =>
	content.split(/\r?\n/).some((line) => NODE_MODULES_PATTERN.test(line.trimEnd()))

/**
 * Returns the existing ignore list with `node_modules/` appended, or null when
 * an equivalent entry is already there. Existing bytes are kept verbatim; a
 * missing final newline is added first, in the file's own line ending.
 */
export const appendNodeModulesEntry = (existing: string): string | null => {
	if (mentionsNodeModules(existing)) {
		return null
	}

	const eol = existing.includes('\r\n') ? '\r\n' : '\n'
	const separator = existing === '' || existing.endsWith('\n') ? '' : eol

	return `${existing}${separator}${NODE_MODULES_ENTRY}${eol}`
}
