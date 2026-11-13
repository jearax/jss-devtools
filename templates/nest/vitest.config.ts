import { defineConfig } from 'vitest/config';

const vitestConfig = defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		globals: true,
		root: './',
		include: ['**/*.spec.ts']
	}
});

export default vitestConfig;
