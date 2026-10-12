import { formatJson } from '@/commands/init/generators/format-json'

export const VSCODE_SETTINGS_PATH = '.vscode/settings.json'
export const VSCODE_EXTENSIONS_PATH = '.vscode/extensions.json'

// Formatting rules live only in .prettierrc.json; the editor just delegates to
// Prettier on save and lets eslint apply its fixes.
export const buildVscodeSettingsContent = (): string =>
	formatJson({
		'editor.defaultFormatter': 'esbenp.prettier-vscode',
		'editor.formatOnSave': true,
		'editor.codeActionsOnSave': {
			'source.fixAll.eslint': 'explicit'
		}
	})

export const buildVscodeExtensionsContent = (): string =>
	formatJson({
		recommendations: ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode']
	})
