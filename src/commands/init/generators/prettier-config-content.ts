import { formatJson } from '@/commands/init/generators/format-json'

export const PRETTIER_CONFIG_PATH = '.prettierrc.json'

// JS syntax rules only, spelled out even where they match Prettier's defaults.
// Whitespace stays in .editorconfig: a .prettierrc key would override it.
export const buildPrettierConfigContent = (): string =>
	formatJson({
		semi: true,
		singleQuote: true,
		jsxSingleQuote: false,
		quoteProps: 'as-needed',
		trailingComma: 'none',
		bracketSpacing: true,
		bracketSameLine: false,
		arrowParens: 'always'
	})
