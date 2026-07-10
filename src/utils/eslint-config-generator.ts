import type { Framework } from '@/commands/init/types/setup-pkgs'

export interface EslintConfigOptions {
	framework: Framework
	useTailwind?: boolean
	useStorybook?: boolean
	typescript?: boolean
}

/**
 * Generate a SELF-CONTAINED eslint.config.mjs — no import from jss-devtools.
 * Consumers run jss-devtools via npx/dlx/bunx (ephemeral); the generated config
 * requires the installed peer deps (eslint, plugins) directly so it works
 * without jss-devtools in node_modules. Optional plugins resolve via a small
 * inline safeRequire so a missing peer degrades gracefully.
 */

const HEADER = `import { createRequire } from 'node:module'
import js from '@eslint/js'
import globals from 'globals'

const require = createRequire(import.meta.url)

const safeRequire = (m) => {
	try {
		return require(m)
	} catch {
		return null
	}
}

const ts = safeRequire('typescript-eslint') ?? (() => {
	const parser = safeRequire('@typescript-eslint/parser')
	const plugin = safeRequire('@typescript-eslint/eslint-plugin')
	return parser && plugin ? { parser, plugin, rules: plugin.configs?.recommended?.rules ?? {} } : null
})()

const tsRules = {}
if (ts?.configs?.recommended) {
	for (const c of ts.configs.recommended) if (c.rules) Object.assign(tsRules, c.rules)
} else if (ts?.rules) {
	Object.assign(tsRules, ts.rules)
}
`

const BASE_BLOCK = `	{
		files: ['**/*.{js,ts,jsx,tsx}'],
		languageOptions: {
			globals: { ...globals.node, ...globals.browser },
			...(ts?.parser ? { parser: ts.parser } : {})
		},
		plugins: {
			...(ts?.plugin ? { '@typescript-eslint': ts.plugin } : {}),
			import: safeRequire('eslint-plugin-import'),
			'prefer-arrow-functions': safeRequire('eslint-plugin-prefer-arrow-functions'),
			autofix: safeRequire('eslint-plugin-autofix')
		},
		rules: {
			...(js.configs.recommended?.rules ?? {}),
			...tsRules,
			'autofix/eol-last': 'error',
			'autofix/curly': 'error',
			'autofix/no-lonely-if': 'error',
			'autofix/no-else-return': 'error',
			'autofix/object-shorthand': 'error',
			'autofix/object-curly-newline': ['error', { ObjectExpression: { multiline: true, minProperties: 2, consistent: true } }],
			'@typescript-eslint/no-unused-vars': ['warn', { args: 'all', argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', ignoreRestSiblings: true }],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'no-type-imports' }],
			'prefer-arrow-functions/prefer-arrow-functions': 'error',
			'import/first': 'error',
			'import/newline-after-import': 'error',
			'import/no-duplicates': 'error',
			'import/no-anonymous-default-export': 'error',
			'import/order': ['error', { 'newlines-between': 'always', alphabetize: { order: 'asc', caseInsensitive: true }, pathGroups: [{ pattern: '@/**', group: 'internal' }], groups: ['builtin', 'external', ['internal', 'parent', 'sibling', 'index'], ['object', 'unknown', 'type']] }],
			'padding-line-between-statements': ['error', { blankLine: 'any', prev: 'export', next: 'export' }, { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' }, { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] }, { blankLine: 'always', prev: '*', next: ['function', 'multiline-const', 'multiline-block-like'] }, { blankLine: 'always', prev: ['function', 'multiline-const', 'multiline-block-like'], next: '*' }]
		}
	}`

const REACT_BLOCK = `	{
		settings: { react: { version: 'detect' } },
		plugins: {
			react: safeRequire('eslint-plugin-react'),
			'react-hooks': safeRequire('eslint-plugin-react-hooks'),
			'jsx-a11y': safeRequire('eslint-plugin-jsx-a11y')
		},
		rules: {
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/display-name': 'off',
			'react/jsx-boolean-value': 'error',
			'react/jsx-curly-brace-presence': ['error', 'never'],
			'react/self-closing-comp': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			...(safeRequire('eslint-plugin-jsx-a11y')?.configs?.recommended?.rules ?? {})
		}
	}`

const REACT_NATIVE_BLOCK = `	{
		settings: { react: { version: 'detect' } },
		plugins: {
			react: safeRequire('eslint-plugin-react'),
			'react-hooks': safeRequire('eslint-plugin-react-hooks'),
			'react-native': safeRequire('eslint-plugin-react-native')
		},
		rules: {
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/display-name': 'off',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'react-native/no-unused-styles': 'warn',
			'react-native/no-inline-styles': 'warn',
			'react-native/no-color-literals': 'warn',
			'react-native/no-raw-text': 'off'
		}
	}`

const NEXT_BLOCK = `	(() => {
		const next = safeRequire('@next/eslint-plugin-next')
		if (!next) return {}
		return {
			plugins: { '@next/next': next },
			rules: { ...(next.configs?.recommended?.rules ?? {}), ...(next.configs?.['core-web-vitals']?.rules ?? {}) }
		}
	})()`

const TAILWIND_BLOCK = `	(() => {
		const tw = safeRequire('eslint-plugin-tailwindcss')
		if (!tw) return {}
		return { plugins: { tailwindcss: tw }, rules: { ...(tw.configs?.recommended?.rules ?? {}) } }
	})()`

const STORYBOOK_BLOCK = `	(() => {
		const sb = safeRequire('eslint-plugin-storybook')
		if (!sb) return {}
		return { plugins: { storybook: sb }, rules: { ...(sb.configs?.recommended?.rules ?? {}) } }
	})()`

const buildBlocks = (options: EslintConfigOptions): string => {
	const { framework, useTailwind, useStorybook } = options
	const blocks = [BASE_BLOCK]

	if (framework === 'react') blocks.push(REACT_BLOCK)
	else if (framework === 'react-native') blocks.push(REACT_NATIVE_BLOCK)
	else if (framework === 'nextjs') {
		blocks.push(REACT_BLOCK)
		blocks.push(NEXT_BLOCK)
	}

	if (useTailwind) blocks.push(TAILWIND_BLOCK)
	if (useStorybook) blocks.push(STORYBOOK_BLOCK)

	return blocks.join(',\n')
}

const generateConfig = (options: EslintConfigOptions): string => {
	return `${HEADER}
const eslintConfig = [
${buildBlocks(options)}
]

export default eslintConfig
`
}

export const generateNodeEslintConfig = (): string => generateConfig({ framework: 'node' })

export const generateReactEslintConfig = (options: EslintConfigOptions): string =>
	generateConfig({ ...options, framework: options.framework === 'react-native' ? 'react-native' : 'react' })

export const generateNextEslintConfig = (options: EslintConfigOptions): string =>
	generateConfig({ ...options, framework: 'nextjs' })
