import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';

import { CliError } from '@/core/errors/cli.error';

const textReasonOf = (root: string, path: string): string | null => {
	if (path === '' || isAbsolute(path)) {
		return 'is an absolute path';
	}

	if (path.split(/[/\\]/).includes('..')) {
		return 'contains a ".." segment';
	}

	const base = resolve(root);

	return resolve(base, path).startsWith(base + sep) ? null : 'is outside the repository';
};

/**
 * Answers whether a repository-relative path is safe to read or write: it passes the textual
 * check, no existing component below the root is a symlink, and the real path of its deepest
 * existing ancestor stays inside the real root (the root itself may sit behind a symlink).
 */
export const pathSafetyOf = (root: string, path: string): { safe: boolean; reason: string | null } => {
	const textual = textReasonOf(root, path);

	if (textual !== null) {
		return {
			safe: false,
			reason: textual
		};
	}

	const rootAbsolute = resolve(root);
	const full = resolve(rootAbsolute, path);
	const relative = full.slice(rootAbsolute.length + 1);

	let deepest = rootAbsolute;

	for (const segment of relative.split(sep)) {
		const candidate = join(deepest, segment);

		let stats;

		try {
			stats = lstatSync(candidate);
		} catch {
			break;
		}

		if (stats.isSymbolicLink()) {
			return {
				safe: false,
				reason: 'is a symlink'
			};
		}

		deepest = candidate;
	}

	const realRoot = realpathSync(rootAbsolute);
	const realDeepest = realpathSync(deepest);

	if (realDeepest !== realRoot && !realDeepest.startsWith(realRoot + sep)) {
		return {
			safe: false,
			reason: 'resolves outside the repository'
		};
	}

	return {
		safe: true,
		reason: null
	};
};

export const isSafePath = (root: string, path: string): boolean => {
	return pathSafetyOf(root, path).safe;
};

/** An unsafe or missing file reads as `null`; the hooks skip it as if it were missing. */
export const safeReadFile = (root: string, path: string): string | null => {
	if (!isSafePath(root, path)) {
		return null;
	}

	const full = join(root, path);

	return existsSync(full) ? readFileSync(full, 'utf8') : null;
};

/** An unsafe file is not written; the caller decides whether that is an error. */
export const safeWriteFile = (root: string, path: string, content: string): boolean => {
	if (!isSafePath(root, path)) {
		return false;
	}

	const full = join(root, path);

	mkdirSync(dirname(full), {
		recursive: true
	});

	writeFileSync(full, content);

	return true;
};

export const assertRepositoryPath = (root: string, path: string, source: string, hint: string): void => {
	const safety = pathSafetyOf(root, path);

	if (safety.safe) {
		return;
	}

	throw new CliError(`${source} names an unsafe path: ${path} ${safety.reason}`, { hint });
};
