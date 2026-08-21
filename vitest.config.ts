import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const vitestConfig = defineConfig({
	esbuild: {
		target: 'esnext'
	},
	resolve: {
		// Mirror tsconfig `@/*` → `./src/*` so unit tests can import src directly.
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	test: {
		environment: 'node',
		pool: 'forks',
		include: ['tests/**/*.test.ts']
	}
})

export default vitestConfig
