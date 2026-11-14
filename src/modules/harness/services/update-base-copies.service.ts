import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CliError } from '@/core/errors/cli.error';
import { HARNESS_BASE_DIR, HOOK_FILES } from '@/modules/harness/constants/harness-paths.constant';

import { sha256 } from './install-plan.service';

import type { InstalledManifest } from '@/modules/harness/types/update.type';

const ensureBaseCopies = (cwd: string, manifest: InstalledManifest): void => {
	const missing = manifest.files.filter((file) => {
		return !existsSync(join(cwd, HARNESS_BASE_DIR, file.path));
	});

	if (missing.length > 0) {
		throw new CliError(
			`Missing base copies: ${missing
				.map((file) => {
					return file.path;
				})
				.join(', ')}`,
			{
				hint: 'Restore .harness/core from git, then rerun'
			}
		);
	}

	// A drifted base copy would silently merge the wrong release; hook files are restored verbatim instead.
	const drifted = manifest.files.filter((file) => {
		if (HOOK_FILES.includes(file.path)) {
			return false;
		}

		const content = readFileSync(join(cwd, HARNESS_BASE_DIR, file.path), 'utf8');

		return sha256(content) !== file.sha256;
	});

	if (drifted.length > 0) {
		throw new CliError(
			`Base copies do not match the manifest: ${drifted
				.map((file) => {
					return file.path;
				})
				.join(', ')}`,
			{
				hint: 'Run git checkout .harness/core, then rerun. If .harness/core is not in git, run jss-devtools init --force'
			}
		);
	}
};

export { ensureBaseCopies };
