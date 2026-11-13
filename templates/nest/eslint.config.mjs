import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginAutofix from 'eslint-plugin-autofix';
import pluginImportX from 'eslint-plugin-import-x';
import pluginPreferArrowFunctions from 'eslint-plugin-prefer-arrow-functions';
import pluginPrettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const { JAVASCRIPT_FILES, TYPESCRIPT_FILES, CODE_FILES } = (() => {
	const SOURCE_FOLDERS = 'src,test';

	const JAVASCRIPT_EXTENSIONS = 'cjs,mjs,js,jsx';
	const TYPESCRIPT_EXTENSIONS = 'cts,mts,ts,tsx';
	const CODE_EXTENSIONS = `${JAVASCRIPT_EXTENSIONS},${TYPESCRIPT_EXTENSIONS}`;

	const JAVASCRIPT_FILES = [`{${SOURCE_FOLDERS}}/**/*.{${JAVASCRIPT_EXTENSIONS}}`, `*.{${JAVASCRIPT_EXTENSIONS}}`];

	const TYPESCRIPT_FILES = [`{${SOURCE_FOLDERS}}/**/*.{${TYPESCRIPT_EXTENSIONS}}`, `*.{${TYPESCRIPT_EXTENSIONS}}`];

	const CODE_FILES = [`{${SOURCE_FOLDERS}}/**/*.{${CODE_EXTENSIONS}}`, `*.{${CODE_EXTENSIONS}}`];

	return {
		JAVASCRIPT_FILES,
		TYPESCRIPT_FILES,
		CODE_FILES
	};
})();

const IGNORED_PATHS = ['dist/**', 'coverage/**', 'node_modules/**'];

const eslintConfig = defineConfig(
	globalIgnores(IGNORED_PATHS),

	{
		files: CODE_FILES,
		extends: [js.configs.recommended, tseslint.configs.recommended],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: { ...globals.node },
			parserOptions: { tsconfigRootDir: import.meta.dirname }
		}
	},

	// A type-aware rule on a file with no `projectService` is a hard error, so JavaScript opts out.
	{
		files: TYPESCRIPT_FILES,
		extends: [tseslint.configs.recommendedTypeChecked],
		languageOptions: {
			parserOptions: {
				projectService: true
			}
		}
	},
	{
		files: JAVASCRIPT_FILES,
		extends: [tseslint.configs.disableTypeChecked]
	},

	{
		files: CODE_FILES,
		settings: {
			'import-x/internal-regex': '^@/'
		},
		plugins: {
			autofix: pluginAutofix,
			'import-x': pluginImportX,
			'prefer-arrow-functions': pluginPreferArrowFunctions,
			prettier: pluginPrettier
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',

			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['../*'],
							message: 'Import through the @/ alias, not a parent-relative path.'
						},
						{
							regex: '^(?:@/|\\.{1,2}/).+\\.ts$',
							message: 'Import with the .js suffix, never .ts.'
						},
						{
							regex: '^(?:@/|\\.{1,2}/)(?!.*\\.js$).+',
							message: 'ESM requires the .js suffix on relative and @/ imports.'
						}
					]
				}
			],

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

			// Nest DI reads constructor parameter types through `emitDecoratorMetadata`,
			// which needs the imported class kept as a runtime value. `import type` erases
			// it, so the rule that pushes `import type` cannot apply here.
			'@typescript-eslint/consistent-type-imports': 'off',

			'prefer-arrow-functions/prefer-arrow-functions': ['error', { returnStyle: 'explicit' }],
			'arrow-body-style': ['error', 'always'],

			'import-x/first': 'error',
			'import-x/newline-after-import': 'error',
			'import-x/no-duplicates': 'error',
			'import-x/no-anonymous-default-export': ['error', { allowCallExpression: false }],
			'import-x/order': [
				'error',
				{
					'newlines-between': 'always',
					alphabetize: {
						order: 'asc',
						caseInsensitive: true
					},
					groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], ['object', 'unknown', 'type']]
				}
			],

			'prettier/prettier': 'error',

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
	},

	eslintConfigPrettier
);

export default eslintConfig;
