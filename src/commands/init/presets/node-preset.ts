import { FrameworkPreset } from '@/commands/init/presets/types'

export const nodePreset: FrameworkPreset = {
	id: 'node',
	jsx: false,
	extraEslintPlugins: [],
	eslintFrameworkImports: [],
	eslintFrameworkPlugins: {},
	eslintFrameworkRules: [],
	eslintGlobals: 'node',
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
	tsconfigInclude: ['src/**/*.ts', 'test/**/*.ts', '*.ts'],
	codeGlob: '{src,test}/**/*.ts',
	runtimeDeps: [],
	extraAtTypes: ['@types/node'],
	needsTscAlias: true
}
