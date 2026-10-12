export const EDITORCONFIG_PATH = '.editorconfig'

// The single whitespace source. Prettier (CLI, eslint-plugin-prettier, VS Code
// extension) maps these properties onto useTabs, tabWidth, printWidth and
// endOfLine; root stops lookup in parent directories.
export const buildEditorconfigContent = (): string =>
	[
		'root = true',
		'',
		'[*]',
		'indent_style = tab',
		'indent_size = 2',
		'max_line_length = 120',
		'end_of_line = lf',
		''
	].join('\n')
