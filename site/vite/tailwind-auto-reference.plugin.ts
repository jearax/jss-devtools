import type { Plugin } from 'vite';

export const tailwindAutoReference = (entry = '/src/styles/styles.css'): Plugin => {
	const HAS_REFERENCE = /@reference\s+['"]/;

	return {
		name: 'tailwind-auto-reference',
		enforce: 'pre',
		transform: (code, id) => {
			// Referencing the entry from its own token files would be circular.
			if (!id.endsWith('.css') || !id.includes('/src/') || id.includes('/src/styles/')) {
				return null;
			}

			if (HAS_REFERENCE.test(code)) {
				return null;
			}

			return `@reference "${entry}";\n${code}`;
		}
	};
};
