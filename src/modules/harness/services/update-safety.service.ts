import { CliError } from '@/core/errors/cli.error';
import {
	CLAUDE_SKILLS_DIR,
	HARNESS_BASE_DIR,
	HARNESS_DIR,
	HARNESS_UPDATE_DIR,
	HOOK_FILES
} from '@/modules/harness/constants/harness-paths.constant';

import { SYMLINK_CHECKS } from './health-symlinks.service';
import { pathSafetyOf } from './path-safety.service';
import { readLiveFile } from './update-manifest.service';

import type { HarnessRelease, InstalledManifest } from '@/modules/harness/types/update.type';

// The ignore files follow knowledge.share, which the manifest does not record: a flipped key
// must reach the planner even though the version stayed the same.
export const knowledgeInSync = (cwd: string, release: HarnessRelease): boolean => {
	const harnessGitignore = release.files.find((file) => {
		return file.path === `${HARNESS_DIR}/.gitignore`;
	});

	if (harnessGitignore !== undefined && readLiveFile(cwd, harnessGitignore.path) !== harnessGitignore.content) {
		return false;
	}

	const skillsGitignore = release.files.find((file) => {
		return file.path === `${CLAUDE_SKILLS_DIR}/.gitignore`;
	});

	if (skillsGitignore === undefined) {
		return readLiveFile(cwd, `${CLAUDE_SKILLS_DIR}/.gitignore`) === null;
	}

	return readLiveFile(cwd, skillsGitignore.path) === skillsGitignore.content;
};

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
