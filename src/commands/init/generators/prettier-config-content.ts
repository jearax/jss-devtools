import { formatJson } from '@/commands/init/generators/format-json'

export const PRETTIER_CONFIG_PATH = '.prettierrc.json'

// Single source of truth for formatting; only non-default options are listed
// (tab width 2, semicolons and arrow parens are Prettier defaults).
export const buildPrettierConfigContent = (): string =>
	formatJson({
		useTabs: true,
		printWidth: 120,
		singleQuote: true,
		trailingComma: 'none',
		endOfLine: 'auto'
	})
