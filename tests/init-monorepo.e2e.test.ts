import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { afterAll, describe, expect, it } from 'vitest';

import { CLI, TIMEOUT, available, run } from './support/init-e2e';

// Same gate as the single-package suite: needs the network, the built bundle and the managers
// on PATH. `INIT_E2E=1 pnpm vitest run tests/init-monorepo.e2e.test.ts tests/init.e2e.test.ts`.
const enabled = process.env['INIT_E2E'] === '1';

const MANAGERS = ['bun', 'pnpm', 'yarn', 'npm'] as const;

type Manager = (typeof MANAGERS)[number];

const runOut = promisify(execFile);

const gitOut = (cwd: string, args: readonly string[]): Promise<string> => {
	return runOut('git', args, { cwd }).then((result) => {
		return result.stdout.trim();
	});
};

const root = await mkdtemp(join(tmpdir(), 'jss-init-mono-e2e-'));

const folders: string[] = [root];

afterAll(async () => {
	for (const dir of folders.splice(0)) {
		await rm(dir, {
			recursive: true,
			force: true
		});
	}
});

describe.runIf(enabled)('init --monorepo end to end', () => {
	it.each(MANAGERS)(
		'creates a %s turborepo that lints, typechecks, builds, caches and runs',
		async (pm: Manager) => {
			if (!(await available(pm))) {
				if (pm === 'npm' || pm === 'pnpm') {
					throw new Error(`${pm} is required but not on PATH`);
				}

				console.log(`[init monorepo e2e] ${pm}: skipped, not on PATH`);

				return;
			}

			const started = Date.now();
			const project = join(root, `my-mono-${pm}`);

			await run('node', [CLI, 'init', `my-mono-${pm}`, '--monorepo', '--pm', pm, '-y'], {
				cwd: root,
				timeout: TIMEOUT
			});

			await run(join(project, 'node_modules', '.bin', 'prettier'), ['--check', '.'], {
				cwd: project,
				timeout: TIMEOUT
			});

			const appPackageJson = JSON.parse(readFileSync(join(project, 'apps', 'node', 'package.json'), 'utf8')) as {
				name: string;
				version: string;
			};

			expect(appPackageJson['name']).toBe(`@my-mono-${pm}/node`);
			expect(appPackageJson['version']).toBe('0.0.0');

			for (const script of ['lint', 'typecheck', 'build'] as const) {
				await run(pm, ['run', script], {
					cwd: project,
					timeout: TIMEOUT
				});
			}

			const cached = await run(pm, ['run', 'build'], {
				cwd: project,
				timeout: TIMEOUT
			});

			expect(`${cached.stdout}\n${cached.stderr}`).toContain('FULL TURBO');

			const src = readFileSync(join(project, 'apps', 'node', 'src', 'main.ts'), 'utf8');
			const hello = /console\.log\('(.*)'\)/.exec(src)?.[1] ?? '';

			const main = await run('node', ['apps/node/dist/main.js'], {
				cwd: project,
				timeout: 60_000
			});

			expect(main.stdout.trim()).toBe(hello);

			expect(await gitOut(project, ['rev-list', '--all'])).toBe('');

			console.log(`[init monorepo e2e] ${pm}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
		},
		TIMEOUT
	);
});
