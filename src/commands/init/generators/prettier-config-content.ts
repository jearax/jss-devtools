export const PRETTIER_CONFIG_PATH = '.prettierrc.json'

export const buildPrettierConfigContent = (): string =>
	`${JSON.stringify(
		{
			useTabs: true,
			tabWidth: 2,
			printWidth: 120,
			semi: true,
			singleQuote: true,
			jsxSingleQuote: false,
			arrowParens: 'always',
			trailingComma: 'none',
			endOfLine: 'auto'
		},
		null,
		'\t'
	)}\n`
