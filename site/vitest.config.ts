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
		test: {
			include: ['src/**/*.test.{ts,tsx}'],
			setupFiles: ['./vitest.setup.ts'],
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
