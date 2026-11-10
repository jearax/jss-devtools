import path from 'node:path';

import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

const vitestConfig = defineConfig((env) => {
	return mergeConfig(viteConfig(env), {
		// The default hash follows CSS content, so a style edit would rewrite unrelated snapshots.
		css: {
			modules: {
				generateScopedName: (name: string, filename: string) => {
					return `${path.basename(path.dirname(filename))}_${name}`;
				}
			}
		},
		/*
		 * Discovered late by the render path, `react-dom/client` would otherwise be optimized
		 * mid-run: Vite reloads the tester iframes, and the one loading at that moment never
		 * reports ready — the CI suite dies on an iframe timeout. Declared here, the optimizer
		 * warms it before the first iframe loads.
		 */
		optimizeDeps: {
			include: ['react-dom/client', '@mantine/hooks']
		},
		test: {
			include: ['src/**/*.test.{ts,tsx}'],
			setupFiles: ['./vitest.setup.ts'],
			/*
			 * The browser's clipboard belongs to the browser, not to a test file, so two files that
			 * copy at the same time overwrite each other's value. The files run one after the other.
			 */
			fileParallelism: false,
			browser: {
				enabled: true,
				headless: true,
				// Smooth scroll stalls in the test iframe and keeps elements from settling.
				// The clipboard permissions let the copy button be tested against the real clipboard.
				provider: playwright({
					contextOptions: {
						reducedMotion: 'reduce',
						permissions: ['clipboard-read', 'clipboard-write']
					}
				}),
				instances: [{ browser: 'chromium' }]
			}
		}
	});
});

export default vitestConfig;
