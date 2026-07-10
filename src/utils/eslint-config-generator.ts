import type { Framework } from '@/commands/init/types/setup-pkgs'

export interface EslintConfigOptions {
	framework: Framework
	useTailwind?: boolean
	useStorybook?: boolean
	typescript?: boolean
}

import { name as PKG } from '../../package.json'

const buildWrapperConfig = (options: EslintConfigOptions): string => {
	const { framework, useTailwind, useStorybook } = options

	const parts: string[] = ['\teslintConfigNode']

	// nextjs config already composes react internally
	if (framework === 'react' || framework === 'react-native') {
		parts.push('\tpluginReact()')
	} else if (framework === 'nextjs') {
		parts.push('\tpluginNext()')
	}

	if (useTailwind) {
		parts.push('\tpluginTailwind()')
	}

	if (useStorybook) {
		parts.push('\tpluginStorybook()')
	}

	return parts.join(',\n')
}

const buildImports = (options: EslintConfigOptions): string => {
	const names = ['defineConfig', 'eslintConfigNode']
	const { framework, useTailwind, useStorybook } = options

	if (framework === 'react' || framework === 'react-native') names.push('pluginReact')
	else if (framework === 'nextjs') names.push('pluginNext')
	if (useTailwind) names.push('pluginTailwind')
	if (useStorybook) names.push('pluginStorybook')

	return `import { ${names.join(', ')} } from '${PKG}';`
}

const generateConfig = (options: EslintConfigOptions): string => {
	return `${buildImports(options)}

const eslintConfig = defineConfig(
${buildWrapperConfig(options)}
)

export default eslintConfig
`
}

export const generateNodeEslintConfig = (): string => generateConfig({ framework: 'node' })

export const generateReactEslintConfig = (options: EslintConfigOptions): string =>
	generateConfig({ ...options, framework: options.framework === 'react-native' ? 'react-native' : 'react' })

export const generateNextEslintConfig = (options: EslintConfigOptions): string =>
	generateConfig({ ...options, framework: 'nextjs' })
