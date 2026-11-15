import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer, type AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { CLI, TIMEOUT, available, run } from './support/init-e2e';

// Same gate as the other init suites: needs the network, the built bundle and the managers on PATH.
const enabled = process.env['INIT_E2E'] === '1';

const MANAGERS = ['bun', 'pnpm', 'yarn', 'npm'] as const;

type Manager = (typeof MANAGERS)[number];

const root = await mkdtemp(join(tmpdir(), 'jss-init-react-e2e-'));

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

// Init makes the project a git repository but must never commit into it (decision 0031).
const noCommit = async (cwd: string): Promise<void> => {
	const log = await run('git', ['rev-list', '--all'], { cwd });

	expect(log.stdout.trim()).toBe('');
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

const portIsFree = (port: number): Promise<void> => {
	return new Promise((resolve, reject) => {
		const server = createServer();

		server.unref();

		server.on('error', reject);
		server.listen(port, '127.0.0.1', () => {
			server.close(() => {
				resolve();
			});
		});
	});
};

const previewReady = async (port: number): Promise<void> => {
	const deadline = Date.now() + 30_000;

	while (Date.now() < deadline) {
		try {
			const response = await fetch(`http://127.0.0.1:${port}/`);

			if (response.status === 200) {
				return;
			}
		} catch {
			// vite preview is still booting
		}

		await new Promise((resolve) => {
			setTimeout(resolve, 300);
		});
	}

	throw new Error(`vite preview never answered GET / on port ${port}`);
};

// yarn and npm hoist vite to the workspace root; pnpm and bun keep it beside the app. First hit wins.
const viteBin = (app: string, projectRoot: string): string => {
	const candidates = [
		join(app, 'node_modules', 'vite', 'bin', 'vite.js'),
		join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')
	];

	const found = candidates.find((candidate) => {
		return existsSync(candidate);
	});

	expect(found, 'the vite bin in the workspace').toBeDefined();

	return found!;
};

const previewAndStop = async (cwd: string, viteJs: string): Promise<void> => {
	const port = await freePort();

	const child = spawn(viteJs, ['preview', '--port', String(port), '--strictPort'], {
		cwd,
		stdio: 'ignore'
	});

	try {
		await previewReady(port);

		for (const path of ['/', '/dashboard']) {
			const response = await fetch(`http://127.0.0.1:${port}${path}`);

			expect(response.status, `GET ${path}`).toBe(200);
			expect(response.headers.get('content-type')).toContain('text/html');
			expect(await response.text()).toContain('<html');
		}
	} finally {
		child.kill('SIGTERM');
		await exitOf(child);
		await portIsFree(port);
	}
};

// The compiler's memo_cache_sentinel must sit in the lazy page chunks: the index chunk carries the
// name because React itself does, so a match anywhere proves nothing (phase 1 review).
const PAGE_CHUNKS = /^(?:Home|Login|Dashboard)-.+\.js$/;

const compilerMarker = (appRoot: string): void => {
	const assets = join(appRoot, 'dist', 'assets');

	const pages = readdirSync(assets).filter((name) => {
		return PAGE_CHUNKS.test(name);
	});

	expect(pages.length, 'lazy page chunks in dist/assets').toBeGreaterThanOrEqual(3);

	const unmarked = pages.filter((name) => {
		return !readFileSync(join(assets, name), 'utf8').includes('memo_cache_sentinel');
	});

	expect(unmarked, 'page chunks without memo_cache_sentinel').toEqual([]);
};

const runScripts = async (pm: Manager, cwd: string, scripts: readonly string[]): Promise<void> => {
	for (const script of scripts) {
		await run(pm, ['run', script], {
			cwd,
			timeout: TIMEOUT
		});
	}
};

describe.runIf(enabled)('init --framework react end to end', () => {
	it.each(MANAGERS)(
		'creates a %s react app that lints, typechecks, builds, carries the compiler marker and serves',
		async (pm: Manager) => {
			if (!(await available(pm))) {
				if (pm === 'npm' || pm === 'pnpm') {
					throw new Error(`${pm} is required but not on PATH`);
				}

				console.log(`[init react e2e] ${pm}: skipped, not on PATH`);

				return;
			}

			const started = Date.now();
			const project = join(root, `my-react-${pm}`);

			await run('node', [CLI, 'init', `my-react-${pm}`, '--framework', 'react', '--pm', pm, '-y'], {
				cwd: root,
				timeout: TIMEOUT
			});

			const manifest = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8')) as { name: string };

			expect(manifest['name']).toBe(`my-react-${pm}`);

			await noCommit(project);

			await runScripts(pm, project, ['lint', 'typecheck', 'build']);

			compilerMarker(project);

			await previewAndStop(project, viteBin(project, project));

			await run(join(project, 'node_modules', '.bin', 'prettier'), ['--check', '.'], {
				cwd: project,
				timeout: TIMEOUT
			});

			console.log(`[init react e2e] ${pm}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
		},
		TIMEOUT
	);

	it.each(MANAGERS)(
		'creates a %s react monorepo that builds through turbo and serves the app',
		async (pm: Manager) => {
			if (!(await available(pm))) {
				if (pm === 'npm' || pm === 'pnpm') {
					throw new Error(`${pm} is required but not on PATH`);
				}

				console.log(`[init react monorepo e2e] ${pm}: skipped, not on PATH`);

				return;
			}

			const started = Date.now();
			const project = join(root, `my-react-mono-${pm}`);
			const app = join(project, 'apps', 'react');

			await run('node', [CLI, 'init', `my-react-mono-${pm}`, '--monorepo', '--framework', 'react', '--pm', pm, '-y'], {
				cwd: root,
				timeout: TIMEOUT
			});

			const appManifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')) as { name: string };

			expect(appManifest['name']).toBe(`@my-react-mono-${pm}/react`);

			await noCommit(project);

			await runScripts(pm, project, ['lint', 'typecheck', 'build']);

			const cached = await run(pm, ['run', 'build'], {
				cwd: project,
				timeout: TIMEOUT
			});

			expect(`${cached.stdout}\n${cached.stderr}`).toContain('FULL TURBO');

			compilerMarker(app);

			await previewAndStop(app, viteBin(app, project));

			await run(join(project, 'node_modules', '.bin', 'prettier'), ['--check', '.'], {
				cwd: project,
				timeout: TIMEOUT
			});

			console.log(`[init react monorepo e2e] ${pm}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
		},
		TIMEOUT * 2
	);
});
