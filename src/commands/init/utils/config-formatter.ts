// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/**
 * require() that never throws. Returns null when a package (or one of its
 * import-time peers) is missing, so a single absent plugin never crashes the
 * whole eslint.config.mjs. Every plugin factory is built only from packages
 * that actually load.
 */
const safeRequire = (pkg: string): any => {
	try {
		return require(pkg)
	} catch {
		return null
	}
}

/**
 * Resolve typescript-eslint parser + plugin + recommended rules.
 * Prefers the meta-package, falls back to standalone parser + plugin.
 * Returns null when neither is installed.
 */
const resolveTsParts = (): { parser: any; plugin: any; rules: Record<string, any> } | null => {
	const meta = safeRequire('typescript-eslint')
	if (meta?.configs?.recommended) {
		const rules: Record<string, any> = {}
		for (const c of Array.isArray(meta.configs.recommended) ? meta.configs.recommended : []) {
			if (c.rules) Object.assign(rules, c.rules)
		}
		return { parser: meta.parser, plugin: meta.plugin, rules }
	}
	const parser = safeRequire('@typescript-eslint/parser')
	const plugin = safeRequire('@typescript-eslint/eslint-plugin')
	if (parser && plugin) {
		return { parser: parser.parser ?? parser, plugin, rules: plugin.configs?.recommended?.rules ?? {} }
	}
	return null
}

const ts = resolveTsParts()
const pluginJs = safeRequire('@eslint/js')
const plugAutofix = safeRequire('eslint-plugin-autofix')
const pluginImport = safeRequire('eslint-plugin-import')
const pluginPreferArrow = safeRequire('eslint-plugin-prefer-arrow-functions')
const globalsMod = safeRequire('globals')

const buildBaseRules = (): Record<string, any> => {
	const rules: Record<string, any> = {
		...(pluginJs?.configs?.recommended?.rules ?? {}),
		...(ts?.rules ?? {})
	}

	if (plugAutofix) {
		Object.assign(rules, {
			'autofix/eol-last': 'error',
			'autofix/curly': 'error',
			'autofix/no-lonely-if': 'error',
			'autofix/no-else-return': 'error',
			'autofix/object-shorthand': 'error',
			'autofix/object-curly-newline': [
				'error',
				{ ObjectExpression: { multiline: true, minProperties: 2, consistent: true } }
			]
		})
	} else {
		// object-curly-newline is a core rule, safe without the autofix plugin
		rules['object-curly-newline'] = [
			'error',
			{ ObjectExpression: { multiline: true, minProperties: 2, consistent: true } }
		]
	}

	if (ts) {
		Object.assign(rules, {
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
			'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'no-type-imports' }]
		})
	}

	if (pluginPreferArrow) rules['prefer-arrow-functions/prefer-arrow-functions'] = 'error'

	if (pluginImport) {
		Object.assign(rules, {
			'import/first': 'error',
			'import/newline-after-import': 'error',
			'import/no-duplicates': 'error',
			'import/no-anonymous-default-export': 'error',
			'import/order': [
				'error',
				{
					'newlines-between': 'always',
					alphabetize: { order: 'asc', caseInsensitive: true },
					pathGroups: [{ pattern: '@/**', group: 'internal' }],
					groups: ['builtin', 'external', ['internal', 'parent', 'sibling', 'index'], ['object', 'unknown', 'type']]
				}
			]
		})
	}

	// Core ESLint rules (no plugin namespace)
	Object.assign(rules, {
		'padding-line-between-statements': [
			'error',
			{ blankLine: 'any', prev: 'export', next: 'export' },
			{ blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
			{ blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
			{ blankLine: 'always', prev: '*', next: ['function', 'multiline-const', 'multiline-block-like'] },
			{ blankLine: 'always', prev: ['function', 'multiline-const', 'multiline-block-like'], next: '*' }
		]
	})

	return rules
}

const buildBasePlugins = (): Record<string, any> => {
	const plugins: Record<string, any> = {}
	if (ts?.plugin) plugins['@typescript-eslint'] = ts.plugin
	if (pluginImport) plugins.import = pluginImport
	if (pluginPreferArrow) plugins['prefer-arrow-functions'] = pluginPreferArrow
	if (plugAutofix) plugins.autofix = plugAutofix
	return plugins
}

// Base config as a single flat config object: compose as
// `export default [eslintConfigNode, pluginReact(), ...]` without spreading.
export const eslintConfigNode: Record<string, any> = {
	files: ['**/*.{js,ts,jsx,tsx}'],
	languageOptions: {
		...(globalsMod ? { globals: { ...globalsMod.node, ...globalsMod.browser } } : {}),
		...(ts?.parser ? { parser: ts.parser } : {})
	},
	plugins: buildBasePlugins(),
	rules: buildBaseRules()
}

// Each factory returns a single flat config object built only from plugins
// that actually load. A missing plugin/peer degrades gracefully to a partial
// (or empty {}) config instead of crashing eslint.config.mjs.
export const pluginReact = (): Record<string, any> => {
	const react = safeRequire('eslint-plugin-react')
	const reactHooks = safeRequire('eslint-plugin-react-hooks')
	const reactNative = safeRequire('eslint-plugin-react-native')
	const plugins: Record<string, any> = {}
	if (react) plugins.react = react
	if (reactNative) plugins['react-native'] = reactNative
	if (reactHooks) plugins['react-hooks'] = reactHooks

	const rules: Record<string, any> = {}
	if (react) {
		Object.assign(rules, {
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/display-name': 'off',
			'react/jsx-boolean-value': 'error',
			'react/jsx-curly-brace-presence': ['error', 'never'],
			'react/self-closing-comp': 'error'
		})
	}
	if (reactNative) {
		Object.assign(rules, {
			'react-native/no-unused-styles': 'warn',
			'react-native/no-inline-styles': 'warn',
			'react-native/no-color-literals': 'warn',
			'react-native/no-raw-text': 'off'
		})
	}
	if (reactHooks) {
		Object.assign(rules, {
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn'
		})
	}

	if (Object.keys(plugins).length === 0) return {}
	return {
		settings: { react: { version: 'detect' } },
		plugins,
		rules
	}
}

export const pluginNext = (): Record<string, any> => {
	const next = safeRequire('@next/eslint-plugin-next')
	if (!next) return {}
	return {
		plugins: { '@next/next': next },
		rules: {
			...(next.configs?.recommended?.rules ?? {}),
			...(next.configs?.['core-web-vitals']?.rules ?? {})
		}
	}
}

export const pluginStorybook = (): Record<string, any> => {
	const storybook = safeRequire('eslint-plugin-storybook')
	if (!storybook) return {}
	return {
		plugins: { storybook },
		rules: { ...(storybook.configs?.recommended?.rules ?? {}) }
	}
}

export const pluginTailwind = (): Record<string, any> => {
	const tailwind = safeRequire('eslint-plugin-tailwindcss')
	if (!tailwind) return {}
	return {
		plugins: { tailwindcss: tailwind },
		rules: { ...(tailwind.configs?.recommended?.rules ?? {}) }
	}
}

// Merge multiple configs (objects or arrays) into one flat array.
export const defineConfig = (...configs: any[]) => {
	if (configs.length === 0) return [eslintConfigNode]
	return configs.flat()
}

export default eslintConfigNode
