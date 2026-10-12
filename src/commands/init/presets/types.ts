import { FrameworkId } from '@/commands/init/types'

export interface EslintPluginImport {
	moduleName: string
	localName: string
}

export interface FrameworkPreset {
	id: FrameworkId
	/** JSX projects lint .tsx/.jsx. */
	jsx: boolean
	/** eslint plugins beyond the shared house set (devDep names). */
	extraEslintPlugins: string[]
	eslintFrameworkImports: EslintPluginImport[]
	eslintFrameworkPlugins: Record<string, string>
	/** rule lines (already indented) inserted at the top of the shared rules block. */
	eslintFrameworkRules: string[]
	/** globals spread for languageOptions (`globals.node` / `globals.browser`). */
	eslintGlobals: 'node' | 'browser'
	/** tsconfig compilerOptions for a fresh generate (merge path adds only paths). */
	tsconfigCompilerOptions: Record<string, unknown>
	tsconfigInclude: string[]
	/** source glob lint-staged runs eslint + prettier on. */
	codeGlob: string
	/** framework runtime deps ensured per deps-placement rules. */
	runtimeDeps: string[]
	extraAtTypes: string[]
	/** node builds resolve `@/*` at compile time; bundler frameworks do it themselves. */
	needsTscAlias: boolean
}
