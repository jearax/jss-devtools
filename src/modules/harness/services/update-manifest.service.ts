import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CliError } from '@/core/errors/cli.error';
import { HARNESS_BASE_DIR, HARNESS_MANIFEST } from '@/modules/harness/constants/harness-paths.constant';

import { assertRepositoryPath } from './path-safety.service';

import type { InstalledManifest, ManifestFile } from '@/modules/harness/types/update.type';

export const readManifest = (cwd: string): InstalledManifest => {
	const path = join(cwd, HARNESS_MANIFEST);

	if (!existsSync(path)) {
		throw new CliError('No harness manifest here', {
			label: 'To install it',
			commands: ['jss-devtools init']
		});
	}

	const manifest = JSON.parse(readFileSync(path, 'utf8')) as InstalledManifest;

	if (!Array.isArray(manifest.files)) {
		throw new CliError(`${HARNESS_MANIFEST} has no file list`);
	}

	for (const file of manifest.files) {
		const filePath = (file as { path?: unknown }).path;

		if (typeof filePath !== 'string') {
			throw new CliError(`${HARNESS_MANIFEST} has a file entry without a path`);
		}

		assertRepositoryPath(cwd, filePath, HARNESS_MANIFEST, 'Restore .harness/core from git, then rerun');
	}

	return manifest;
};

export const manifestEntryOf = (manifest: InstalledManifest, path: string): ManifestFile | null => {
	return (
		manifest.files.find((file) => {
			return file.path === path;
		}) ?? null
	);
};

export const readBaseCopy = (cwd: string, path: string): string | null => {
	return readIfPresent(cwd, `${HARNESS_BASE_DIR}/${path}`);
};

export const readLiveFile = (cwd: string, path: string): string | null => {
	return readIfPresent(cwd, path);
};

const readIfPresent = (cwd: string, name: string): string | null => {
	const full = join(cwd, name);

	return existsSync(full) ? readFileSync(full, 'utf8') : null;
};
