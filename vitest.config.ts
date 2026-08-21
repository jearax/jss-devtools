import { defineConfig } from 'vitest/config'

const vitestConfig = defineConfig({
	esbuild: {
		target: 'esnext'
	},
	test: {
		environment: 'node',
		pool: 'forks',
		include: ['tests/**/*.test.ts']
	}
})

export default vitestConfig
