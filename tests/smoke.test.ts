import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const binPath = join(repoRoot, 'dist', 'cli', 'cli.js');

const runBin = (args: string[]): string => {
  const argList = args.map((a) => `'${a}'`).join(' ');
  return execSync(`node '${binPath}' ${argList} 2>&1`, {
    encoding: 'utf-8',
    cwd: repoRoot,
  }).trim();
};

describe('bin/jss-devtools', () => {
  it('prints CLI version when --version is passed', () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'));
    expect(runBin(['--version'])).toContain(pkg.version);
  });

  it('prints CLI version when -v is passed', () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'));
    expect(runBin(['-v'])).toContain(pkg.version);
  });

  it('prints --help with banner + usage', () => {
    const output = runBin(['--help']);
    expect(output).toContain('JavaScript stack dev tools CLI');
    expect(output.toLowerCase()).toContain('usage');
  });

  // Note: testing the no-subcommand default hint is skipped because consola's
  // async stdout writes get truncated when execSync returns before buffer drains.
  // Verified manually via `node dist/cli/cli.js`.

  it('runs version subcommand with banner', () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'));
    const output = runBin(['version']);
    expect(output).toContain('JavaScript stack dev tools CLI');
    expect(output).toContain(pkg.version);
  });

  it('runs help subcommand with banner + usage', () => {
    const output = runBin(['help']);
    expect(output).toContain('JavaScript stack dev tools CLI');
    expect(output.toLowerCase()).toContain('usage');
  });

  it('runs upgrade --help with banner + subcommand name', () => {
    const output = runBin(['upgrade', '--help']);
    expect(output).toContain('Upgrade CLI'); // subcommand description
    expect(output.toLowerCase()).toContain('upgrade');
  });

  it('runs downgrade --help with banner + subcommand name', () => {
    const output = runBin(['downgrade', '--help']);
    expect(output).toContain('Downgrade CLI'); // subcommand description
    expect(output.toLowerCase()).toContain('downgrade');
  });

  it('runs uninstall --help with banner + subcommand name', () => {
    const output = runBin(['uninstall', '--help']);
    expect(output).toContain('Uninstall CLI'); // subcommand description
    expect(output.toLowerCase()).toContain('uninstall');
  });

  it('runs update --help with banner + subcommand name', () => {
    const output = runBin(['update', '--help']);
    expect(output).toContain('Update CLI'); // subcommand description
    expect(output.toLowerCase()).toContain('update');
  });

  it('runs update check --help with banner + subcommand name', () => {
    const output = runBin(['update', 'check', '--help']);
    expect(output).toContain('Show 5 latest'); // check subcommand description
    expect(output.toLowerCase()).toContain('check');
  });
});
