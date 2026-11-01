import { defineConfig } from 'tsdown';

const tsdownHooksConfig = defineConfig({
	entry: ['src/modules/harness/harness-hook.entry.ts'],
	outDir: 'dist',
	format: ['esm'],
	platform: 'node',
	target: 'node24',
	clean: true,
	dts: false,
	sourcemap: false,
	minify: false,
	outputOptions: {
		entryFileNames: 'hooks.mjs'
	}
});

export default tsdownHooksConfig;
