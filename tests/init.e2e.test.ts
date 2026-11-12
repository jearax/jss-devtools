import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { harnessInstallEntries } from '@/modules/harness/services/install-plan.service';

import { CLI, TIMEOUT, available, run } from './support/init-e2e';

// Needs the network for the installs and every manager on PATH, so it stays out of the default
// `pnpm test`: run it alone with `INIT_E2E=1 pnpm vitest run tests/init.e2e.test.ts` after a build
// (the vitest globalSetup builds the bundle when it is missing).
const enabled = process.env['INIT_E2E'] === '1';

const MANAGERS = ['bun', 'pnpm', 'yarn', 'npm'] as const;

type Manager = (typeof MANAGERS)[number];

const gitOut = (cwd: string, args: readonly string[]): Promise<string> => {
	return run('git', args, { cwd }).then((result) => {
		return result.stdout.trim();
	});
};

const DECIDED_FILES = [
	'.editorconfig',
	'.gitignore',
	'.husky/commit-msg',
	'.husky/pre-commit',
	'.prettierignore',
	'.prettierrc.json',
	'.vscode/extensions.json',
	'.vscode/settings.json',
	'commitlint.config.mjs',
	'eslint.config.mjs',
	'package.json',
	'src/main.ts',
	'tsconfig.json'
];

const HARNESS_FILES = harnessInstallEntries({
	mode: 'create',
	agentKit: false,
	claudeMd: null,
	settingsJson: null
})
	.map((entry) => {
		return entry.path;
	})
	.toSorted();

const runHook = (project: string, payload: Record<string, unknown>): { stdout: string; code: number } => {
	const result = spawnSync(process.execPath, [join(project, '.harness/bin/harness-hook.mjs')], {
		cwd: project,
		input: JSON.stringify(payload),
		encoding: 'utf8'
	});

	return {
		stdout: result.stdout ?? '',
		code: result.status ?? -1
	};
};

const LOCKFILES: Record<Manager, string> = {
	bun: 'bun.lock',
	npm: 'package-lock.json',
	pnpm: 'pnpm-lock.yaml',
	yarn: 'yarn.lock'
};

// husky writes its shim folder on install and the manager writes its lockfile; init writes the rest.
const listInitFiles = (project: string, pm: Manager): readonly string[] => {
	const files: string[] = [];

	const walk = (dir: string, name: string): void => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') {
				continue;
			}

			const relative = name === '' ? entry.name : `${name}/${entry.name}`;

			if (entry.isDirectory()) {
				walk(join(dir, entry.name), relative);
			} else {
				files.push(relative);
			}
		}
	};

	walk(project, '');

	return files
		.filter((file) => {
			return !file.startsWith('.husky/_') && file !== LOCKFILES[pm];
		})
		.sort();
};

const root = await mkdtemp(join(tmpdir(), 'jss-init-e2e-'));

const folders: string[] = [root];

afterAll(async () => {
	for (const dir of folders.splice(0)) {
		await rm(dir, {
			recursive: true,
			force: true
		});
	}
});

describe.runIf(enabled)('init end to end', () => {
	it.each(MANAGERS)(
		'creates a %s project that lints, typechecks, builds and runs',
		async (pm: Manager) => {
			if (!(await available(pm))) {
				if (pm === 'npm' || pm === 'pnpm') {
					throw new Error(`${pm} is required but not on PATH`);
				}

				console.log(`[init e2e] ${pm}: skipped, not on PATH`);

				return;
			}

			const started = Date.now();
			const project = join(root, `my-app-${pm}`);

			await run('node', [CLI, 'init', `my-app-${pm}`, '--pm', pm, '-y'], {
				cwd: root,
				timeout: TIMEOUT
			});

			await run(join(project, 'node_modules', '.bin', 'prettier'), ['--check', '.'], {
				cwd: project,
				timeout: TIMEOUT
			});

			const src = readFileSync(join(project, 'src', 'main.ts'), 'utf8');
			const hello = /console\.log\('(.*)'\)/.exec(src)?.[1] ?? '';

			for (const script of ['lint', 'typecheck', 'build'] as const) {
				await run(pm, ['run', script], {
					cwd: project,
					timeout: TIMEOUT
				});
			}

			const main = await run('node', ['dist/main.js'], {
				cwd: project,
				timeout: 60_000
			});

			expect(main.stdout.trim()).toBe(hello);

			expect(await gitOut(project, ['config', 'core.hooksPath'])).toBe('.husky/_');
			expect(await gitOut(project, ['symbolic-ref', '--short', 'HEAD'])).toBe('main');

			const packageJsonPath = join(project, 'package.json');
			const before = readFileSync(packageJsonPath, 'utf8');
			const packageJson = JSON.parse(before) as { packageManager?: string };

			expect(packageJson['packageManager']).toContain(`${pm}@`);

			const bins = join(project, 'node_modules', '.bin');

			await run(join(bins, 'prettier-package-json'), ['--write', 'package.json'], {
				cwd: project,
				timeout: 60_000
			});
			await run(join(bins, 'prettier'), ['--write', 'package.json'], {
				cwd: project,
				timeout: 60_000
			});

			expect(readFileSync(packageJsonPath, 'utf8')).toBe(before);

			const decided = (
				pm === 'pnpm'
					? [...DECIDED_FILES, 'pnpm-workspace.yaml', ...HARNESS_FILES]
					: [...DECIDED_FILES, ...HARNESS_FILES]
			).toSorted();

			expect(listInitFiles(project, pm)).toEqual(decided);

			const hook = runHook(project, {
				hook_event_name: 'SessionStart',
				session_id: 'e2e',
				source: 'startup'
			});

			expect(hook.code).toBe(0);

			const hookOutput = JSON.parse(hook.stdout) as {
				hookSpecificOutput: { hookEventName: string; additionalContext: string };
			};

			expect(hookOutput.hookSpecificOutput.hookEventName).toBe('SessionStart');
			expect(hookOutput.hookSpecificOutput.additionalContext).toContain('# Harness memory');

			console.log(`[init e2e] ${pm}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
		},
		TIMEOUT
	);

	it(
		'writes exactly the previous toolchain with --no-harness',
		async () => {
			const project = join(root, 'my-app-noharness');

			await run('node', [CLI, 'init', 'my-app-noharness', '--pm', 'npm', '--no-harness', '-y'], {
				cwd: root,
				timeout: TIMEOUT
			});

			expect(listInitFiles(project, 'npm')).toEqual([...DECIDED_FILES].toSorted());
		},
		TIMEOUT
	);

	it(
		'runs ak init with --agent-kit and a stub ak, and exits 1 without one',
		async () => {
			const stub = join(root, 'ak-stub');
			const calls = join(stub, 'calls.log');

			await mkdir(stub, { recursive: true });
			await writeFile(
				join(stub, 'ak'),
				`#!/bin/sh
echo "$@" >> ${JSON.stringify(calls)}
[ "$1" = "--version" ] && echo ak 1.0.0
exit 0
`,
				{ mode: 0o755 }
			);

			const withStub = {
				...process.env,
				PATH: `${stub}:${process.env['PATH'] ?? ''}`
			};

			const missing = await run(process.execPath, [CLI, 'init', 'no-ak', '--pm', 'npm', '--agent-kit', '-y'], {
				cwd: root,
				env: {
					...process.env,
					PATH: '/usr/bin:/bin'
				}
			}).then(
				() => {
					return 'ok';
				},
				(error: { stderr?: string }) => {
					return error.stderr ?? '';
				}
			);

			expect(missing).toContain('ak is not installed');
			expect(existsSync(join(root, 'no-ak'))).toBe(false);

			const project = join(root, 'with-ak');

			await run(process.execPath, [CLI, 'init', 'with-ak', '--pm', 'npm', '--agent-kit', '-y'], {
				cwd: root,
				env: withStub,
				timeout: TIMEOUT
			});

			expect(readFileSync(calls, 'utf8')).toContain('init --docs-dir .harness/docs --plans-dir .harness/plans');
			expect(listInitFiles(project, 'npm')).toEqual([...DECIDED_FILES, ...HARNESS_FILES].toSorted());
		},
		TIMEOUT
	);

	it(
		'sets up the project again in existing mode, stops on the second run, and replaces with -f',
		async () => {
			const source = join(root, 'my-app-pnpm');

			expect(existsSync(source), 'the pnpm create test should have left my-app-pnpm behind').toBe(true);

			const copy = join(root, 'existing-app');

			await cp(source, copy, { recursive: true });
			await rm(join(copy, 'node_modules'), {
				recursive: true,
				force: true
			});

			for (const owned of [
				'.vscode',
				'eslint.config.mjs',
				'.prettierrc.json',
				'.editorconfig',
				'commitlint.config.mjs'
			]) {
				rmSync(join(copy, owned), {
					recursive: true,
					force: true
				});
			}

			await run('node', [CLI, 'init', '-y'], {
				cwd: copy,
				timeout: TIMEOUT
			});

			expect(existsSync(join(copy, 'eslint.config.mjs'))).toBe(true);

			const workspace = readFileSync(join(copy, 'pnpm-workspace.yaml'), 'utf8');

			expect(workspace).toContain('esbuild: true');
			expect(workspace).toContain('unrs-resolver: true');

			const marker = join(copy, 'eslint.config.mjs');
			const before = readFileSync(marker, 'utf8');

			const again: { code?: number; stderr: string } = await run('node', [CLI, 'init', '-y'], {
				cwd: copy
			}).then(
				() => {
					return {
						code: 0,
						stderr: ''
					};
				},
				(error: unknown) => {
					return error as { code?: number; stderr: string };
				}
			);

			expect(again.code).toBe(1);
			expect(again.stderr).toContain('already exist');
			expect(readFileSync(marker, 'utf8')).toBe(before);

			await run('node', [CLI, 'init', '-f', '-y'], {
				cwd: copy,
				timeout: TIMEOUT
			});
		},
		TIMEOUT
	);
});
