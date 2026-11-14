import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PACKAGE } from '@/core/constants/package.constant';
import { HOOK_BUNDLE_PATH, HOOK_FILES, HOOK_SHIM_PATH } from '@/modules/harness/constants/harness-paths.constant';
import { harnessHookBundle } from '@/modules/harness/constants/hook-bundle.constant';
import { hookShimTemplate } from '@/modules/harness/templates/hook-shim.template';

import { versionIssue } from './health-update.service';
import { sha256 } from './install-plan.service';
import { compareHarnessVersions } from './update-release.service';

import type { HealthContext, HealthIssue } from '@/modules/harness/types/health-issue.type';

type HookFilesStatus = {
	issues: readonly HealthIssue[];
	/** True only when the manifest version equals the CLI's and both files are byte-equal to it. */
	match: boolean;
};

const readOrNull = (path: string): string | null => {
	return existsSync(path) ? readFileSync(path, 'utf8') : null;
};

const hookFilesStatus = (root: string, manifest: HealthContext['manifest']): HookFilesStatus => {
	const issues: HealthIssue[] = [];

	for (const path of HOOK_FILES) {
		if (!existsSync(join(root, path))) {
			issues.push({
				level: 'error',
				label: 'Hook files',
				detail: `${path} is missing`,
				nextStep: 'jss-devtools harness update'
			});
		}
	}

	const recorded = manifest?.files.find((file) => {
		return file.path === HOOK_BUNDLE_PATH;
	});

	if (recorded !== undefined) {
		const bundleLive = readOrNull(join(root, HOOK_BUNDLE_PATH));

		if (bundleLive !== null && sha256(bundleLive) !== recorded.sha256) {
			issues.push({
				level: 'error',
				label: 'Hook files',
				detail: `${HOOK_BUNDLE_PATH} differs from the manifest hash`,
				nextStep: 'jss-devtools harness update'
			});
		}
	}

	const sameVersion = manifest !== null && compareHarnessVersions(manifest.version, PACKAGE.version) === 0;
	let match = false;

	if (sameVersion) {
		const shipped: readonly [string, string][] = [
			[HOOK_BUNDLE_PATH, harnessHookBundle],
			[HOOK_SHIM_PATH, hookShimTemplate(PACKAGE.nodeFloor)]
		];

		for (const [path, expected] of shipped) {
			const live = readOrNull(join(root, path));

			if (live !== null && live !== expected) {
				issues.push({
					level: 'error',
					label: 'Hook files',
					detail: `${path} is not the file this CLI ships: it was changed outside harness update`,
					nextStep: 'Read git log -p -- .harness/bin, then run jss-devtools harness update'
				});
			}
		}

		match = issues.length === 0;
	} else if (manifest !== null) {
		issues.push({
			level: 'warn',
			label: 'Hook files',
			detail: `not verified: the harness is ${manifest.version}, this CLI is ${PACKAGE.version}; the hook files are compared at the same version only`,
			nextStep: versionIssue(manifest)?.nextStep ?? 'run jss-devtools harness update'
		});
	}

	return {
		issues,
		match
	};
};

export { hookFilesStatus };
export type { HookFilesStatus };
