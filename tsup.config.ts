import { defineConfig } from 'tsup'

// Naming convention: define biến với suffix `Config`, sau đó export default.
// Tsup cần `export default` để auto-discover config.
const tsupConfig = defineConfig({
	entry: ['src/cli.ts'],
	outDir: 'dist/cli',
	format: ['esm'],
	target: 'node24',
	platform: 'node',
	clean: true,
	banner: { js: '#!/usr/bin/env node' },
	dts: false,
	sourcemap: true,
	minify: false,
	splitting: false,
	// External tất cả runtime deps để install size không bloat
	external: ['@clack/prompts', 'citty', 'consola', 'execa', 'figlet', 'nypm', 'pathe']
})

export default tsupConfig
