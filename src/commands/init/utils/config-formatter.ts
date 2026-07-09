// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import pluginJs from '@eslint/js'
import plugAutofix from 'eslint-plugin-autofix'
import pluginImport from 'eslint-plugin-import'
import pluginPreferArrowFunctions from 'eslint-plugin-prefer-arrow-functions'
import globals from 'globals'
import tseslint from 'typescript-eslint'

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
	...tseslint.configs.recommended,

	{
		plugins: {
			import: pluginImport,
			'prefer-arrow-functions': pluginPreferArrowFunctions,
			autofix: plugAutofix
		},

		rules: {
			// autofix
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

			// eslint-plugin-import
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

			// Others rules
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
			// eslint-plugin-react
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/display-name': 'off',

			'react/jsx-boolean-value': 'error',
			'react/jsx-curly-brace-presence': ['error', 'never'],
			'react/self-closing-comp': 'error',

			// eslint-plugin-react-native
			'react-native/no-unused-styles': 'warn',
			'react-native/no-inline-styles': 'warn',
			'react-native/no-color-literals': 'warn',
			'react-native/no-raw-text': 'off',

			// eslint-plugin-react-hooks
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
			// eslint-plugin-next
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
			// eslint-plugin-storybook
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
			// eslint-plugin-tailwindcss
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			...require('eslint-plugin-tailwindcss').configs.recommended.rules
		}
	}
]

export default eslintConfigNode
