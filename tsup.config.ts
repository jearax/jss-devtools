import { defineConfig } from 'tsup'

// tsup externalizes package.json dependencies on its own; only the CLI entry is bundled.
const tsupConfig = defineConfig({
	entry: ['src/cli.ts'],
	outDir: 'dist/cli',
	format: ['esm'],
	target: 'node24',
	platform: 'node',
	clean: true,
	banner: { js: '#!/usr/bin/env node' },
	dts: false,
	sourcemap: false,
	minify: false,
	splitting: false
})

export default tsupConfig
