import { formatJson } from '@/commands/init/generators/format-json'

export const VSCODE_SETTINGS_PATH = '.vscode/settings.json'
export const VSCODE_EXTENSIONS_PATH = '.vscode/extensions.json'

// Formatting rules live in .editorconfig; the editor delegates to Prettier on
// save and lets eslint apply its fixes.
export const buildVscodeSettingsContent = (): string =>
	formatJson({
		'editor.defaultFormatter': 'esbenp.prettier-vscode',
		'editor.formatOnSave': true,
		'editor.codeActionsOnSave': {
			'source.fixAll.eslint': 'explicit',
			'source.organizeImports': 'never'
		}
	})

export const buildVscodeExtensionsContent = (): string =>
	formatJson({
		recommendations: ['editorconfig.editorconfig', 'dbaeumer.vscode-eslint', 'esbenp.prettier-vscode']
	})
