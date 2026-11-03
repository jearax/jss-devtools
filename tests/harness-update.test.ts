import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createProgram, runProgram } from '@/cli';
import { runHarnessUpdate } from '@/commands/harness/update.command';
import { buildInitPlan } from '@/commands/init/services/plan.service';
import { applyInitPlan } from '@/commands/init/services/write.service';
import { CliError } from '@/core/errors/cli.error';
import { HOOK_TIMEOUT_SECONDS } from '@/modules/harness/constants/harness-limits.constant';
import {
	HARNESS_MANIFEST,
	HARNESS_UPDATE_DIR,
	HARNESS_UPDATE_LOCK,
	HARNESS_UPDATE_SESSION
} from '@/modules/harness/constants/harness-paths.constant';
import { harnessInstallEntries, harnessRecordedFiles, sha256 } from '@/modules/harness/services/install-plan.service';

import { capture } from './support/capture-stream';
import { snapshotDir } from './support/fs-snapshot';
import { makeEmptyDir } from './support/tmp-dir';

import type { HarnessRelease } from '@/modules/harness/types/update.type';

const run = promisify(execFile);

const MANAGED = '.harness/templates/decision.md';

const recordedOf = (path: string): string => {
	const entry = harnessRecordedFiles(false).find((file) => {
		return file.path === path;
	});

	if (entry === undefined) {
		throw new Error(`no recorded template for ${path}`);
	}

	return entry.content;
};

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

const installHarness = (dir: string, settingsJson: string | null = null, agentKit = false): void => {
	for (const entry of harnessInstallEntries({
		mode: 'existing',
		agentKit,
		claudeMd: null,
		settingsJson
	})) {
		writeFile(dir, entry.path, entry.content);
	}
};

const manifestVersionOf = (dir: string): string => {
	return (JSON.parse(readFileSync(join(dir, HARNESS_MANIFEST), 'utf8')) as { version: string }).version;
};

const manifestPathsOf = (dir: string): string[] => {
	const manifest = JSON.parse(readFileSync(join(dir, HARNESS_MANIFEST), 'utf8')) as {
		files: Array<{ path: string }>;
	};

	return manifest.files.map((file) => {
		return file.path;
	});
};

const ageManifest = (dir: string, version = '0.0.0'): void => {
	const manifest = JSON.parse(readFileSync(join(dir, HARNESS_MANIFEST), 'utf8')) as { version: string };

	writeFile(
		dir,
		HARNESS_MANIFEST,
		`${JSON.stringify(
			{
				...manifest,
				version
			},
			null,
			'\t'
		)}\n`
	);
};

const ageBase = (dir: string, path: string, content: string): void => {
	writeFile(dir, `.harness/core/base/${path}`, content);

	const manifest = JSON.parse(readFileSync(join(dir, HARNESS_MANIFEST), 'utf8')) as {
		files: Array<{ path: string; sha256: string }>;
	};

	const entry = manifest.files.find((file) => {
		return file.path === path;
	});

	if (entry !== undefined) {
		entry.sha256 = sha256(content);
	}

	writeFile(dir, HARNESS_MANIFEST, `${JSON.stringify(manifest, null, '\t')}\n`);
};

const stubbedRelease = (edits: Record<string, string>, version = '0.9.0') => {
	return {
		version,
		files: harnessRecordedFiles(false).map((file) => {
			return edits[file.path] === undefined
				? file
				: {
						...file,
						content: edits[file.path]
					};
		})
	};
};

const FAKE_COMMAND = {
	name: () => {
		return 'update';
	},
	parent: {
		rawArgs: ['node', 'jss-devtools', 'harness', 'update']
	}
} as never;

let cwd = '';

beforeEach(() => {
	cwd = process.cwd();
});

afterEach(() => {
	process.chdir(cwd);
	process.exitCode = undefined;
});

const releaseHolder = vi.hoisted(() => {
	return {
		current: undefined as { version: string; files: readonly unknown[] } | undefined
	};
});

vi.mock('@/modules/harness/services/update-release.service', async (importOriginal) => {
	const actual = await importOriginal<{
		harnessRelease: (root: string) => HarnessRelease;
	}>();

	return {
		...actual,
		harnessRelease: (root: string) => {
			return releaseHolder.current ?? actual.harnessRelease(root);
		}
	};
});

const runUpdate = async (
	dir: string,
	options: { continue?: boolean; abort?: boolean; yes?: boolean; dryRun?: boolean } = {},
	release?: ReturnType<typeof stubbedRelease>
): Promise<void> => {
	process.chdir(dir);
	releaseHolder.current = release;

	try {
		await runHarnessUpdate({ ...options }, FAKE_COMMAND);
	} finally {
		releaseHolder.current = undefined;
	}
};

const loadStagedSession = (dir: string): unknown => {
	const path = join(dir, HARNESS_UPDATE_SESSION);

	return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
};

const readLive = (dir: string, path: string): string | null => {
	const full = join(dir, path);

	return existsSync(full) ? readFileSync(full, 'utf8') : null;
};

const seedForeignFiles = (dir: string): void => {
	writeFile(dir, '.harness/MEMORY.md', 'user memory edit\n');
	writeFile(dir, '.harness/archive/old.md', 'archived\n');
	writeFile(dir, '.harness/curator.json', '{\n\t"learned": []\n}\n');
	writeFile(dir, '.claude/skills/find-leaks/SKILL.md', '---\nname: find-leaks\nharness-origin: learned\n---\n\nbody\n');
	writeFile(dir, 'eslint.config.mjs', 'toolchain file the CLI owns\n');
};

const expectForeignFilesUntouched = (dir: string): void => {
	expect(readLive(dir, '.harness/MEMORY.md')).toBe('user memory edit\n');
	expect(readLive(dir, '.harness/archive/old.md')).toBe('archived\n');
	expect(readLive(dir, '.harness/curator.json')).toBe('{\n\t"learned": []\n}\n');
	expect(readLive(dir, '.claude/skills/find-leaks/SKILL.md')).toContain('harness-origin: learned');
	expect(readLive(dir, 'eslint.config.mjs')).toBe('toolchain file the CLI owns\n');
};

describe('harness update, the per-path table', () => {
	it('takes upstream for a managed file the user never touched', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		ageBase(dir, MANAGED, 'old base\nold body\n');
		writeFile(dir, MANAGED, 'old base\nold body\n');

		const upstream = `${recordedOf(MANAGED)}\n`;

		await runUpdate(dir, { yes: true }, stubbedRelease({ [MANAGED]: upstream }));

		expect(readLive(dir, MANAGED)).toBe(upstream);
		expect(readLive(dir, `.harness/core/base/${MANAGED}`)).toBe(upstream);
	});
});

describe('harness update, more of the per-path table', () => {
	it('keeps a managed file the user edited when upstream did not change', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		const edited = `${recordedOf(MANAGED)}user note\n`;

		writeFile(dir, MANAGED, edited);

		await runUpdate(dir, { yes: true }, stubbedRelease({}));

		expect(readLive(dir, MANAGED)).toBe(edited);
	});

	it('merges edits at opposite ends and conflicts on overlapping edits', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		const old = 'old line 1\nold line 2\nold line 3\n';

		ageBase(dir, MANAGED, old);
		writeFile(dir, MANAGED, `${old}local tail\n`);

		const upstream = `upstream head\n${old}`;

		await runUpdate(dir, { yes: true }, stubbedRelease({ [MANAGED]: upstream }));

		expect(readLive(dir, MANAGED)).toBe(`upstream head\n${old}local tail\n`);

		const conflictDir = await makeRepo();

		installHarness(conflictDir);
		ageManifest(conflictDir);
		ageBase(conflictDir, MANAGED, old);
		writeFile(conflictDir, MANAGED, 'old line 1\nlocally changed\nold line 3\n');

		await expect(
			runUpdate(conflictDir, { yes: true }, stubbedRelease({ [MANAGED]: 'old line 1\nupstream changed\nold line 3\n' }))
		).rejects.toThrow('conflicting');

		expect(readLive(conflictDir, MANAGED)).toBe('old line 1\nlocally changed\nold line 3\n');
		expect(existsSync(join(conflictDir, `${HARNESS_UPDATE_DIR}/base/${MANAGED}`))).toBe(true);
		expect(existsSync(join(conflictDir, `${HARNESS_UPDATE_DIR}/local/${MANAGED}`))).toBe(true);
		expect(existsSync(join(conflictDir, `${HARNESS_UPDATE_DIR}/upstream/${MANAGED}`))).toBe(true);
		expect(existsSync(join(conflictDir, `${HARNESS_UPDATE_DIR}/resolved/${MANAGED}`))).toBe(true);
		expect(existsSync(join(conflictDir, HARNESS_UPDATE_SESSION))).toBe(true);
	});
});

const resolveStaged = (dir: string, path: string, content: string): void => {
	writeFile(dir, `${HARNESS_UPDATE_DIR}/resolved/${path}`, content);
};

describe('harness update, the conflict flows', () => {
	it('continues after the resolved copy is clean and refuses while it holds markers', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		const old = 'old line 1\nold line 2\n';

		ageBase(dir, MANAGED, old);
		const local = 'locally changed\nold line 2\n';

		writeFile(dir, MANAGED, local);
		const upstream = 'upstream changed\nold line 2\n';

		await expect(runUpdate(dir, { yes: true }, stubbedRelease({ [MANAGED]: upstream }))).rejects.toThrow('conflicting');

		expect(readLive(dir, MANAGED)).toBe(local);

		resolveStaged(dir, MANAGED, '<<<<<<< HEAD\nboth\n>>>>>>> main\n');

		await expect(runUpdate(dir, { continue: true }, stubbedRelease({ [MANAGED]: upstream }))).rejects.toThrow(
			'conflict markers'
		);

		resolveStaged(dir, MANAGED, 'resolved by hand\nold line 2\n');

		await runUpdate(
			dir,
			{
				continue: true,
				yes: true
			},
			stubbedRelease({ [MANAGED]: upstream })
		);

		expect(readLive(dir, MANAGED)).toBe('resolved by hand\nold line 2\n');
		expect(existsSync(join(dir, HARNESS_UPDATE_DIR))).toBe(false);
		expect(manifestVersionOf(dir)).toBe('0.9.0');
		expect(readLive(dir, `.harness/core/base/${MANAGED}`)).toBe(upstream);
	});

	it('aborts a staged update and leaves every live file as it was', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		const old = 'old line 1\nold line 2\n';

		ageBase(dir, MANAGED, old);
		const local = 'locally changed\nold line 2\n';

		writeFile(dir, MANAGED, local);

		await expect(
			runUpdate(dir, { yes: true }, stubbedRelease({ [MANAGED]: 'upstream changed\nold line 2\n' }))
		).rejects.toThrow('conflicting');

		seedForeignFiles(dir);
		const before = readLive(dir, MANAGED);

		await runUpdate(dir, { abort: true }, stubbedRelease({}));

		expect(existsSync(join(dir, HARNESS_UPDATE_DIR))).toBe(false);
		expect(readLive(dir, MANAGED)).toBe(before);
		expect(manifestVersionOf(dir)).toBe('0.0.0');
		expectForeignFilesUntouched(dir);
	});

	it('refuses to continue without a staged update', async () => {
		const dir = await makeRepo();

		installHarness(dir);

		await expect(runUpdate(dir, { continue: true })).rejects.toThrow('No staged harness update');
	});
});

describe('harness update, deletions and the bundle', () => {
	it('conflicts when a managed file was deleted locally', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		rmSync(join(dir, MANAGED));

		await expect(runUpdate(dir, { yes: true }, stubbedRelease({}))).rejects.toThrow('deleted locally');
		expect(existsSync(join(dir, MANAGED))).toBe(false);
	});

	it('deletes a dropped upstream file that was untouched and conflicts on an edited one', async () => {
		const dropped = '.harness/templates/skill.md';

		const untouched = await makeRepo();

		installHarness(untouched);
		ageManifest(untouched);

		const trimmed = stubbedRelease({}).files.filter((file) => {
			return (file as { path: string }).path !== dropped;
		});

		await runUpdate(
			untouched,
			{ yes: true },
			{
				version: '0.9.0',
				files: trimmed
			}
		);

		expect(existsSync(join(untouched, dropped))).toBe(false);

		const edited = await makeRepo();

		installHarness(edited);
		ageManifest(edited);
		writeFile(edited, dropped, `${recordedOf(dropped)}user edit\n`);

		await expect(
			runUpdate(
				edited,
				{ yes: true },
				{
					version: '0.9.0',
					files: trimmed
				}
			)
		).rejects.toThrow('dropped upstream');
		expect(readLive(edited, dropped)).toContain('user edit');
	});

	it('always overwrites the hook bundle, never merges it', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		const bundle = '.harness/bin/hooks.mjs';

		writeFile(dir, bundle, 'hand edited bundle\n');
		const upstream = `${recordedOf(bundle)}\n`;

		await runUpdate(dir, { yes: true }, stubbedRelease({ [bundle]: upstream }));

		expect(readLive(dir, bundle)).toBe(upstream);
	});
});

const FOREIGN_SETTINGS = JSON.stringify(
	{
		hooks: {
			PostToolUse: [
				{
					matcher: 'stripe',
					hooks: [
						{
							type: 'command',
							command: 'stripe listen'
						}
					]
				},
				{
					matcher: null,
					hooks: [
						{
							type: 'command',
							command: 'node "$CLAUDE_PROJECT_DIR/.harness/bin/harness-hook.mjs" --legacy'
						}
					]
				}
			]
		}
	},
	null,
	2
);

describe('harness update, settings and config', () => {
	it('replaces both harness entries and keeps every other hook', async () => {
		const dir = await makeRepo();

		installHarness(dir, FOREIGN_SETTINGS);
		ageManifest(dir);

		await runUpdate(dir, { yes: true }, stubbedRelease({}));

		const settings = JSON.parse(readFileSync(join(dir, '.claude/settings.json'), 'utf8')) as {
			hooks: Record<string, Array<{ hooks: Array<{ command: string }> }>>;
		};

		const postToolUse = settings.hooks['PostToolUse'] ?? [];

		const commands = postToolUse.flatMap((item) => {
			return item.hooks.map((hook) => {
				return hook.command;
			});
		});

		expect(commands).toContain('stripe listen');
		expect(
			commands.some((command) => {
				return command.includes('harness-hook.mjs') && command.includes('--legacy');
			})
		).toBe(false);
		expect(
			commands.filter((command) => {
				return command.includes('harness-hook.mjs');
			}).length
		).toBe(2);
	});

	it('repairs a missing config key at the same version and says up to date otherwise', async () => {
		const broken = await makeRepo();

		installHarness(broken);
		const config = JSON.parse(readFileSync(join(broken, '.harness/config.json'), 'utf8')) as Record<string, unknown>;

		delete (config['curator'] as Record<string, unknown>)['intervalDays'];
		writeFile(broken, '.harness/config.json', `${JSON.stringify(config, null, '\t')}\n`);

		await runUpdate(broken, { yes: true });

		const repaired = JSON.parse(readFileSync(join(broken, '.harness/config.json'), 'utf8')) as Record<string, unknown>;

		expect((repaired['curator'] as Record<string, unknown>)['intervalDays']).toBe(7);
		expect((config['curator'] as Record<string, unknown>)['intervalDays']).toBeUndefined();

		const clean = await makeRepo();

		installHarness(clean);

		await runUpdate(clean, {});

		expect(manifestVersionOf(clean)).toBe('0.0.1');
	});
});

describe('harness update, preflight', () => {
	it('says up to date and writes nothing at the same version', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		seedForeignFiles(dir);

		await runUpdate(dir, {});

		expect(manifestVersionOf(dir)).toBe('0.0.1');
		expectForeignFilesUntouched(dir);
		expect(existsSync(join(dir, HARNESS_UPDATE_DIR))).toBe(false);
	});

	it('exits 1 without a manifest, on a downgrade, with a missing base, and with a staged update', async () => {
		const noManifest = await makeRepo();

		await expect(runUpdate(noManifest, { yes: true })).rejects.toThrow('No harness manifest');

		const downgrade = await makeRepo();

		installHarness(downgrade);
		ageManifest(downgrade, '9.0.0');

		await expect(runUpdate(downgrade, { yes: true })).rejects.toThrow('refusing downgrade 9.0.0 -> 0.0.1');

		const noBase = await makeRepo();

		installHarness(noBase);
		ageManifest(noBase);
		rmSync(join(noBase, `.harness/core/base/${MANAGED}`));

		await expect(runUpdate(noBase, { yes: true })).rejects.toThrow('Missing base copies');

		const staged = await makeRepo();

		installHarness(staged);
		ageManifest(staged);
		const old = 'old line 1\n';

		ageBase(staged, MANAGED, old);
		writeFile(staged, MANAGED, 'local\n');

		await expect(runUpdate(staged, { yes: true }, stubbedRelease({ [MANAGED]: 'upstream\n' }))).rejects.toThrow(
			'conflicting'
		);
		await expect(runUpdate(staged, { yes: true }, stubbedRelease({ [MANAGED]: 'upstream\n' }))).rejects.toThrow(
			'already staged'
		);
	});

	it('names the line of invalid config.json and leaves the repo byte for byte unchanged', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeFile(dir, '.harness/config.json', '{"review": 8\n"memory": {}}\n');

		const snapshot = snapshotDir(dir);

		await expect(runUpdate(dir, { yes: true })).rejects.toThrow('line 2');

		expect(snapshotDir(dir)).toBe(snapshot);
	});

	it('refuses to run while the lock file is held', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		writeFile(dir, HARNESS_UPDATE_LOCK, '');

		await expect(runUpdate(dir, { yes: true }, stubbedRelease({}))).rejects.toThrow('Another harness update');
	});

	it('shows the plan in a dry run and writes nothing', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		ageBase(dir, MANAGED, 'old base\n');
		writeFile(dir, MANAGED, 'old base\n');

		const snapshot = snapshotDir(dir);

		await runUpdate(dir, { dryRun: true }, stubbedRelease({ [MANAGED]: `${recordedOf(MANAGED)}\n` }));

		expect(snapshotDir(dir)).toBe(snapshot);
	});

	it('keeps seeds, learned skills, the archive, curator.json and the toolchain untouched through a clean update', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		seedForeignFiles(dir);
		ageBase(dir, MANAGED, 'old base\n');
		writeFile(dir, MANAGED, 'old base\n');

		await runUpdate(dir, { yes: true }, stubbedRelease({ [MANAGED]: `${recordedOf(MANAGED)}\n` }));

		expect(manifestVersionOf(dir)).toBe('0.9.0');
		expectForeignFilesUntouched(dir);
	});
});

describe('harness update, the manifest paths', () => {
	const escapedUpdate = async (
		template: string
	): Promise<{ failure: unknown; path: string; outside: string | null; before: string; after: string }> => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);

		const badPath = template.replace('escaped.txt', `escaped-${basename(dir)}.txt`);

		const baseCopy = resolve(dir, `.harness/core/base/${badPath}`);

		mkdirSync(dirname(baseCopy), {
			recursive: true
		});

		writeFileSync(baseCopy, 'untouched\n');

		const outside = isAbsolute(badPath) ? null : resolve(dir, badPath);

		if (outside !== null) {
			writeFileSync(outside, 'untouched\n');
		}

		const manifest = JSON.parse(readFileSync(join(dir, HARNESS_MANIFEST), 'utf8')) as { files: unknown[] };

		manifest.files.push({
			path: badPath,
			kind: 'managed',
			sha256: '0'.repeat(64)
		});

		writeFile(dir, HARNESS_MANIFEST, `${JSON.stringify(manifest, null, '\t')}\n`);

		const before = snapshotDir(dir);

		const failure = await runUpdate(dir, { yes: true }).catch((error: unknown) => {
			return error;
		});

		const content = outside === null ? null : readFileSync(outside, 'utf8');

		if (outside !== null) {
			rmSync(outside, {
				force: true
			});
		}

		return {
			failure,
			path: badPath,
			outside: content,
			before,
			after: snapshotDir(dir)
		};
	};

	it('refuses a path that climbs out of the repository', async () => {
		const result = await escapedUpdate('../escaped.txt');

		expect(result.failure).toBeInstanceOf(CliError);
		expect((result.failure as CliError).message).toContain(result.path);
		expect(result.outside).toBe('untouched\n');
		expect(result.after).toBe(result.before);
	});

	it('refuses a path that climbs out through a folder', async () => {
		const result = await escapedUpdate('a/../../escaped.txt');

		expect(result.failure).toBeInstanceOf(CliError);
		expect((result.failure as CliError).message).toContain(result.path);
		expect(result.outside).toBe('untouched\n');
		expect(result.after).toBe(result.before);
	});

	it('refuses an absolute path', async () => {
		const result = await escapedUpdate('/etc/jss-devtools-escape');

		expect(result.failure).toBeInstanceOf(CliError);
		expect((result.failure as CliError).message).toContain(result.path);
		expect(result.after).toBe(result.before);
	});
});

describe('harness update, a corrupt staged session', () => {
	it('aborts it, and refuses to update or continue', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		writeFile(dir, HARNESS_UPDATE_SESSION, '{"schema": 1, "conf');

		await expect(runUpdate(dir, { yes: true })).rejects.toThrow(HARNESS_UPDATE_SESSION);
		await expect(runUpdate(dir, { continue: true })).rejects.toThrow(HARNESS_UPDATE_SESSION);

		await runUpdate(dir, { abort: true });

		expect(existsSync(join(dir, HARNESS_UPDATE_DIR))).toBe(false);
	});
});

describe('harness update, the base copies', () => {
	it('refuses to update when a base copy does not match the manifest', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		writeFile(dir, `.harness/core/base/${MANAGED}`, 'edited after the install\n');

		const before = snapshotDir(dir);

		const failure = await runUpdate(dir, { yes: true }).catch((error: unknown) => {
			return error;
		});

		expect(failure).toBeInstanceOf(CliError);
		expect((failure as CliError).message).toContain(MANAGED);
		expect((failure as CliError).hint).toContain('git checkout .harness/core');
		expect(snapshotDir(dir)).toBe(before);
	});
});

type SettingsHooks = Record<string, Array<{ hooks: Array<{ command: string; async: boolean; timeout?: number }> }>>;

const harnessHookEntries = (dir: string): Array<{ command: string; async: boolean; timeout?: number }> => {
	const settings = JSON.parse(readFileSync(join(dir, '.claude/settings.json'), 'utf8')) as { hooks: SettingsHooks };

	return Object.values(settings.hooks).flatMap((group) => {
		return group.flatMap((item) => {
			return item.hooks;
		});
	});
};

const withoutTimeouts = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map(withoutTimeouts);
	}

	if (typeof value === 'object' && value !== null) {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>)
				.filter(([key]) => {
					return key !== 'timeout';
				})
				.map(([key, entry]) => {
					return [key, withoutTimeouts(entry)];
				})
		);
	}

	return value;
};

describe('harness update, the hook timeouts', () => {
	const splitByAsync = (
		entries: ReadonlyArray<{ async: boolean; timeout?: number }>
	): { sync: Array<{ async: boolean; timeout?: number }>; background: Array<{ async: boolean; timeout?: number }> } => {
		return {
			sync: entries.filter((entry) => {
				return !entry.async;
			}),
			background: entries.filter((entry) => {
				return entry.async;
			})
		};
	};

	it('gives the three synchronous hooks a timeout and the async ones none', async () => {
		const dir = await makeRepo();

		installHarness(dir);

		const entries = harnessHookEntries(dir);
		const { sync, background } = splitByAsync(entries);

		expect(entries).toHaveLength(5);
		expect(sync).toHaveLength(3);
		expect(background).toHaveLength(2);

		for (const entry of sync) {
			expect(entry.timeout).toBe(HOOK_TIMEOUT_SECONDS);
		}

		for (const entry of background) {
			expect(entry.timeout).toBeUndefined();
		}
	});

	it('brings settings written by the previous release up to the new entries', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);

		const settings = JSON.parse(readFileSync(join(dir, '.claude/settings.json'), 'utf8')) as unknown;

		writeFile(dir, '.claude/settings.json', `${JSON.stringify(withoutTimeouts(settings), null, 2)}\n`);

		await runUpdate(dir, { yes: true });

		const { sync, background } = splitByAsync(harnessHookEntries(dir));

		expect(sync).toHaveLength(3);

		for (const entry of sync) {
			expect(entry.timeout).toBe(HOOK_TIMEOUT_SECONDS);
		}

		for (const entry of background) {
			expect(entry.timeout).toBeUndefined();
		}
	});
});

describe('harness update, through the CLI', () => {
	const runCli = async (...args: readonly string[]): Promise<{ stdout: string; stderr: string }> => {
		const program = createProgram({ exitOverride: true });
		let stderr = '';

		const stdout = await capture(process.stdout, async () => {
			stderr = await capture(process.stderr, () => {
				return runProgram(program, ['node', 'jss-devtools', ...args]);
			});
		});

		return {
			stdout,
			stderr
		};
	};

	const UPDATE_HELP = `Usage: jss-devtools harness update [options]

Bring the harness to the installed CLI version, keeping your edits

Options:
  --continue  Apply the staged resolution in .harness/update/ after you resolved
              the conflicts (default: off)
  --abort     Discard the staged update; live files were never changed (default:
              off)
  --yes, -y   Skip the questions and use the defaults (asks in a terminal;
              default: off)
  --dry-run   Show what would change; write and install nothing (default: off)
  --help, -h  Display help for command

Examples:
  $ jss-devtools harness update            Bring the harness to the installed CLI version
  $ jss-devtools harness update --dry-run  Show what would change, write nothing
  $ jss-devtools harness update -y         Apply without asking (CI)
  $ jss-devtools harness update --continue Apply the staged conflict resolution
  $ jss-devtools harness update --abort    Discard the staged update
`;

	it('prints its help exactly as documented', async () => {
		const { stdout } = await runCli('harness', 'update', '--help');

		expect(stdout).toBe(UPDATE_HELP);
		expect(process.exitCode).toBe(0);
	});

	it('exits 1 with the staged paths and the two next commands on a conflict, and 0 on --abort', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		const old = 'old line 1\n';

		ageBase(dir, MANAGED, old);
		writeFile(dir, MANAGED, 'local\n');

		process.chdir(dir);

		const failure = await runCli('harness', 'update', '-y');

		expect(failure.stderr).toContain('conflicting');
		expect(failure.stderr).toContain(MANAGED);
		expect(failure.stderr).toContain('jss-devtools harness update --continue');
		expect(failure.stderr).toContain('jss-devtools harness update --abort');

		const aborted = await runCli('harness', 'update', '--abort');

		expect(aborted.stderr).toBe('');
		expect(existsSync(join(dir, HARNESS_UPDATE_DIR))).toBe(false);
	});
});

describe('harness update, dry run over a conflict', () => {
	it('stages nothing on a dry run, even with conflicts', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		const old = 'old line 1\n';

		ageBase(dir, MANAGED, old);
		writeFile(dir, MANAGED, 'locally changed\n');

		const snapshot = snapshotDir(dir);

		await runUpdate(dir, { dryRun: true }, stubbedRelease({ [MANAGED]: 'upstream changed\n' }));

		expect(existsSync(join(dir, HARNESS_UPDATE_DIR))).toBe(false);
		expect(snapshotDir(dir)).toBe(snapshot);
	});
});

describe('harness update, the continue flow asks like a clean update', () => {
	const stageOneConflict = async (): Promise<string> => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		const old = 'old line 1\n';

		ageBase(dir, MANAGED, old);
		writeFile(dir, MANAGED, 'locally changed\n');

		await expect(runUpdate(dir, { yes: true }, stubbedRelease({ [MANAGED]: 'upstream changed\n' }))).rejects.toThrow(
			'conflicting'
		);

		writeFile(dir, `${HARNESS_UPDATE_DIR}/resolved/${MANAGED}`, 'resolved by hand\n');

		return dir;
	};

	it('applies with -y and clears the session', async () => {
		const dir = await stageOneConflict();

		await runUpdate(
			dir,
			{
				continue: true,
				yes: true
			},
			stubbedRelease({ [MANAGED]: 'upstream changed\n' })
		);

		expect(readLive(dir, MANAGED)).toBe('resolved by hand\n');
		expect(existsSync(join(dir, HARNESS_UPDATE_DIR))).toBe(false);
	});

	it('exits 1 without a terminal and without -y, leaving the session and the live tree unchanged', async () => {
		const dir = await stageOneConflict();
		const before = snapshotDir(dir);

		await expect(
			runUpdate(dir, { continue: true }, stubbedRelease({ [MANAGED]: 'upstream changed\n' }))
		).rejects.toThrow('Not a terminal');

		expect(snapshotDir(dir)).toBe(before);
		expect(existsSync(join(dir, HARNESS_UPDATE_DIR))).toBe(true);
		expect(loadStagedSession(dir)).not.toBeNull();
	});

	it('stops on a dry run and writes nothing', async () => {
		const dir = await stageOneConflict();
		const before = snapshotDir(dir);

		await runUpdate(
			dir,
			{
				continue: true,
				dryRun: true
			},
			stubbedRelease({ [MANAGED]: 'upstream changed\n' })
		);

		expect(snapshotDir(dir)).toBe(before);
	});
});

const AGENT_KIT_LINES = [
	'  - `ak-*` skills, `.claude/{hooks,rules,agents,output-styles,scripts}/`: `ak update`.',
	'- AgentKit owns `.harness/{docs,plans}/`: follow its skills there. It also works in `.harness/decisions/`.'
].join('\n');

const AGENT_KIT_CONFIG = 'paths:\n    docs: .harness/docs\n    plans: .harness/plans\n';

const writeAgentKitConfig = (dir: string): void => {
	writeFile(dir, '.agentkit/config.yaml', AGENT_KIT_CONFIG);
};

const writeAgentKitSkill = (dir: string): void => {
	writeFile(dir, '.claude/skills/ak-demo/SKILL.md', '---\nname: ak-demo\n---\n\nbody\n');
};

describe('harness update, the AgentKit lines of the CLAUDE block', () => {
	it('keeps the AgentKit lines in a repository that still holds the AgentKit config', async () => {
		const dir = await makeRepo();

		installHarness(dir, null, true);
		writeAgentKitConfig(dir);
		ageManifest(dir);

		await runUpdate(dir, { yes: true });

		expect(readLive(dir, 'CLAUDE.md') ?? '').toContain(AGENT_KIT_LINES);
	});

	it('adds the AgentKit lines to a repository that gained the AgentKit config', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		writeAgentKitConfig(dir);

		await runUpdate(dir, { yes: true });

		expect(readLive(dir, 'CLAUDE.md') ?? '').toContain(AGENT_KIT_LINES);
	});

	it('removes the AgentKit lines from a repository that lost the AgentKit config', async () => {
		const dir = await makeRepo();

		installHarness(dir, null, true);
		writeAgentKitConfig(dir);
		ageManifest(dir);
		rmSync(join(dir, '.agentkit'), { recursive: true });

		await runUpdate(dir, { yes: true });

		const claudeMd = readLive(dir, 'CLAUDE.md') ?? '';

		expect(claudeMd).not.toContain(AGENT_KIT_LINES);
		expect(claudeMd).not.toContain('AgentKit');
	});

	it('counts ak-* skills without the AgentKit config as no AgentKit', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		writeAgentKitSkill(dir);

		await runUpdate(dir, { yes: true });

		const claudeMd = readLive(dir, 'CLAUDE.md') ?? '';

		expect(claudeMd).not.toContain(AGENT_KIT_LINES);
		expect(claudeMd).not.toContain('AgentKit');
	});

	it('keeps the AgentKit lines when init --agent-kit is followed by harness update', async () => {
		const dir = await makeRepo();

		const plan = buildInitPlan(
			{
				mode: 'existing',
				targetDir: dir,
				projectName: 'app',
				pm: 'pnpm',
				pmVersion: '11.0.0',
				packageJson: { parsed: {} }
			},
			{ agentKit: true }
		);

		await applyInitPlan(plan);
		writeAgentKitConfig(dir);
		ageManifest(dir);

		await runUpdate(dir, { yes: true });

		expect(readLive(dir, 'CLAUDE.md') ?? '').toContain(AGENT_KIT_LINES);
	});

	it('writes the AgentKit plan paths into the managed plan files on update', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		ageManifest(dir);
		writeAgentKitConfig(dir);

		await runUpdate(dir, { yes: true });

		const managed = [
			readLive(dir, '.harness/plans/README.md') ?? '',
			readLive(dir, '.harness/templates/README.md') ?? '',
			readLive(dir, '.harness/templates/plan.md') ?? ''
		];

		for (const content of managed) {
			expect(content).not.toContain('plans/active');
			expect(content).not.toContain('completed/');
		}

		expect(managed[0]).toContain('The plan skill that owns this folder');
		expect(managed[0]).not.toContain('<YYMMDD>');
		expect(readLive(dir, 'CLAUDE.md') ?? '').not.toMatch(/^\| Work spanning sessions/m);
	});

	it('leaves the plans README of a repository with AgentKit to the repository', async () => {
		const dir = await makeRepo();

		installHarness(dir, null, true);
		writeAgentKitConfig(dir);
		ageManifest(dir);

		const readme = readLive(dir, '.harness/plans/README.md') ?? '';

		writeFile(dir, '.harness/plans/README.md', `${readme}| 261103-1500-example | Completed | a plan that ran |\n`);

		await runUpdate(dir, { yes: true });

		expect(readLive(dir, '.harness/plans/README.md') ?? '').toContain('261103-1500-example');
	});

	it('keeps an edited plans README when it becomes a seed, and drops it from the manifest', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeAgentKitConfig(dir);
		ageManifest(dir);

		const readme = readLive(dir, '.harness/plans/README.md') ?? '';

		writeFile(dir, '.harness/plans/README.md', `${readme}\nthe agent wrote this\n`);

		await runUpdate(dir, { yes: true });

		expect(readLive(dir, '.harness/plans/README.md') ?? '').toContain('the agent wrote this');
		expect(manifestPathsOf(dir)).not.toContain('.harness/plans/README.md');
	});

	it('takes the current seed for an untouched plans README and drops it from the manifest', async () => {
		const dir = await makeRepo();

		installHarness(dir);
		writeAgentKitConfig(dir);
		ageManifest(dir);

		await runUpdate(dir, { yes: true });

		const readme = readLive(dir, '.harness/plans/README.md') ?? '';

		expect(readme).toContain('The plan skill that owns this folder');
		expect(readme).not.toContain('plans/active');
		expect(manifestPathsOf(dir)).not.toContain('.harness/plans/README.md');
	});
});
