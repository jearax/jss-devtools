import { defineConfig } from 'vitest/config';

import { readFrameworkTemplate } from './scripts/framework-template.mjs';
import { readPackageInfo } from './scripts/package-info.mjs';

const vitestConfig = defineConfig({
	define: {
		__JSS_PACKAGE__: JSON.stringify(readPackageInfo()),
		__HARNESS_HOOK_BUNDLE__: JSON.stringify('__HARNESS_HOOK_BUNDLE_PLACEHOLDER__'),
		__NEST_TEMPLATE__: JSON.stringify(readFrameworkTemplate('nest'))
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
