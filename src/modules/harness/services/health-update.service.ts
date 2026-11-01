import { loadUpdateSession } from './staging.service';
import { readBaseCopy, readLiveFile } from './update-manifest.service';

import type { HealthIssue } from '@/modules/harness/types/health-issue.type';
import type { InstalledManifest } from '@/modules/harness/types/update.type';

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
	} catch {
		session = null;
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

export { managedDriftIssues, stagedUpdateIssue };
