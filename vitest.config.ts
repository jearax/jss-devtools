import { defineConfig } from 'vitest/config';

// Naming convention: define biến với suffix `Config`, sau đó export default.
// Vitest cần `export default` để auto-discover config.
const vitestConfig = defineConfig({
  // vitest uses vite's esbuild which doesn't recognize 'ES2024' as target label.
  // Map to 'esnext' for vitest's internal transform — keeps tsconfig's ES2024 for tsc.
  esbuild: {
    target: 'esnext',
  },
  test: {
    environment: 'node',
    // Use 'forks' pool — `threads` pool has stdio capture issues with child_process
    // spawning external binaries (output written via async consola gets dropped).
    pool: 'forks',
    include: ['tests/**/*.test.ts'],
  },
});

export default vitestConfig;
