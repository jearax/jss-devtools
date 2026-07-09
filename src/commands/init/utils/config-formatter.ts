// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { createRequire } from 'node:module'

import pluginJs from '@eslint/js'
import plugAutofix from 'eslint-plugin-autofix'
import pluginImport from 'eslint-plugin-import'
import pluginPreferArrowFunctions from 'eslint-plugin-prefer-arrow-functions'
import globals from 'globals'

const require = createRequire(import.meta.url)

/**
 * Resolve the typescript-eslint recommended config. Prefers the
 * `typescript-eslint` meta-package; falls back to building it from the
 * standalone parser + plugin for consumers on the older split setup.
 * Returns [] if neither is installed (TypeScript rules silently skipped).
 */
const resolveTsEslintConfigs = (): any[] => {
	try {
		const tseslint = require('typescript-eslint')
		if (tseslint?.configs?.recommended) return tseslint.configs.recommended
	} catch {
		// meta-package not installed — try standalone parser+plugin below
	}
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const parser = require('@typescript-eslint/parser')
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const plugin = require('@typescript-eslint/eslint-plugin')
		return [
			{ languageOptions: { parser: parser.parser ?? parser } },
			{ plugins: { '@typescript-eslint': plugin } },
			{ rules: plugin.configs?.recommended?.rules ?? {} }
		]
	} catch {
		// neither installed — TypeScript rules silently skipped
	}
	return []
}

export const eslintConfigNode = [
	{
		files: ['**/*.{js,ts,jsx,tsx}'],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser
			}
		}
	},

	pluginJs.configs.recommended,
	...resolveTsEslintConfigs(),

	{
		plugins: {
			import: pluginImport,
			'prefer-arrow-functions': pluginPreferArrowFunctions,
			autofix: plugAutofix
		},

		rules: {
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

			'prefer-arrow-functions/prefer-arrow-functions': 'error',

			'import/first': 'error',
			'import/newline-after-import': 'error',
			'import/no-duplicates': 'error',
			'import/no-anonymous-default-export': 'error',
			'import/order': [
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

					groups: ['builtin', 'external', ['internal', 'parent', 'sibling', 'index'], ['object', 'unknown', 'type']]
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
	}
]

// Plugins return functions so require() is deferred until the consumer actually
// uses the plugin. This prevents "Cannot find module" crashes when a consumer
// only imports eslintConfigNode but hasn't installed optional peer deps.
export const pluginReact = () => [
	{
		settings: {
			react: {
				version: 'detect'
			}
		},

		plugins: {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			react: require('eslint-plugin-react'),
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			'react-native': require('eslint-plugin-react-native'),
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			'react-hooks': require('eslint-plugin-react-hooks')
		},

		rules: {
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/display-name': 'off',
			'react/jsx-boolean-value': 'error',
			'react/jsx-curly-brace-presence': ['error', 'never'],
			'react/self-closing-comp': 'error',

			'react-native/no-unused-styles': 'warn',
			'react-native/no-inline-styles': 'warn',
			'react-native/no-color-literals': 'warn',
			'react-native/no-raw-text': 'off',

			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn'
		}
	}
]

export const pluginNext = () => [
	{
		plugins: {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			'@next/next': require('@next/eslint-plugin-next')
		},

		rules: {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			...require('@next/eslint-plugin-next').configs.recommended.rules,
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			...require('@next/eslint-plugin-next').configs['core-web-vitals'].rules
		}
	}
]

export const pluginStorybook = () => [
	{
		plugins: {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			storybook: require('eslint-plugin-storybook')
		},

		rules: {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			...require('eslint-plugin-storybook').configs.recommended.rules
		}
	}
]

export const pluginTailwind = () => [
	{
		plugins: {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			tailwindcss: require('eslint-plugin-tailwindcss')
		},

		rules: {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			...require('eslint-plugin-tailwindcss').configs.recommended.rules
		}
	}
]

export const defineConfig = (...configs: any[]) => {
	if (configs.length === 0) {
		return eslintConfigNode
	}
	return configs.flat()
}

export default eslintConfigNode
