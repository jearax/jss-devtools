// House .prettierrc.json — generated verbatim from the jss-devtools repo so
// target projects format exactly like the tool that bootstraps them.
export const PRETTIER_CONFIG_PATH = '.prettierrc.json'

export const buildPrettierConfigContent = (): string =>
	`${JSON.stringify(
		{
			useTabs: true,
			tabWidth: 4,
			printWidth: 120,
			semi: false,
			singleQuote: true,
			jsxSingleQuote: false,
			arrowParens: 'always',
			trailingComma: 'none',
			endOfLine: 'auto'
		},
		null,
		'\t'
	)}\n`
