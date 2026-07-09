/**
 * ESLint Config Generator (Wrapper / Magic approach)
 *
 * Generates an eslint.config.mjs that imports ready-made configs from the
 * published @jearax/jss-devtools package instead of inlining every plugin.
 * This is pure string templating — no real import of the package at build time,
 * so there is no circular dependency when bundling the CLI. The package name
 * resolves normally at the consumer's runtime (after `npm install`).
 */

import type { Framework } from '@/commands/init/types/setup-pkgs'

export interface EslintConfigOptions {
	framework: Framework
	useTailwind?: boolean
	useStorybook?: boolean
	typescript?: boolean
}

import { name as PKG } from '../../package.json'

/**
 * Build the wrapper config body: always include the base node config, then
 * compose framework/optional plugin factories as needed. All factories return
 * Promises that are awaited and flattened into the config array.
 */
const buildWrapperConfig = (options: EslintConfigOptions): string => {
	const { framework, useTailwind, useStorybook } = options

	// Don't spread eslintConfigNode - it's already an array
	const parts: string[] = ['\t...eslintConfigNode']

	// Framework plugins (next already composes react internally).
	if (framework === 'react' || framework === 'react-native') {
		parts.push('\t...pluginReact()')
	} else if (framework === 'nextjs') {
		parts.push('\t...pluginNext()')
	}

	if (useTailwind) {
		parts.push('\t...pluginTailwind()')
	}

	if (useStorybook) {
		parts.push('\t...pluginStorybook()')
	}

	return parts.join(',\n')
}

/** Collect only the named imports actually used by the generated config. */
const buildImports = (options: EslintConfigOptions): string => {
	const names = ['eslintConfigNode']
	const { framework, useTailwind, useStorybook } = options

	if (framework === 'react' || framework === 'react-native') names.push('pluginReact')
	else if (framework === 'nextjs') names.push('pluginNext')
	if (useTailwind) names.push('pluginTailwind')
	if (useStorybook) names.push('pluginStorybook')

	return `import { ${names.join(', ')} } from '${PKG}';`
}

/** Generate the eslint.config.mjs content for any framework. */
const generateConfig = (options: EslintConfigOptions): string => {
	return `${buildImports(options)}

export default [
${buildWrapperConfig(options)}
];
`
}

export const generateNodeEslintConfig = (): string => generateConfig({ framework: 'node' })

export const generateReactEslintConfig = (options: EslintConfigOptions): string =>
	generateConfig({ ...options, framework: options.framework === 'react-native' ? 'react-native' : 'react' })

export const generateNextEslintConfig = (options: EslintConfigOptions): string =>
	generateConfig({ ...options, framework: 'nextjs' })
