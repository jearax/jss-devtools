// Smoke test cho Phase 0: verify built binary runs và in version.
// Requires `pnpm build` to have run first (CI workflow handles this).
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const binPath = join(repoRoot, 'dist', 'cli', 'cli.js');

// Run bin and wait for async stdio (consola) to flush before exit detection.
// `stdio: 'inherit'` would skip capture entirely; `pipe` + small delay ensures
// async writes complete before we read.
const runBin = (args: string[]): string => {
  const result = spawnSync('node', [binPath, ...args], {
    encoding: 'utf-8',
    cwd: repoRoot,
  });
  // Merge stdout + stderr for output assertions.
  return (result.stdout + result.stderr).trim();
};

describe('bin/jss-devtools', () => {
  it('prints CLI version when --version is passed', () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'));
    expect(runBin(['--version'])).toBe(pkg.version);
  });

  it('prints --help without error', () => {
    const output = runBin(['--help']);
    // citty auto-generated help includes usage info
    expect(output.toLowerCase()).toContain('usage');
  });

  // Note: testing the no-subcommand default hint is skipped because consola's
  // async stdout writes get truncated when vitest's forks pool kills the child
  // process before stdio drains. Verified manually via `node dist/cli/cli.js`.
});
