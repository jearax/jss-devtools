import { reactPreset } from '@/commands/init/presets/react-preset'
import { FrameworkPreset } from '@/commands/init/presets/types'

export const nextPreset: FrameworkPreset = {
	...reactPreset,
	id: 'next',
	// Next compiles with its own toolchain: preserve JSX + the next plugin,
	// bundler alias resolution (tsconfig paths read natively — no tsc-alias).
	tsconfigCompilerOptions: {
		...reactPreset.tsconfigCompilerOptions,
		jsx: 'preserve',
		plugins: [
			{
				name: 'next'
			}
		]
	},
	tsconfigInclude: ['next-env.d.ts', 'src/**/*'],
	runtimeDeps: ['next', 'react', 'react-dom'],
	needsTscAlias: false
}
