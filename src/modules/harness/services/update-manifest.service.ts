import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CliError } from '@/core/errors/cli.error';
import { HARNESS_BASE_DIR, HARNESS_MANIFEST } from '@/modules/harness/constants/harness-paths.constant';

import type { InstalledManifest, ManifestFile } from '@/modules/harness/types/update.type';

export const readManifest = (cwd: string): InstalledManifest => {
	const path = join(cwd, HARNESS_MANIFEST);

	if (!existsSync(path)) {
		throw new CliError('No harness manifest here', {
			label: 'To install it',
			commands: ['jss-devtools init']
		});
	}

	return JSON.parse(readFileSync(path, 'utf8')) as InstalledManifest;
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
