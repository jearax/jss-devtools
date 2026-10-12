import { FrameworkPreset } from '@/commands/init/presets/types'

export const reactPreset: FrameworkPreset = {
	id: 'react',
	jsx: true,
	extraEslintPlugins: ['eslint-plugin-react', 'eslint-plugin-react-hooks'],
	eslintFrameworkImports: [
		{
			moduleName: 'eslint-plugin-react',
			localName: 'pluginReact'
		},
		{
			moduleName: 'eslint-plugin-react-hooks',
			localName: 'pluginReactHooks'
		}
	],
	eslintFrameworkPlugins: {
		react: 'pluginReact',
		'react-hooks': 'pluginReactHooks'
	},
	eslintFrameworkRules: [
		"'react/jsx-uses-react': 'off',",
		"'react/react-in-jsx-scope': 'off',",
		"'react/prop-types': 'off',",
		'',
		"...pluginReactHooks.configs['recommended-latest'].rules,"
	],
	eslintGlobals: 'browser',
	tsconfigCompilerOptions: {
		target: 'ES2022',
		lib: ['ES2024', 'DOM', 'DOM.Iterable'],
		module: 'ESNext',
		moduleResolution: 'Bundler',
		jsx: 'react-jsx',
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
		}
	},
	tsconfigInclude: ['src/**/*', '**/*.ts', '**/*.tsx'],
	codeGlob: '{src,test}/**/*.{js,jsx,mjs,ts,tsx}',
	runtimeDeps: ['react', 'react-dom'],
	extraAtTypes: ['@types/react', '@types/react-dom'],
	needsTscAlias: false
}
