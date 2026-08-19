// Smoke test cho Phase 0: verify built binary runs và in version.
// Requires `pnpm build` to have run first (CI workflow handles this).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const binPath = join(repoRoot, 'dist', 'cli', 'cli.js');

describe('bin/jss-devtools', () => {
  it('prints CLI version when --version is passed', () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'));
    const output = execFileSync('node', [binPath, '--version'], { encoding: 'utf-8' }).trim();
    expect(output).toBe(pkg.version);
  });

  it('prints --help without error', () => {
    const output = execFileSync('node', [binPath, '--help'], { encoding: 'utf-8' });
    // citty auto-generated help includes usage info
    expect(output.toLowerCase()).toContain('usage');
  });

  it('prints default hint when no subcommand provided', () => {
    const output = execFileSync('node', [binPath], { encoding: 'utf-8' });
    expect(output).toContain('--help');
  });
});
