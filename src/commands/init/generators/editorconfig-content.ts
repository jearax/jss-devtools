export const EDITORCONFIG_PATH = '.editorconfig'

// The single whitespace source: Prettier (CLI, eslint-plugin-prettier, VS Code
// extension) maps indent_style, indent_size, max_line_length and end_of_line
// into its own options, and editors apply the rest while typing.
export const buildEditorconfigContent = (): string =>
	[
		'root = true',
		'',
		'[*]',
		'charset = utf-8',
		'end_of_line = lf',
		'indent_style = tab',
		'indent_size = 2',
		'max_line_length = 120',
		'insert_final_newline = true',
		'trim_trailing_whitespace = true',
		'',
		'[*.{yml,yaml}]',
		'indent_style = space',
		'',
		'[*.md]',
		'trim_trailing_whitespace = false',
		''
	].join('\n')
