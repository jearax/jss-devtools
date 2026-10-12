import { FrameworkPreset } from '@/commands/init/presets/types'

const BASE_IMPORTS: Array<[string, string]> = [
	['js', '@eslint/js'],
	['tsPlugin', '@typescript-eslint/eslint-plugin'],
	['tsParser', '@typescript-eslint/parser'],
	['eslintConfigPrettier', 'eslint-config-prettier'],
	['pluginAutofix', 'eslint-plugin-autofix'],
	['pluginImportX', 'eslint-plugin-import-x'],
	['pluginPreferArrowFunctions', 'eslint-plugin-prefer-arrow-functions'],
	['pluginPrettier', 'eslint-plugin-prettier'],
	['globals', 'globals']
]

const BASE_PLUGINS: Record<string, string> = {
	'@typescript-eslint': 'tsPlugin',
	'import-x': 'pluginImportX',
	autofix: 'pluginAutofix',
	'prefer-arrow-functions': 'pluginPreferArrowFunctions',
	prettier: 'pluginPrettier'
}

const indentLines = (lines: string[], tabs: number): string =>
	lines.map((line) => (line.length === 0 ? '' : `${'\t'.repeat(tabs)}${line}`)).join('\n')

const pluginKey = (key: string): string => (/^[a-z]\w*$/i.test(key) ? key : `'${key}'`)

// House config from the reference repos (dokploy/auth for node,
// dokploy/design-system for react), emitted prettier-clean so a fresh `lint` run passes.
export const buildEslintConfigContent = (preset: FrameworkPreset): string => {
	const imports = [
		...BASE_IMPORTS,
		...preset.eslintFrameworkImports.map((spec): [string, string] => [spec.localName, spec.moduleName])
	]
		// Same order import-x/order (alphabetize) enforces, so re-runs stay no-ops.
		.sort(([, a], [, b]) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
		.map(([local, module]) => `import ${local} from '${module}';`)
		.join('\n')

	const plugins = Object.entries({
		...BASE_PLUGINS,
		...preset.eslintFrameworkPlugins
	})
		.map(([key, ref]) => `\t\t\t${pluginKey(key)}: ${ref}`)
		.join(',\n')

	const frameworkRules =
		preset.eslintFrameworkRules.length > 0 ? `${indentLines(preset.eslintFrameworkRules, 3)}\n\n` : ''

	const parserOptions = preset.jsx
		? `{
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true
				}
			}`
		: `{
				ecmaVersion: 'latest',
				sourceType: 'module'
			}`

	// eslint does not read .gitignore; build output must be listed for `eslint .`.
	const ignores = ['dist/**', 'build/**', 'coverage/**', ...(preset.id === 'next' ? ['.next/**'] : [])]
		.map((glob) => `'${glob}'`)
		.join(', ')

	return `${imports}

const eslintConfig = [
	{
		ignores: [${ignores}]
	},
	js.configs.recommended,
	eslintConfigPrettier,
	{
		files: ['**/*.${preset.jsx ? '{ts,tsx,js,jsx,mjs}' : '{ts,js,mjs}'}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: ${parserOptions},
			globals: {
				...globals.${preset.eslintGlobals}
			}
		},
		plugins: {
${plugins}
		},
		rules: {
			...tsPlugin.configs.recommended.rules,

${frameworkRules}			// autofix
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
			'prefer-arrow-functions/prefer-arrow-functions': ['error', { returnStyle: 'explicit' }],
			'arrow-body-style': ['error', 'always'],

			// eslint-plugin-import-x
			'import-x/first': 'error',
			'import-x/newline-after-import': 'error',
			'import-x/no-duplicates': 'error',
			'import-x/no-anonymous-default-export': 'error',
			'import-x/order': [
				'error',
				{
					'newlines-between': 'always',
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
					groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], ['object', 'unknown', 'type']]
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
];

export default eslintConfig;
`
}
