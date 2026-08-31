import { FrameworkPreset } from '@/commands/init/presets/types'

export const nodePreset: FrameworkPreset = {
	id: 'node',
	extraEslintPlugins: [],
	eslintFrameworkImports: [],
	eslintFrameworkPlugins: {},
	eslintFrameworkRules: '',
	eslintGlobalsExpr: 'globals.node',
	tsconfigCompilerOptions: {
		target: 'ES2022',
		lib: ['ES2024'],
		module: 'ESNext',
		moduleResolution: 'Bundler',
		resolveJsonModule: true,
		allowSyntheticDefaultImports: true,
		esModuleInterop: true,
		strict: true,
		skipLibCheck: true,
		forceConsistentCasingInFileNames: true,
		isolatedModules: true,
		verbatimModuleSyntax: false,
		noEmit: true,
		paths: {
			'@/*': ['./src/*']
		},
		types: ['node']
	},
	tsconfigInclude: ['src/**/*', 'tests/**/*'],
	formatGlobs: ['"{src,tests}/**/*.{js,ts,jsx,tsx}"', '"*.ts"'],
	lintStagedGlob: '{src,tests}/**/*.{ts,tsx,js,jsx}',
	runtimeDeps: [],
	extraAtTypes: ['@types/node'],
	needsTscAlias: true
}
