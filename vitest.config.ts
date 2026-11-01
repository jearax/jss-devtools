import { defineConfig } from 'vitest/config';

import { readPackageInfo } from './scripts/package-info.mjs';

const vitestConfig = defineConfig({
	define: {
		__JSS_PACKAGE__: JSON.stringify(readPackageInfo()),
		__HARNESS_HOOK_BUNDLE__: JSON.stringify('__HARNESS_HOOK_BUNDLE_PLACEHOLDER__')
	},
	resolve: {
		tsconfigPaths: true
	},
	test: {
		environment: 'node',
		include: ['tests/**/*.test.ts'],
		globalSetup: ['tests/setup/global-setup.ts']
	}
});

export default vitestConfig;
