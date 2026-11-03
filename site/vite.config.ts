import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const viteConfig = defineConfig({
	plugins: [react()],
	build: {
		outDir: 'dist'
	}
});

export default viteConfig;
