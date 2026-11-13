import { defineConfig } from 'vitest/config';

const vitestE2eConfig = defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		globals: true,
		root: './',
		include: ['**/*.e2e-spec.ts']
	}
});

export default vitestE2eConfig;
