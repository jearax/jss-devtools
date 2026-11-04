import { createHash } from 'node:crypto';
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { tailwindAutoReference } from './vite/tailwind-auto-reference.plugin.ts';

// Dev only. The hash comes from the file path, so a style edit renames nothing.
const readableScopedName = (name: string, filename: string) => {
	const file = path.relative(import.meta.dirname, filename.split('?')[0] ?? filename);
	const hash = createHash('sha256').update(`${file}:${name}`).digest('base64url').slice(0, 5);

	return `${path.basename(path.dirname(file))}__${name}--${hash}`;
};

const viteConfig = defineConfig(({ mode }) => {
	return {
		plugins: [tailwindAutoReference(), react(), tailwindcss()],
		resolve: {
			tsconfigPaths: true
		},
		build: {
			outDir: 'dist'
		},
		...(mode === 'development'
			? {
					css: {
						devSourcemap: true,
						modules: {
							generateScopedName: readableScopedName
						}
					}
				}
			: {})
	};
});

export default viteConfig;
