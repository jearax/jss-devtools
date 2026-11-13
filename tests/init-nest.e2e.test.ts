import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer, type AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { CLI, TIMEOUT, available, run } from './support/init-e2e';

// Same gate as the other init suites: needs the network, the built bundle and the managers on PATH.
// The built app ships only the health route; `test:e2e` in the generated project drives the real
// HTTP checks through supertest, including the bad-body 400s in `vi` and `en`.
const enabled = process.env['INIT_E2E'] === '1';

const MANAGERS = ['bun', 'pnpm', 'yarn', 'npm'] as const;

type Manager = (typeof MANAGERS)[number];

const root = await mkdtemp(join(tmpdir(), 'jss-init-nest-e2e-'));

const folders: string[] = [root];

afterAll(async () => {
	for (const dir of folders.splice(0)) {
		await rm(dir, {
			recursive: true,
			force: true
		});
	}
});

const exitOf = (child: ChildProcess): Promise<void> => {
	return new Promise((resolve) => {
		child.once('exit', () => {
			resolve();
		});
	});
};

const freePort = (): Promise<number> => {
	return new Promise((resolve, reject) => {
		const server = createServer();

		server.unref();

		server.on('error', reject);
		server.listen(0, '127.0.0.1', () => {
			const port = (server.address() as AddressInfo).port;

			server.close(() => {
				resolve(port);
			});
		});
	});
};

const answersReady = async (port: number): Promise<void> => {
	const deadline = Date.now() + 30_000;

	while (Date.now() < deadline) {
		try {
			const response = await fetch(`http://127.0.0.1:${port}/health/ready`);

			if (response.status === 200) {
				return;
			}
		} catch {
			// the server is still booting
		}

		await new Promise((resolve) => {
			setTimeout(resolve, 300);
		});
	}

	throw new Error(`the app never answered GET /health/ready on port ${port}`);
};

const serveAndStop = async (cwd: string, mainPath: string): Promise<void> => {
	const port = await freePort();

	const child = spawn(process.execPath, [mainPath], {
		cwd,
		env: {
			...process.env,
			APP_PORT: String(port),
			NODE_ENV: 'prod'
		},
		stdio: 'ignore'
	});

	try {
		await answersReady(port);

		const courses = await fetch(`http://127.0.0.1:${port}/api/v1/courses`);

		if (courses.status !== 200) {
			throw new Error(`GET /api/v1/courses answered ${courses.status}`);
		}
	} finally {
		child.kill('SIGTERM');
		await exitOf(child);
	}
};

const serveHealthAndStop = async (cwd: string, mainPath: string): Promise<void> => {
	const port = await freePort();

	const child = spawn(process.execPath, [mainPath], {
		cwd,
		env: {
			...process.env,
			APP_PORT: String(port),
			NODE_ENV: 'prod'
		},
		stdio: 'ignore'
	});

	try {
		await answersReady(port);
	} finally {
		child.kill('SIGTERM');
		await exitOf(child);
	}
};

describe.runIf(enabled)('init --framework nest end to end', () => {
	it.each(MANAGERS)(
		'creates a %s nest app that lints, typechecks, tests, builds and serves',
		async (pm: Manager) => {
			if (!(await available(pm))) {
				if (pm === 'npm' || pm === 'pnpm') {
					throw new Error(`${pm} is required but not on PATH`);
				}

				console.log(`[init nest e2e] ${pm}: skipped, not on PATH`);

				return;
			}

			const started = Date.now();
			const project = join(root, `my-nest-${pm}`);

			await run('node', [CLI, 'init', `my-nest-${pm}`, '--framework', 'nest', '--pm', pm, '-y'], {
				cwd: root,
				timeout: TIMEOUT
			});

			await run(join(project, 'node_modules', '.bin', 'prettier'), ['--check', '.'], {
				cwd: project,
				timeout: TIMEOUT
			});

			const manifest = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8')) as { name: string };

			expect(manifest['name']).toBe(`my-nest-${pm}`);

			for (const script of ['lint', 'typecheck', 'test', 'test:e2e', 'build'] as const) {
				await run(pm, ['run', script], {
					cwd: project,
					timeout: TIMEOUT
				});
			}

			await serveAndStop(project, join('dist', 'main.js'));

			console.log(`[init nest e2e] ${pm}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
		},
		TIMEOUT
	);

	it.each(MANAGERS)(
		'creates a %s nest monorepo that builds through turbo, caches, tests and serves',
		async (pm: Manager) => {
			if (!(await available(pm))) {
				if (pm === 'npm' || pm === 'pnpm') {
					throw new Error(`${pm} is required but not on PATH`);
				}

				console.log(`[init nest monorepo e2e] ${pm}: skipped, not on PATH`);

				return;
			}

			const started = Date.now();
			const project = join(root, `my-nest-mono-${pm}`);
			const app = join(project, 'apps', 'nest');

			await run('node', [CLI, 'init', `my-nest-mono-${pm}`, '--monorepo', '--framework', 'nest', '--pm', pm, '-y'], {
				cwd: root,
				timeout: TIMEOUT
			});

			await run(join(project, 'node_modules', '.bin', 'prettier'), ['--check', '.'], {
				cwd: project,
				timeout: TIMEOUT
			});

			const appManifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')) as { name: string };

			expect(appManifest['name']).toBe(`@my-nest-mono-${pm}/nest`);

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

			for (const script of ['test', 'test:e2e'] as const) {
				await run(pm, ['run', script], {
					cwd: app,
					timeout: TIMEOUT
				});
			}

			await serveAndStop(project, join('apps', 'nest', 'dist', 'main.js'));

			console.log(`[init nest monorepo e2e] ${pm}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
		},
		TIMEOUT
	);

	it.each(MANAGERS)(
		'creates a %s nest app with --no-sample that lints, typechecks, tests, builds and serves',
		async (pm: Manager) => {
			if (!(await available(pm))) {
				if (pm === 'npm' || pm === 'pnpm') {
					throw new Error(`${pm} is required but not on PATH`);
				}

				console.log(`[init nest no-sample e2e] ${pm}: skipped, not on PATH`);

				return;
			}

			const started = Date.now();
			const project = join(root, `my-nest-bare-${pm}`);

			await run('node', [CLI, 'init', `my-nest-bare-${pm}`, '--framework', 'nest', '--no-sample', '--pm', pm, '-y'], {
				cwd: root,
				timeout: TIMEOUT
			});

			await run(join(project, 'node_modules', '.bin', 'prettier'), ['--check', '.'], {
				cwd: project,
				timeout: TIMEOUT
			});

			expect(existsSync(join(project, 'src', 'domains', '.gitkeep'))).toBe(true);
			expect(existsSync(join(project, 'src', 'domains', 'learning'))).toBe(false);
			expect(existsSync(join(project, 'test', 'course.e2e-spec.ts'))).toBe(false);

			const appModule = readFileSync(join(project, 'src', 'app', 'app.module.ts'), 'utf8');

			expect(appModule).not.toContain('CourseModule');

			for (const script of ['lint', 'typecheck', 'test', 'build'] as const) {
				await run(pm, ['run', script], {
					cwd: project,
					timeout: TIMEOUT
				});
			}

			await serveHealthAndStop(project, join('dist', 'main.js'));

			console.log(`[init nest no-sample e2e] ${pm}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
		},
		TIMEOUT
	);
});
