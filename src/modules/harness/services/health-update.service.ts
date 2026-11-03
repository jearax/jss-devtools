import { PACKAGE } from '@/core/constants/package.constant';
import { CliError } from '@/core/errors/cli.error';

import { loadUpdateSession } from './staging.service';
import { readBaseCopy, readLiveFile } from './update-manifest.service';
import { compareHarnessVersions, INSTALL_COMMAND_LINE } from './update-release.service';

import type { HealthIssue } from '@/modules/harness/types/health-issue.type';
import type { InstalledManifest } from '@/modules/harness/types/update.type';

const versionIssue = (manifest: InstalledManifest | null): HealthIssue | null => {
	if (manifest === null) {
		return null;
	}

	const order = compareHarnessVersions(manifest.version, PACKAGE.version);

	if (order === 0) {
		return null;
	}

	if (order < 0) {
		return {
			level: 'warn',
			label: 'Version',
			detail: `harness ${manifest.version} installed, CLI is ${PACKAGE.version}`,
			nextStep: 'run jss-devtools harness update'
		};
	}

	return {
		level: 'warn',
		label: 'Version',
		detail: `installed by CLI ${manifest.version}, this CLI is ${PACKAGE.version}`,
		nextStep: INSTALL_COMMAND_LINE
	};
};

const managedDriftIssues = (root: string, manifest: InstalledManifest | null): readonly HealthIssue[] => {
	if (manifest === null) {
		return [];
	}

	const issues = manifest.files.flatMap((file) => {
		if (file.kind !== 'managed') {
			return [];
		}

		const live = readLiveFile(root, file.path);
		const base = readBaseCopy(root, file.path);

		if (live === null || base === null || live === base) {
			return [];
		}

		return [
			{
				level: 'warn' as const,
				label: 'Managed files',
				detail: `${file.path} changed from its base — \`harness update\` will merge it`
			}
		];
	});

	return issues;
};

const stagedUpdateIssue = (root: string): HealthIssue | null => {
	let session: ReturnType<typeof loadUpdateSession>;

	try {
		session = loadUpdateSession(root);
	} catch (error) {
		return {
			level: 'error',
			label: 'Staged update',
			detail:
				error instanceof CliError
					? error.message
					: 'the staged update could not be read — `harness update` refuses to run',
			nextStep: 'jss-devtools harness update --abort'
		};
	}

	if (session === null) {
		return null;
	}

	return {
		level: 'warn',
		label: 'Staged update',
		detail: 'a harness update is staged — run `jss-devtools harness update --continue` or `--abort`'
	};
};

export { managedDriftIssues, stagedUpdateIssue, versionIssue };
