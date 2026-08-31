import { FrameworkId } from '@/commands/init/types'

export interface EslintPluginImport {
	/** npm module imported at the top of the generated config. */
	moduleName: string
	/** local variable the import binds to. */
	localName: string
}

export interface FrameworkPreset {
	id: FrameworkId
	/** eslint plugins beyond the shared house set (devDep names). */
	extraEslintPlugins: string[]
	/** framework imports + flat `plugins` entries + rules appended to the base config. */
	eslintFrameworkImports: EslintPluginImport[]
	eslintFrameworkPlugins: Record<string, string>
	eslintFrameworkRules: string
	/** globals expression for languageOptions (`globals.node` / spread browser). */
	eslintGlobalsExpr: string
	/** tsconfig compilerOptions for a fresh generate (merge path adds only paths). */
	tsconfigCompilerOptions: Record<string, unknown>
	tsconfigInclude: string[]
	/** quoted globs joined into the format script. */
	formatGlobs: string[]
	/** glob key for the lint-staged code entry. */
	lintStagedGlob: string
	/** framework runtime deps ensured per deps-placement rules. */
	runtimeDeps: string[]
	extraAtTypes: string[]
	/** node builds resolve `@/*` at compile time; bundler frameworks do it themselves. */
	needsTscAlias: boolean
}
