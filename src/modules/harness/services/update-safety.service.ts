import { CliError } from '@/core/errors/cli.error';
import { HARNESS_BASE_DIR, HARNESS_UPDATE_DIR, HOOK_FILES } from '@/modules/harness/constants/harness-paths.constant';

import { SYMLINK_CHECKS } from './health-symlinks.service';
import { pathSafetyOf } from './path-safety.service';

import type { HarnessRelease, InstalledManifest } from '@/modules/harness/types/update.type';

export const ensureSafePaths = (cwd: string, manifest: InstalledManifest, release: HarnessRelease): void => {
	const manifestPaths = manifest.files.map((file) => {
		return file.path;
	});

	const upstreamPaths = release.files.map((file) => {
		return file.path;
	});

	const baseCopies = manifestPaths
		.filter((path) => {
			return !HOOK_FILES.includes(path);
		})
		.map((path) => {
			return `${HARNESS_BASE_DIR}/${path}`;
		});

	const checked = new Set([...manifestPaths, ...upstreamPaths, ...baseCopies, ...SYMLINK_CHECKS, HARNESS_UPDATE_DIR]);

	for (const path of checked) {
		const safety = pathSafetyOf(cwd, path);

		if (!safety.safe) {
			throw new CliError(`Refusing the update: ${path} ${safety.reason}`, {
				hint: 'Replace it with a real file or folder, then rerun'
			});
		}
	}
};
