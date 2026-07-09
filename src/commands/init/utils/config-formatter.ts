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
 * Resolve typescript-eslint parser + plugin + recommended rules.
 * Prefers the `typescript-eslint` meta-package, falls back to the standalone
 * parser + plugin for consumers on the older split setup. Returns null when
 * neither is installed (TypeScript rules silently skipped).
 */
const resolveTsParts = (): { parser: any; plugin: any; rules: Record<string, any> } | null => {
	try {
		const tseslint = require('typescript-eslint')
		const rules: Record<string, any> = {}
		const rec = tseslint.configs?.recommended ?? []
		for (const c of Array.isArray(rec) ? rec : []) {
			if (c.rules) Object.assign(rules, c.rules)
		}
		return { parser: tseslint.parser, plugin: tseslint.plugin, rules }
	} catch {
		// meta-package not installed — try standalone below
	}
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const parser = require('@typescript-eslint/parser')
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const plugin = require('@typescript-eslint/eslint-plugin')
		return { parser: parser.parser ?? parser, plugin, rules: plugin.configs?.recommended?.rules ?? {} }
	} catch {
		// neither installed
	}
	return null
}

const ts = resolveTsParts()

// Base config as a single flat config object so consumers can compose it as
// `export default [eslintConfigNode, pluginReact(), ...]` without spreading.
export const eslintConfigNode: Record<string, any> = {
	files: ['**/*.{js,ts,jsx,tsx}'],
	languageOptions: {
		globals: { ...globals.node, ...globals.browser },
		...(ts?.parser ? { parser: ts.parser } : {})
	},
	plugins: {
		...(ts?.plugin ? { '@typescript-eslint': ts.plugin } : {}),
		import: pluginImport,
		'prefer-arrow-functions': pluginPreferArrowFunctions,
		autofix: plugAutofix
	},
	rules: {
		...(pluginJs.configs.recommended?.rules ?? {}),
		...(ts?.rules ?? {}),

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

// Each plugin is a factory returning a single flat config object. require() is
// deferred to call time so importing eslintConfigNode alone never crashes when
// an optional peer dep is absent.
export const pluginReact = (): Record<string, any> => ({
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
})

export const pluginNext = (): Record<string, any> => ({
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
})

export const pluginStorybook = (): Record<string, any> => ({
	plugins: {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		storybook: require('eslint-plugin-storybook')
	},
	rules: {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		...require('eslint-plugin-storybook').configs.recommended.rules
	}
})

export const pluginTailwind = (): Record<string, any> => ({
	plugins: {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		tailwindcss: require('eslint-plugin-tailwindcss')
	},
	rules: {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		...require('eslint-plugin-tailwindcss').configs.recommended.rules
	}
})

// Merge multiple configs (objects or arrays) into one flat array.
export const defineConfig = (...configs: any[]) => {
	if (configs.length === 0) return [eslintConfigNode]
	return configs.flat()
}

export default eslintConfigNode
