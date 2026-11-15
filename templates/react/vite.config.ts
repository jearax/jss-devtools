import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const viteConfig = defineConfig({
	plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
	resolve: {
		tsconfigPaths: true
	}
});

export default viteConfig;
