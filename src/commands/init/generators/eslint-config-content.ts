import { FrameworkPreset } from '@/commands/init/presets/types'

// Mirrors the jss-devtools house eslint.config.mjs so generated projects get
// the same opinionated rule set (autofix, import-x ordering, prettier plugin),
// parameterized per framework: extra plugin imports/entries/rules + globals.
export const buildEslintConfigContent = (preset: FrameworkPreset): string => {
	const frameworkImports = preset.eslintFrameworkImports.map(
		(importSpec) => `import ${importSpec.localName} from '${importSpec.moduleName}'`
	)

	const importBlock = [
		"import js from '@eslint/js'",
		"import tsParser from '@typescript-eslint/parser'",
		"import tsPlugin from '@typescript-eslint/eslint-plugin'",
		"import eslintConfigPrettier from 'eslint-config-prettier'",
		"import pluginImportX from 'eslint-plugin-import-x'",
		"import pluginAutofix from 'eslint-plugin-autofix'",
		"import pluginPreferArrowFunctions from 'eslint-plugin-prefer-arrow-functions'",
		"import pluginPrettier from 'eslint-plugin-prettier'",
		"import globals from 'globals'",
		...frameworkImports
	].join('\n')

	const pluginEntries = Object.entries({
		'@typescript-eslint': 'tsPlugin',
		'import-x': 'pluginImportX',
		autofix: 'pluginAutofix',
		'prefer-arrow-functions': 'pluginPreferArrowFunctions',
		prettier: 'pluginPrettier',
		...preset.eslintFrameworkPlugins
	})
		.map(([key, ref]) => `'${key}': ${ref}`)
		.join(',\n\t\t\t')

	const frameworkRules = preset.eslintFrameworkRules.trim()

	const rulesBlock =
		frameworkRules.length > 0
			? `\t\t\t\t...tsPlugin.configs.recommended.rules,\n\n${frameworkRules}\n\n\t\t\t\t// autofix`
			: '\t\t\t\t...tsPlugin.configs.recommended.rules,\n\n\t\t\t\t// autofix'

	return `${importBlock}

const eslintConfig = [
	{
		ignores: ['dist/**', 'node_modules/**', 'coverage/**']
	},
	js.configs.recommended,
	eslintConfigPrettier,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module'
			},
			globals: {
				${preset.eslintGlobalsExpr}
			}
		},
		plugins: {
			${pluginEntries}
		},
		rules: {
${rulesBlock}
				'autofix/eol-last': 'error',
				'autofix/curly': 'error',
				'autofix/no-lonely-if': 'error',
				'autofix/no-else-return': 'error',
				'autofix/object-shorthand': 'error',
				'autofix/object-curly-newline': [
					'error',
					{
						ObjectExpression: {
							multiline: true,
							minProperties: 2,
							consistent: true
						}
					}
				],

				// @typescript-eslint
				'@typescript-eslint/no-unused-vars': [
					'warn',
					{
						args: 'all',
						argsIgnorePattern: '^_',
						varsIgnorePattern: '^_',
						caughtErrorsIgnorePattern: '^_',
						destructuredArrayIgnorePattern: '^_',
						ignoreRestSiblings: true
					}
				],
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-empty-object-type': 'off',
				'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'no-type-imports' }],

				// eslint-plugin-prefer-arrow-functions
				'prefer-arrow-functions/prefer-arrow-functions': 'error',

				// eslint-plugin-import-x
				'import-x/first': 'error',
				'import-x/newline-after-import': 'error',
				'import-x/no-duplicates': 'error',
				'import-x/no-anonymous-default-export': 'error',
				'import-x/order': [
					'error',
					{
						newlines-between: 'always',
						alphabetize: {
							order: 'asc',
							caseInsensitive: true
						},
						pathGroups: [
							{
								pattern: '@/**',
								group: 'internal'
							}
						],
						groups: ['builtin', 'external', ['internal', 'parent', 'sibling', 'index'], ['object', 'unknown', 'type']]
					}
				],

				// eslint-plugin-prettier
				'prettier/prettier': 'error',

				// Others rules
				'no-undef': 'off',
				'no-redeclare': 'off',
				'no-import-assign': 'off',
				'padding-line-between-statements': [
					'error',
					{
						blankLine: 'any',
						prev: 'export',
						next: 'export'
					},
					{
						blankLine: 'always',
						prev: ['const', 'let', 'var'],
						next: '*'
					},
					{
						blankLine: 'any',
						prev: ['const', 'let', 'var'],
						next: ['const', 'let', 'var']
					},
					{
						blankLine: 'always',
						prev: '*',
						next: ['function', 'multiline-const', 'multiline-block-like']
					},
					{
						blankLine: 'always',
						prev: ['function', 'multiline-const', 'multiline-block-like'],
						next: '*'
					}
				]
			}
		}
	}
]

export default eslintConfig
`
}
