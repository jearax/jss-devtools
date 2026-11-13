import { readFileSync } from 'node:fs';

import { defineConfig } from 'tsdown';

import { readFrameworkTemplate } from './scripts/framework-template.mjs';
import { readPackageInfo } from './scripts/package-info.mjs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
	dependencies?: Record<string, string>;
};

const hookBundleText = (): string => {
	return readFileSync(new URL('./dist/hooks.mjs', import.meta.url), 'utf8');
};

const nestTemplate = readFrameworkTemplate('nest');

const tsdownConfig = defineConfig({
	entry: ['src/cli.ts'],
	outDir: 'dist',
	format: ['esm'],
	platform: 'node',
	target: 'node24',
	clean: false,
	dts: false,
	sourcemap: false,
	minify: false,
	banner: { js: '#!/usr/bin/env node' },
	// `tests/bundle.test.ts` is the real guard; `onlyBundle: false` only silences tsdown's hint.
	deps: {
		alwaysBundle: Object.keys(pkg.dependencies ?? {}),
		onlyBundle: false
	},
	inputOptions: {
		onLog: (level, log, handler) => {
			handler(log.code === 'UNRESOLVED_IMPORT' ? 'error' : level, log);
		}
	},
	define: {
		__JSS_PACKAGE__: JSON.stringify(readPackageInfo()),
		__HARNESS_HOOK_BUNDLE__: JSON.stringify(hookBundleText()),
		__NEST_TEMPLATE__: JSON.stringify(nestTemplate)
	}
});

export default tsdownConfig;
