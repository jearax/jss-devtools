import js from '@eslint/js';
import pluginVitest from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginAutofix from 'eslint-plugin-autofix';
import pluginImportX from 'eslint-plugin-import-x';
import pluginPreferArrowFunctions from 'eslint-plugin-prefer-arrow-functions';
import pluginPrettier from 'eslint-plugin-prettier';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Vite's native config loader strips types in Node: it needs file extensions and `import type`, and has no @/ alias.
const CONFIG_LOADER_FILES = ['vite.config.ts', 'vitest.config.ts', 'vite/tailwind-auto-reference.plugin.ts'];

const eslintConfig = defineConfig(
	{
		ignores: ['dist/**', 'node_modules/**', 'coverage/**']
	},
	js.configs.recommended,
	eslintConfigPrettier,
	{
		files: ['**/*.{ts,tsx}'],
		extends: [tseslint.configs.recommended],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true
				}
			},
			globals: {
				...globals.browser
			}
		},
		plugins: {
			'import-x': pluginImportX,
			autofix: pluginAutofix,
			'prefer-arrow-functions': pluginPreferArrowFunctions,
			prettier: pluginPrettier,
			react: pluginReact,
			'react-hooks': pluginReactHooks
		},
		rules: {
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',

			...pluginReactHooks.configs['recommended-latest'].rules,

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

			'prefer-arrow-functions/prefer-arrow-functions': ['error', { returnStyle: 'explicit' }],
			'arrow-body-style': ['error', 'always'],

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
						},
						{
							pattern: '{.,..}/**/*.css',
							group: 'index',
							position: 'after'
						}
					],
					groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], ['object', 'unknown', 'type']]
				}
			],

			'prettier/prettier': 'error',

			'no-undef': 'off',
			'no-redeclare': 'off',
			'no-import-assign': 'off',
			'no-restricted-syntax': [
				'error',
				{
					selector: 'TSEnumDeclaration',
					message: 'Use an `as const` object and a derived union type instead of `enum`.'
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
		files: ['**/*.{ts,tsx}'],
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
		files: ['src/**/*.{ts,tsx}'],
		ignores: ['src/**/*.test.{ts,tsx}', ...CONFIG_LOADER_FILES],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							regex: '^\\.{1,2}/(?!.*\\.css$)',
							message: 'Import through the @/ alias; only CSS files are imported relatively.'
						}
					]
				}
			]
		}
	},
	{
		files: CONFIG_LOADER_FILES,
		rules: {
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{ prefer: 'type-imports', fixStyle: 'separate-type-imports' }
			]
		}
	},
	{
		files: ['src/**/*.test.{ts,tsx}'],
		plugins: { vitest: pluginVitest },
		rules: { ...pluginVitest.configs.recommended.rules }
	},
	{
		files: ['*.mjs'],
		languageOptions: { globals: { ...globals.node } },
		plugins: { prettier: pluginPrettier },
		rules: { 'prettier/prettier': 'error' }
	}
);

export default eslintConfig;
