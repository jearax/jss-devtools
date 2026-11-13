import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_DIRS = new Set(['node_modules', 'dist']);

const LOCKFILES = new Set([
	'package-lock.json',
	'pnpm-lock.yaml',
	'yarn.lock',
	'bun.lock',
	'bun.lockb',
	'npm-shrinkwrap.json'
]);

const collectFiles = (root, dir, files) => {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.DS_Store')) {
			continue;
		}

		const full = join(dir, entry.name);

		if (entry.isDirectory()) {
			if (!SKIP_DIRS.has(entry.name)) {
				collectFiles(root, full, files);
			}

			continue;
		}

		if (!LOCKFILES.has(entry.name)) {
			files.push(full);
		}
	}

	return files;
};

// `git check-ignore` exits 1 when nothing matches, so "no ignored paths" surfaces here
// as an error whose stdout is empty; any other failure is real and rethrown.
const ignoredPaths = (root, files) => {
	if (files.length === 0) {
		return new Set();
	}

	const parse = (output) => {
		return new Set(output.split('\0').filter(Boolean));
	};

	try {
		return parse(
			execFileSync('git', ['check-ignore', '--stdin', '-z'], {
				input: files
					.map((file) => {
						return relative(root, file);
					})
					.join('\0'),
				cwd: root,
				encoding: 'utf8'
			})
		);
	} catch (error) {
		const matches = error.status === 1 ? error.stdout : undefined;

		if (typeof matches !== 'string') {
			throw error;
		}

		return parse(matches);
	}
};

const readFrameworkTemplate = (framework) => {
	const root = fileURLToPath(new URL(`../templates/${framework}/`, import.meta.url));
	const files = collectFiles(root, root, []);
	const ignored = ignoredPaths(root, files);

	return Object.fromEntries(
		files
			.map((file) => {
				return relative(root, file);
			})
			.filter((path) => {
				return !ignored.has(path);
			})
			.sort()
			.map((path) => {
				return [path.replaceAll('\\', '/'), readFileSync(join(root, path), 'utf8')];
			})
	);
};

export { readFrameworkTemplate };
