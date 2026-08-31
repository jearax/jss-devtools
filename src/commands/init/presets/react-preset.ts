import { FrameworkPreset } from '@/commands/init/presets/types'

// react/next share the same plugin pair; next keeps bundler-native alias
// resolution (no tsc-alias) and its own jsx preserve mode.
const reactRules = `
				// eslint-plugin-react
				'react/jsx-uses-react': 'off',
				'react/react-in-jsx-scope': 'off',
				'react/prop-types': 'off',

				// eslint-plugin-react-hooks
				'react-hooks/rules-of-hooks': 'error',
				'react-hooks/exhaustive-deps': 'warn'
`

export const reactPreset: FrameworkPreset = {
	id: 'react',
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
	eslintFrameworkRules: reactRules,
	eslintGlobalsExpr: '...globals.browser',
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
	tsconfigInclude: ['src/**/*'],
	formatGlobs: ['"{src,app,components,lib}/**/*.{js,jsx,ts,tsx}"', '"*.{ts,tsx}"'],
	lintStagedGlob: '{src,app,components,lib}/**/*.{ts,tsx,js,jsx}',
	runtimeDeps: ['react', 'react-dom'],
	extraAtTypes: ['@types/react', '@types/react-dom'],
	needsTscAlias: false
}
