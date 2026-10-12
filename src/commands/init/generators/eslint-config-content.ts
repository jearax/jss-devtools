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
// dokploy/design-system for react): emitted already prettier-formatted with the
// generated .prettierrc.json so a fresh `lint` run is clean.
export const buildEslintConfigContent = (preset: FrameworkPreset): string => {
	const ts = preset.jsx ? '{ts,tsx}' : 'ts'

	const imports = [
		...BASE_IMPORTS,
		...preset.eslintFrameworkImports.map((spec): [string, string] => [spec.localName, spec.moduleName])
	]
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

	const relativeImport = preset.jsx
		? {
				regex: "'^\\\\.{1,2}/(?!.*\\\\.css$)'",
				message: "'Import through the @/ alias; only CSS files are imported relatively.'"
			}
		: {
				regex: "'^\\\\.{1,2}/'",
				message: "'Import through the @/ alias.'"
			}

	return `${imports}

const eslintConfig = [
	{
		ignores: ['dist/**', 'node_modules/**', 'coverage/**']
	},
	js.configs.recommended,
	eslintConfigPrettier,
	{
		files: ['**/*.${preset.jsx ? '{ts,tsx,js,jsx}' : '{ts,js,mjs}'}'],
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
			'no-restricted-syntax': [
				'error',
				{
					selector: 'TSEnumDeclaration',
					message: 'Use an \`as const\` object and a derived union type instead of \`enum\`.'
				}
			],
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
	},
	{
		// Type-aware rules for promises; *.mjs files are outside tsconfig.json, so they stay untyped.
		files: ['**/*.${ts}'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error'
		}
	},
	{
		files: ['src/**/*.${ts}'],
		ignores: ['src/**/*.{spec,test}.${ts}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							regex: ${relativeImport.regex},
							message: ${relativeImport.message}
						}
					]
				}
			]
		}
	}
];

export default eslintConfig;
`
}
