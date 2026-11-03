import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createProgram, runProgram } from '@/cli';
import { PACKAGE } from '@/core/constants/package.constant';
import { HARNESS_MANIFEST } from '@/modules/harness/constants/harness-paths.constant';
import { harnessInstallEntries } from '@/modules/harness/services/install-plan.service';
import { HARNESS_CONFIG_DEFAULTS } from '@/modules/harness/templates/harness-config.template';

import { capture } from './support/capture-stream';
import { snapshotDir } from './support/fs-snapshot';
import { makeEmptyDir } from './support/tmp-dir';

const run = promisify(execFile);

const MEMORY_LIMIT = HARNESS_CONFIG_DEFAULTS.memory.maxChars;

const writeFile = (dir: string, path: string, content: string): void => {
	const full = join(dir, path);

	mkdirSync(dirname(full), {
		recursive: true
	});

	writeFileSync(full, content);
};

const makeRepo = async (): Promise<string> => {
	const dir = await makeEmptyDir();

	await run('git', ['init'], {
		cwd: dir
	});

	writeFile(dir, 'package.json', '{}\n');

	return dir;
};

const installHarness = (dir: string, settingsJson: string | null = null): void => {
	for (const entry of harnessInstallEntries({
		mode: 'existing',
		agentKit: false,
		claudeMd: null,
		settingsJson
	})) {
		writeFile(dir, entry.path, entry.content);
	}
};

const daysAgo = (days: number): string => {
	return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

let cwd = '';

beforeEach(() => {
	cwd = process.cwd();
});

afterEach(() => {
	process.chdir(cwd);
	process.exitCode = undefined;
});

const runCli = async (dir: string): Promise<{ stdout: string; exitCode: number }> => {
	process.chdir(dir);

	const program = createProgram({ exitOverride: true });

	const stdout = await capture(process.stdout, async () => {
		await capture(process.stderr, () => {
			return runProgram(program, ['node', 'jss-devtools', 'harness', 'doctor']);
		});
	});

	return {
		stdout,
		exitCode: Number(process.exitCode ?? 0)
	};
};

const LEARNED = (name: string): string => {
	return `---\nname: ${name}\nharness-origin: learned\n---\n\nbody\n`;
};

const setManifestVersion = (dir: string, version: string): void => {
	const path = join(dir, HARNESS_MANIFEST);
	const manifest = JSON.parse(readFileSync(path, 'utf8')) as { version: string };

	manifest.version = version;

	writeFile(dir, HARNESS_MANIFEST, `${JSON.stringify(manifest, null, '\t')}\n`);
};

describe('harness doctor, a fresh install', () => {
	it('reports nothing, prints the summary rows and writes nothing', async () => {
		const dir = await makeRepo();

		installHarness(dir);

		const before = snapshotDir(dir);
		const { stdout, exitCode } = await runCli(dir);

		expect(exitCode).toBe(0);
		expect(stdout).not.toContain('✖');
		expect(stdout).not.toContain('–');
		expect(stdout).toContain('chars,');
		expect(stdout).toMatch(/Decisions\s+0/);
		expect(stdout).not.toContain('decisions in force');
		expect(snapshotDir(dir)).toBe(before);
	});
});

describe('harness doctor, the learned skills row', () => {
	it('counts the learned skills in one row and names none of them', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.claude/skills/find-things/SKILL.md', LEARNED('find-things'));
		writeFile(dir, '.claude/skills/spot-bugs/SKILL.md', LEARNED('spot-bugs'));
		writeFile(
			dir,
			'.harness/state/skill-usage.json',
			`${JSON.stringify(
				{
					'find-things': daysAgo(0),
					'spot-bugs': daysAgo(0)
				},
				null,
				'\t'
			)}\n`
		);

		const { stdout, exitCode } = await runCli(dir);

		expect(exitCode).toBe(0);
		expect(stdout).toMatch(/Learned skills\s+2/);
		expect(stdout).not.toContain('find-things');
		expect(stdout).not.toContain('spot-bugs');
	});

	it('shows zero when no skill is learned', async () => {
		const dir = await makeRepo();

		installHarness(dir);

		const { stdout, exitCode } = await runCli(dir);

		expect(exitCode).toBe(0);
		expect(stdout).toMatch(/Learned skills\s+0/);
	});
});

describe('harness doctor, the check table', () => {
	it('errors when the manifest is missing', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		rmSync(join(dir, HARNESS_MANIFEST));

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('✖');
		expect(stdout).toContain('No harness manifest here');
		expect(stdout).toContain('jss-devtools init');
		expect(exitCode).toBe(1);
	});

	it('names an unsafe manifest path instead of saying the manifest is missing', async () => {
		const dir = await makeRepo();

		installHarness(dir);

		const manifest = JSON.parse(readFileSync(join(dir, HARNESS_MANIFEST), 'utf8')) as { files: unknown[] };

		manifest.files.push({
			path: '../escaped.txt',
			kind: 'managed',
			sha256: '0'.repeat(64)
		});

		writeFile(dir, HARNESS_MANIFEST, `${JSON.stringify(manifest, null, '\t')}\n`);

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('names a path outside the repository');
		expect(stdout).toContain('../escaped.txt');
		expect(stdout).not.toContain('No harness manifest here');
		expect(exitCode).toBe(1);
	});

	it('errors when the CLAUDE.md block markers are gone', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, 'CLAUDE.md', '# My repo\n');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('the harness block markers are missing from CLAUDE.md');
		expect(exitCode).toBe(1);
	});

	it('errors when a harness hook entry is missing from settings', async () => {
		const dir = await makeRepo();

		installHarness(dir);

		const settings = JSON.parse(readFileSync(join(dir, '.claude/settings.json'), 'utf8')) as {
			hooks: Record<string, unknown[]>;
		};

		delete settings.hooks['Stop'];
		writeFile(dir, '.claude/settings.json', `${JSON.stringify(settings, null, 2)}\n`);

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('missing harness hook entries in .claude/settings.json: Stop');
		expect(exitCode).toBe(1);
	});

	it('errors when settings is not valid JSON', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.claude/settings.json', '{oops\n');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('settings.json is not valid JSON');
		expect(exitCode).toBe(1);
	});

	it('errors when the hook shim is missing and names harness update', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		rmSync(join(dir, '.harness/bin/harness-hook.mjs'));

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('.harness/bin/harness-hook.mjs is missing');
		expect(stdout).toContain('jss-devtools harness update');
		expect(exitCode).toBe(1);
	});

	it('errors when the hook bundle differs from the manifest hash', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.harness/bin/hooks.mjs', `${readFileSync(join(dir, '.harness/bin/hooks.mjs'), 'utf8')}\n`);

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('.harness/bin/hooks.mjs differs from the manifest hash');
		expect(exitCode).toBe(1);
	});

	it('errors when config.json is not valid JSON', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.harness/config.json', '{"review": 8\n"memory": {}}\n');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('config.json is not valid JSON');
		expect(exitCode).toBe(1);
	});

	it('warns when a config key is missing and still exits 0', async () => {
		const dir = await makeRepo();

		installHarness(dir);

		const config = JSON.parse(readFileSync(join(dir, '.harness/config.json'), 'utf8')) as Record<
			string,
			Record<string, unknown>
		>;

		const curator = config['curator'] ?? {};

		delete curator['intervalDays'];
		writeFile(dir, '.harness/config.json', `${JSON.stringify(config, null, '\t')}\n`);

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('config.json is missing a usable "curator.intervalDays"');
		expect(exitCode).toBe(0);
	});

	it('errors when memory is over its limit', async () => {
		const dir = await makeRepo();

		installHarness(dir);

		const memory = readFileSync(join(dir, '.harness/MEMORY.md'), 'utf8');

		writeFile(dir, '.harness/MEMORY.md', `${memory}${'x'.repeat(MEMORY_LIMIT + 100 - memory.length)}\n`);

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain(`over the limit of ${MEMORY_LIMIT}`);
		expect(stdout).toContain('✖ Memory');
		expect(stdout).not.toContain('✔ Memory');
		expect(exitCode).toBe(1);
	});

	it('warns when memory is near its cap and still exits 0', async () => {
		const dir = await makeRepo();

		installHarness(dir);

		const memory = readFileSync(join(dir, '.harness/MEMORY.md'), 'utf8');

		writeFile(dir, '.harness/MEMORY.md', `${memory}${'x'.repeat(Math.floor(MEMORY_LIMIT * 0.9) - memory.length)}\n`);

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain(`% of its ${MEMORY_LIMIT} char limit`);
		expect(exitCode).toBe(0);
	});

	it('warns on docs index drift', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.harness/docs/extra.md', 'a doc no row knows\n');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('docs/README.md is missing rows for: extra');
		expect(exitCode).toBe(0);
	});

	it('errors when a base copy does not match the manifest', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.harness/core/base/.harness/templates/decision.md', 'edited after the install\n');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('Base copies');
		expect(stdout).toContain('.harness/templates/decision.md');
		expect(exitCode).toBe(1);
	});

	it('errors when the staged update session is corrupt', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.harness/update/session.json', '{"schema": 1, "conf');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('Staged update');
		expect(stdout).toContain('session.json');
		expect(exitCode).toBe(1);
	});

	it('warns when a decision has no quote of the user', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.harness/decisions/0001-test.md', '---\ntitle: Test\nstatus: accepted\n---\n\nbody\n');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('0001-test.md has no quote of the user');
		expect(exitCode).toBe(0);
	});

	it('warns when a decision has no title in its frontmatter', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.harness/decisions/0002-test.md', '---\nstatus: accepted\n---\n\n> do it this way\n');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('0002-test.md has no title in its frontmatter');
		expect(exitCode).toBe(0);
	});

	it('errors on a secret-shaped value under .harness/', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.harness/file.txt', 'api_key = sk-abcdef12345678\n');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('.harness/file.txt holds a secret-shaped value');
		expect(exitCode).toBe(1);
	});

	it('errors on a learned skill with invalid frontmatter', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.claude/skills/find-things/SKILL.md', 'harness-origin: learned\n\nno frontmatter\n');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('find-things/SKILL.md has invalid frontmatter');
		expect(exitCode).toBe(1);
	});

	it('errors on a learned skill with a reserved prefix', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.claude/skills/harness-evil/SKILL.md', LEARNED('harness-evil'));

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('harness-evil uses a reserved prefix');
		expect(exitCode).toBe(1);
	});

	it('warns when a learned skill is stale', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.claude/skills/old-skill/SKILL.md', LEARNED('old-skill'));
		writeFile(dir, '.harness/state/skill-usage.json', `${JSON.stringify({ 'old-skill': daysAgo(30) }, null, '\t')}\n`);

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('old-skill unused for 30 days');
		expect(stdout).toContain('harness-curate');
		expect(exitCode).toBe(0);
	});

	it('warns when a managed file changed from its base', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(
			dir,
			'.harness/templates/decision.md',
			`${readFileSync(join(dir, '.harness/templates/decision.md'), 'utf8')}\n`
		);

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('.harness/templates/decision.md changed from its base');
		expect(stdout).toContain('harness update` will merge it');
		expect(exitCode).toBe(0);
	});

	it('warns about a staged update', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(
			dir,
			'.harness/update/session.json',
			`${JSON.stringify(
				{
					schema: 1,
					from: '0.0.1',
					to: '0.0.1',
					conflicts: [],
					plan: []
				},
				null,
				'\t'
			)}\n`
		);

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain('jss-devtools harness update --continue');
		expect(stdout).toContain('--abort');
		expect(exitCode).toBe(0);
	});

	it('reports the installed version when it matches the CLI', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		setManifestVersion(dir, PACKAGE.version);

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain(`Version`);
		expect(stdout).toContain(PACKAGE.version);
		expect(stdout).not.toContain('installed, CLI is');
		expect(exitCode).toBe(0);
	});

	it('warns when the installed harness is older than the CLI', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		setManifestVersion(dir, '0.0.0');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain(`harness 0.0.0 installed, CLI is ${PACKAGE.version}`);
		expect(stdout).toContain('run jss-devtools harness update');
		expect(exitCode).toBe(0);
	});

	it('warns when the installed harness is newer than the CLI', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		setManifestVersion(dir, '99.0.0');

		const { stdout, exitCode } = await runCli(dir);

		expect(stdout).toContain(`installed by CLI 99.0.0, this CLI is ${PACKAGE.version}`);
		expect(stdout).toContain('curl -fsSL https://jss-devtools.jjuidev.com/install.sh | sh');
		expect(exitCode).toBe(0);
	});

	it('warns on uncommitted ak skill edits, and stays quiet once they are committed', async () => {
		const dir = await makeRepo();

		installHarness(dir);

		await run('git', ['add', '-A'], { cwd: dir });
		await run('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-m', 'x'], { cwd: dir });

		writeFile(dir, '.agentkit/config.yaml', 'paths:\n    docs: .harness/docs\n    plans: .harness/plans\n');
		writeFile(dir, '.claude/skills/ak-foo/SKILL.md', '---\nname: ak-foo\n---\n\nAgentKit owns this\n');

		const dirty = await runCli(dir);

		expect(dirty.stdout).toContain('`ak update` overwrites them');
		expect(dirty.exitCode).toBe(0);

		await run('git', ['add', '-A'], { cwd: dir });
		await run('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-m', 'x'], { cwd: dir });

		const clean = await runCli(dir);

		expect(clean.stdout).not.toContain('`ak update` overwrites them');
		expect(clean.exitCode).toBe(0);
	});
});

describe('harness doctor, writes and help', () => {
	it('leaves the repository byte for byte unchanged even with issues', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.harness/file.txt', 'api_key = sk-abcdef12345678\n');
		writeFile(dir, '.claude/skills/old-skill/SKILL.md', LEARNED('old-skill'));
		writeFile(dir, '.harness/state/skill-usage.json', `${JSON.stringify({ 'old-skill': daysAgo(30) }, null, '\t')}\n`);

		const before = snapshotDir(dir);
		const { exitCode } = await runCli(dir);

		expect(exitCode).toBe(1);
		expect(snapshotDir(dir)).toBe(before);
	});

	it('documents the checks and the exit codes in its help', async () => {
		const dir = await makeRepo();

		process.chdir(dir);

		const program = createProgram({ exitOverride: true });

		const stdout = await capture(process.stdout, async () => {
			await capture(process.stderr, () => {
				return runProgram(program, ['node', 'jss-devtools', 'harness', 'doctor', '--help']);
			});
		});

		expect(stdout).toContain('the harness hook entries in .claude/settings.json');
		expect(stdout).toContain('the installed harness version against the running');
		expect(stdout).toContain('Exit codes: 0 when the harness is healthy or has warnings only, 1 when any check fails.');
		expect(existsSync(join(dir, '.harness'))).toBe(false);
	});
});
