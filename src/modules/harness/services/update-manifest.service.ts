import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CliError } from '@/core/errors/cli.error';
import { HARNESS_BASE_DIR, HARNESS_MANIFEST } from '@/modules/harness/constants/harness-paths.constant';

import { assertRepositoryPath, pathSafetyOf } from './path-safety.service';
import { parseHarnessVersion } from './update-release.service';

import type { InstalledManifest, ManifestFile } from '@/modules/harness/types/update.type';

export const readManifest = (cwd: string): InstalledManifest => {
	const path = join(cwd, HARNESS_MANIFEST);

	if (!existsSync(path)) {
		throw new CliError('No harness manifest here', {
			label: 'To install it',
			commands: ['jss-devtools init']
		});
	}

	const safety = pathSafetyOf(cwd, HARNESS_MANIFEST);

	if (!safety.safe) {
		throw new CliError(`Refusing to read ${HARNESS_MANIFEST}: it ${safety.reason}`, {
			hint: 'Restore .harness/core from git, then rerun'
		});
	}

	const manifest = JSON.parse(readFileSync(path, 'utf8')) as InstalledManifest;

	if (!Array.isArray(manifest.files)) {
		throw new CliError(`${HARNESS_MANIFEST} has no file list`);
	}

	if (typeof manifest.version !== 'string' || !parseHarnessVersion(manifest.version)) {
		throw new CliError(
			`${HARNESS_MANIFEST} has version "${String((manifest as { version?: unknown }).version)}" which is not semver`,
			{
				hint: 'Restore .harness/core from git, then rerun'
			}
		);
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

	if (!existsSync(full)) {
		return null;
	}

	const safety = pathSafetyOf(cwd, name);

	if (!safety.safe) {
		throw new CliError(`Refusing to read ${name}: it ${safety.reason}`, {
			hint: 'Restore .harness/core from git, then rerun'
		});
	}

	return readFileSync(full, 'utf8');
};
