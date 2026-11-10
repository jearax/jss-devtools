import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

import { tailwindAutoReference } from './vite/tailwind-auto-reference.plugin.ts';

// Dev only. The hash comes from the file path, so a style edit renames nothing.
const readableScopedName = (name: string, filename: string) => {
	const file = path.relative(import.meta.dirname, filename.split('?')[0] ?? filename);
	const hash = createHash('sha256').update(`${file}:${name}`).digest('base64url').slice(0, 5);

	return `${path.basename(path.dirname(file))}__${name}--${hash}`;
};

// The hero's eyebrow prints the CLI's real version, read once at build time.
const cliVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

// The brand icons ship in the react package; resolved through its exports, never copied into public/.
const brandDir = path.dirname(fileURLToPath(import.meta.resolve('@jjuidev/react/brand/favicon.svg')));

const viteConfig = defineConfig(({ mode }) => {
	return {
		plugins: [
			tailwindAutoReference(),
			react(),
			tailwindcss(),
			// overwrite 'error' fails the build when a brand icon and public/ ship the same path.
			viteStaticCopy({
				targets: [
					{
						src: `${brandDir}/*.{ico,png,svg}`,
						dest: '.',
						rename: { stripBase: true },
						overwrite: 'error'
					},
					{
						src: 'public/*',
						dest: '.',
						rename: { stripBase: true },
						overwrite: 'error'
					}
				]
			})
		],
		publicDir: false,
		define: {
			__CLI_VERSION__: JSON.stringify(cliVersion)
		},
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
